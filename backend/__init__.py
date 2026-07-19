"""Backend package init – wire Celery into Django on import."""
from .celery import app as celery_app

__all__ = ("celery_app",)
