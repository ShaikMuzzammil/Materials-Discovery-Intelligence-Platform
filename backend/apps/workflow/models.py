"""Workflow orchestration models – DAG of pipeline steps."""
from django.db import models
from django.conf import settings


class Workflow(models.Model):
    """A reusable pipeline of steps (e.g. 'Battery Materials Discovery Pipeline')."""

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    domain = models.CharField(max_length=40, blank=True)
    steps = models.JSONField(default=list, help_text="List of step definitions")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="workflows"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({len(self.steps)} steps)"


class WorkflowRun(models.Model):
    """A single execution of a workflow."""

    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="runs")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    current_step = models.PositiveIntegerField(default=0)
    step_results = models.JSONField(default=list, help_text="Result of each step")
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.FloatField(default=0.0)
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.workflow.name} #{self.id} ({self.status})"


# Predefined workflow templates
WORKFLOW_TEMPLATES = {
    "battery_discovery": {
        "name": "Battery Materials Discovery Pipeline",
        "description": "End-to-end pipeline: ingest papers → extract entities → build KG → train models → recommend materials",
        "domain": "battery",
        "steps": [
            {"id": "ingest", "name": "Ingest papers from arXiv", "type": "ingestion", "params": {"query": "lithium battery cathode", "max_results": 20}},
            {"id": "extract", "name": "Extract entities + relations", "type": "extraction", "params": {}},
            {"id": "build_kg", "name": "Build knowledge graph", "type": "kg_build", "params": {}},
            {"id": "index", "name": "Vector-index for RAG", "type": "vector_index", "params": {}},
            {"id": "train", "name": "Train ML models", "type": "training", "params": {"domain": "battery", "target": "all", "algorithm": "random_forest"}},
            {"id": "evaluate", "name": "Evaluate models", "type": "evaluation", "params": {}},
            {"id": "report", "name": "Generate report", "type": "report", "params": {"format": "markdown"}},
        ],
    },
    "multi_domain_comparison": {
        "name": "Multi-Domain Comparison Pipeline",
        "description": "Train models for all 7 domains and compare performance",
        "domain": "all",
        "steps": [
            {"id": "analyze", "name": "Analyze all datasets", "type": "analysis", "params": {}},
            {"id": "train_all", "name": "Train models for all 7 domains", "type": "training", "params": {"domain": "all", "target": "all", "algorithm": "random_forest"}},
            {"id": "compare", "name": "Compare model performance", "type": "comparison", "params": {}},
            {"id": "report", "name": "Generate comparison report", "type": "report", "params": {"format": "markdown"}},
        ],
    },
    "single_domain_optimization": {
        "name": "Single Domain Optimization Pipeline",
        "description": "Hyperparameter optimization for a single domain",
        "domain": "battery",
        "steps": [
            {"id": "analyze", "name": "Analyze dataset", "type": "analysis", "params": {}},
            {"id": "baseline", "name": "Train baseline model", "type": "training", "params": {"algorithm": "random_forest"}},
            {"id": "tune", "name": "Hyperparameter tuning", "type": "tuning", "params": {"n_trials": 30}},
            {"id": "retrain", "name": "Retrain with best params", "type": "training", "params": {}},
            {"id": "evaluate", "name": "Compare before/after", "type": "evaluation", "params": {}},
        ],
    },
}
