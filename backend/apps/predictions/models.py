"""Prediction log – track every prediction call for audit + improvement."""
from django.db import models
from django.conf import settings


class PredictionRequest(models.Model):
    """A user-issued prediction request + its result."""

    TARGET_CHOICES = [
        ("capacity_mah_g", "Specific capacity (mAh/g)"),
        ("cycle_life", "Cycle life"),
        ("voltage_v", "Average voltage (V)"),
        ("energy_density_wh_kg", "Energy density (Wh/kg)"),
        ("safety_score", "Safety score (0-1)"),
        ("cost_usd_kg", "Cost (USD/kg)"),
    ]

    target = models.CharField(max_length=40, choices=TARGET_CHOICES)
    inputs = models.JSONField(help_text="Feature dict sent to the model")
    prediction = models.FloatField(null=True, blank=True)
    confidence_low = models.FloatField(null=True, blank=True)
    confidence_high = models.FloatField(null=True, blank=True)
    model_name = models.CharField(max_length=200)
    model_version = models.CharField(max_length=80, blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="predictions"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["target", "created_at"])]


class ModelRegistry(models.Model):
    """Registry of available trained models."""

    name = models.CharField(max_length=200, unique=True)
    target = models.CharField(max_length=40, choices=PredictionRequest.TARGET_CHOICES)
    algorithm = models.CharField(max_length=80, help_text="xgboost / random_forest / mlp / linear")
    file_path = models.CharField(max_length=400, blank=True)
    metrics = models.JSONField(default=dict, help_text="{'rmse': 12.3, 'r2': 0.87, 'mae': 9.8}")
    feature_columns = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    trained_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.algorithm}) → {self.target}"
