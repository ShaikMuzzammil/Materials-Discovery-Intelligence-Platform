"""Context processor that exposes app metadata to all templates."""
from django.conf import settings


def app_meta(request):
    return {
        "APP_NAME": getattr(settings, "APP_NAME", "MatDiscoverAI"),
        "APP_VERSION": getattr(settings, "APP_VERSION", "1.0.0"),
        "DEFAULT_DOMAIN": settings.ML_SETTINGS["DEFAULT_DOMAIN"].title(),
    }
