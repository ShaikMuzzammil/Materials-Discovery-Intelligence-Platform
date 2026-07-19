"""Domains app – unified interface for all 7 material domains.

Instead of 7 separate apps, this single app provides:
- Predict for any domain
- Train models for any domain
- Analyze datasets for any domain
- Compare models across domains
- Explain predictions (SHAP) for any domain
- Uncertainty quantification for any domain
"""
from django.apps import AppConfig


class DomainsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.apps.domains"
    label = "domains"
