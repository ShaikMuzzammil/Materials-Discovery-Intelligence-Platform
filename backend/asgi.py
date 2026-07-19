"""ASGI config for MatDiscoverAI – exposes Django + Channels + ASGI workers."""
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.core.asgi import get_asgi_application
application = get_asgi_application()
