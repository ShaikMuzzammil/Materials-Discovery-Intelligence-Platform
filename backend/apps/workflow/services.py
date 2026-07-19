"""Workflow orchestration – execute pipelines of ML/NLP/KG steps."""
from __future__ import annotations
import time
import logging
from django.utils import timezone
from .models import Workflow, WorkflowRun, WORKFLOW_TEMPLATES

log = logging.getLogger(__name__)


def create_workflow_from_template(template_key: str) -> Workflow:
    """Create a Workflow from a predefined template."""
    template = WORKFLOW_TEMPLATES.get(template_key)
    if not template:
        raise ValueError(f"Unknown template: {template_key}. Available: {list(WORKFLOW_TEMPLATES.keys())}")
    workflow, _ = Workflow.objects.get_or_create(
        name=template["name"],
        defaults={
            "description": template["description"],
            "domain": template["domain"],
            "steps": template["steps"],
        },
    )
    return workflow


def execute_step(step: dict, context: dict) -> dict:
    """Execute a single workflow step. Returns result dict."""
    step_type = step.get("type")
    params = step.get("params", {})
    log.info("Executing step: %s (%s)", step.get("name"), step_type)

    try:
        if step_type == "ingestion":
            from backend.apps.papers.services import search_arxiv
            query = params.get("query", "lithium battery")
            max_results = params.get("max_results", 10)
            papers = search_arxiv(query, max_results=max_results)
            return {"status": "ok", "papers_added": len(papers)}

        elif step_type == "extraction":
            from backend.apps.extraction.services import run_full_extraction
            from backend.apps.papers.models import Paper
            papers = Paper.objects.all()
            if params.get("paper_id"):
                papers = papers.filter(pk=params["paper_id"])
            results = []
            for p in papers[:params.get("limit", 50)]:
                r = run_full_extraction(p.id)
                results.append(r)
            return {"status": "ok", "n_papers": len(results), "results": results}

        elif step_type == "kg_build":
            from backend.apps.knowledge_graph.services import build_graph_from_papers
            G = build_graph_from_papers(save_snapshot=True)
            return {"status": "ok", "nodes": G.number_of_nodes(), "edges": G.number_of_edges()}

        elif step_type == "vector_index":
            from ml.llm.rag_pipeline import index_paper
            from backend.apps.papers.models import Paper
            total = 0
            for p in Paper.objects.all()[:params.get("limit", 50)]:
                n = index_paper(p.id)
                total += n
            return {"status": "ok", "indexed_chunks": total}

        elif step_type == "training":
            from ml.models.universal_trainer import train_all_models_for_domain, train_model, train_all_models
            domain = params.get("domain", "battery")
            target = params.get("target", "all")
            algorithm = params.get("algorithm", "random_forest")
            if domain == "all":
                results = train_all_models([algorithm])
                return {"status": "ok", "results": {k: [r.__dict__ for r in v] for k, v in results.items()}}
            elif target == "all":
                results = train_all_models_for_domain(domain, [algorithm])
                return {"status": "ok", "results": [r.__dict__ for r in results]}
            else:
                r = train_model(domain, target, algorithm, save=True)
                return {"status": "ok", "result": r.__dict__}

        elif step_type == "tuning":
            from ml.models.tuning import tune_model
            domain = params.get("domain", context.get("domain", "battery"))
            target = params.get("target", context.get("target", "capacity_mah_g"))
            algorithm = params.get("algorithm", "random_forest")
            n_trials = params.get("n_trials", 20)
            r = tune_model(domain, target, algorithm, n_trials=n_trials)
            return {"status": "ok", "best_params": r.best_params, "best_score": r.best_score}

        elif step_type == "evaluation":
            from ml.models.universal_trainer import list_trained_models
            models = list_trained_models()
            return {"status": "ok", "n_models": len(models), "models": models[:20]}

        elif step_type == "analysis":
            from ml.evaluation.analyzer import compare_datasets
            return {"status": "ok", "comparison": compare_datasets()}

        elif step_type == "comparison":
            from ml.evaluation.analyzer import compare_datasets
            return {"status": "ok", "comparison": compare_datasets()}

        elif step_type == "report":
            from backend.apps.exports.services import export_full_comparison_markdown
            response = export_full_comparison_markdown()
            return {"status": "ok", "report_size": len(response.content), "format": params.get("format", "markdown")}

        else:
            return {"status": "skipped", "reason": f"Unknown step type: {step_type}"}

    except Exception as e:
        log.exception("Step failed: %s", step.get("name"))
        return {"status": "error", "error": str(e)}


def run_workflow(workflow_id: int) -> WorkflowRun:
    """Execute a workflow end-to-end."""
    workflow = Workflow.objects.get(pk=workflow_id)
    run = WorkflowRun.objects.create(
        workflow=workflow, status="running",
        started_at=timezone.now(),
    )
    context = {"domain": workflow.domain}
    step_results = []

    try:
        for i, step in enumerate(workflow.steps):
            run.current_step = i
            run.save(update_fields=["current_step"])
            log.info("Workflow %s: step %d/%d - %s", workflow_id, i + 1, len(workflow.steps), step.get("name"))
            result = execute_step(step, context)
            step_results.append({
                "step": step.get("name"),
                "type": step.get("type"),
                "result": result,
                "timestamp": timezone.now().isoformat(),
            })
            run.step_results = step_results
            run.save(update_fields=["step_results"])
            if result.get("status") == "error":
                run.status = "failed"
                run.error_log = result.get("error", "")
                break

        if run.status != "failed":
            run.status = "completed"
    except Exception as e:
        log.exception("Workflow run failed")
        run.status = "failed"
        run.error_log = str(e)
    finally:
        run.finished_at = timezone.now()
        if run.started_at:
            run.duration_seconds = (run.finished_at - run.started_at).total_seconds()
        run.save()

    return run
