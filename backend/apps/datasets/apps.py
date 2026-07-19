"""Datasets app – CRUD for material datasets + upload + analysis."""
from django.apps import AppConfig


class DatasetsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.apps.datasets"
    label = "datasets"
