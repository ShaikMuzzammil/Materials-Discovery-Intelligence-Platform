"""Workflow app – orchestrate pipelines of ML/NLP/KG steps."""
from django.shortcuts import render, get_object_or_404
from django.urls import path
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Workflow, WorkflowRun, WORKFLOW_TEMPLATES
from .services import create_workflow_from_template, run_workflow


@api_view(["GET"])
@drf_perm([AllowAny])
def templates_view(request):
    """List predefined workflow templates."""
    return Response({"templates": WORKFLOW_TEMPLATES})


@api_view(["GET"])
@drf_perm([AllowAny])
def workflow_list_view(request):
    """List all workflows."""
    return Response({
        "workflows": [
            {
                "id": w.id, "name": w.name, "description": w.description,
                "domain": w.domain, "n_steps": len(w.steps),
                "created_at": w.created_at.isoformat(),
            }
            for w in Workflow.objects.all()
        ]
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def workflow_detail_view(request, pk: int):
    """Get a workflow + its runs."""
    w = get_object_or_404(Workflow, pk=pk)
    runs = w.runs.all()[:20]
    return Response({
        "workflow": {
            "id": w.id, "name": w.name, "description": w.description,
            "domain": w.domain, "steps": w.steps,
        },
        "runs": [
            {
                "id": r.id, "status": r.status, "current_step": r.current_step,
                "duration_seconds": r.duration_seconds,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
                "n_step_results": len(r.step_results),
            }
            for r in runs
        ],
    })


@api_view(["POST"])
@drf_perm([AllowAny])
def create_from_template_view(request):
    """Create a workflow from a template."""
    template_key = request.data.get("template_key")
    if not template_key:
        return Response({"error": "template_key required"}, status=400)
    try:
        w = create_workflow_from_template(template_key)
        return Response({"workflow_id": w.id, "name": w.name})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@drf_perm([AllowAny])
def run_workflow_view(request, pk: int):
    """Execute a workflow."""
    w = get_object_or_404(Workflow, pk=pk)
    run = run_workflow(w.id)
    return Response({
        "run_id": run.id,
        "status": run.status,
        "duration_seconds": run.duration_seconds,
        "n_steps_completed": len(run.step_results),
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def run_detail_view(request, pk: int):
    """Get details of a workflow run."""
    r = get_object_or_404(WorkflowRun, pk=pk)
    return Response({
        "id": r.id, "workflow_id": r.workflow_id,
        "status": r.status, "current_step": r.current_step,
        "step_results": r.step_results,
        "duration_seconds": r.duration_seconds,
        "started_at": r.started_at.isoformat() if r.started_at else None,
        "finished_at": r.finished_at.isoformat() if r.finished_at else None,
        "error_log": r.error_log,
    })


# Template views
def workflow_landing_view(request):
    workflows = Workflow.objects.all()
    return render(request, "workflow/landing.html", {
        "workflows": workflows,
        "templates": WORKFLOW_TEMPLATES,
        "section": "workflow",
    })


def workflow_detail_template_view(request, pk: int):
    w = get_object_or_404(Workflow, pk=pk)
    runs = w.runs.all()[:20]
    return render(request, "workflow/detail.html", {
        "workflow": w, "runs": runs, "section": "workflow",
    })


urlpatterns = [
    # API
    path("api/templates/", templates_view, name="api-workflow-templates"),
    path("api/", workflow_list_view, name="api-workflow-list"),
    path("api/<int:pk>/", workflow_detail_view, name="api-workflow-detail"),
    path("api/create-from-template/", create_from_template_view, name="api-workflow-create"),
    path("api/<int:pk>/run/", run_workflow_view, name="api-workflow-run"),
    path("api/runs/<int:pk>/", run_detail_view, name="api-workflow-run-detail"),
    # Templates
    path("", workflow_landing_view, name="workflow-landing"),
    path("<int:pk>/", workflow_detail_template_view, name="workflow-detail"),
]
