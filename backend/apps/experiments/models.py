"""Experiment tracking models – MLflow-style.

Tracks every training run with: domain, target, algorithm, hyperparameters,
metrics, feature importance, model path, duration.
"""
from django.db import models
from django.conf import settings


class Experiment(models.Model):
    """A logical grouping of training runs (e.g. 'battery capacity optimization')."""

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    domain = models.CharField(max_length=40, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="experiments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.name} ({self.domain})"


class TrainingRun(models.Model):
    """A single training execution with metrics + hyperparameters."""

    STATUS_CHOICES = [
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name="runs", null=True, blank=True)
    domain = models.CharField(max_length=40)
    target = models.CharField(max_length=80)
    algorithm = models.CharField(max_length=40)
    hyperparameters = models.JSONField(default=dict, blank=True)
    metrics = models.JSONField(default=dict, blank=True)
    feature_importance = models.JSONField(default=dict, blank=True)
    model_path = models.CharField(max_length=400, blank=True)
    dataset_n_samples = models.PositiveIntegerField(default=0)
    dataset_n_features = models.PositiveIntegerField(default=0)
    duration_seconds = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="running")
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["domain", "target"]),
            models.Index(fields=["algorithm"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.domain}/{self.target}/{self.algorithm} ({self.status})"


class HyperparameterTuningRun(models.Model):
    """A single hyperparameter tuning execution."""

    training_run = models.OneToOneField(TrainingRun, on_delete=models.CASCADE, related_name="tuning", null=True, blank=True)
    domain = models.CharField(max_length=40)
    target = models.CharField(max_length=80)
    algorithm = models.CharField(max_length=40)
    n_trials = models.PositiveIntegerField(default=20)
    best_params = models.JSONField(default=dict)
    best_score = models.FloatField(default=0.0)
    all_trials = models.JSONField(default=list, blank=True)
    duration_seconds = models.FloatField(default=0.0)
    method = models.CharField(max_length=40, default="optuna")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tune {self.domain}/{self.target}/{self.algorithm} (R²={self.best_score:.3f})"
