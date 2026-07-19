"""WSGI config for MatDiscoverAI – used by Gunicorn / Render / Vercel."""
import os
from django.core.wsgi import get_wsgi_application
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
application = get_wsgi_application()
