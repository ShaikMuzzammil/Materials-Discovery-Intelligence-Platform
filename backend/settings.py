"""
Django settings for MatDiscoverAI project.
Production-ready, environment-driven configuration.
"""
import os
from pathlib import Path
import environ
import dj_database_url

# ------------------------------------------------------------------
# Paths
# ------------------------------------------------------------------
# settings.py lives at: <project_root>/backend/settings.py
# So BASE_DIR = parent.parent = <project_root>/
BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------
env = environ.Env(
    DJANGO_DEBUG=(bool, False),
    DJANGO_SECRET_KEY=(str, "django-insecure-default-key-change-me"),
    DJANGO_ALLOWED_HOSTS=(str, "*"),
)
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["*"])

# ------------------------------------------------------------------
# Applications
# ------------------------------------------------------------------
INSTALLED_APPS = [
    "daphne",  # ASGI server (placed before django.contrib.staticfiles)
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",

    # 3rd-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "django_extensions",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "django_celery_results",

    # Local apps
    "backend.apps.accounts",
    "backend.apps.papers",
    "backend.apps.extraction",
    "backend.apps.knowledge_graph",
    "backend.apps.materials",
    "backend.apps.predictions",
    "backend.apps.llm_chat",
    "backend.apps.dashboard",
    "backend.apps.domains",
    "backend.apps.datasets",
    "backend.apps.experiments",
    "backend.apps.exports",
    "backend.apps.workflow",
    "backend.apps.monitoring",
    "backend.apps.analytics",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "backend.context_processors.app_meta",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"
ASGI_APPLICATION = "backend.asgi.application"

# ------------------------------------------------------------------
# Database
# ------------------------------------------------------------------
DATABASES = {
    "default": dj_database_url.config(
        default=env("DATABASE_URL", default="sqlite:///db.sqlite3"),
        conn_max_age=600,
    )
}
# Only require SSL for Postgres in production (not SQLite)
if not DEBUG and DATABASES["default"]["ENGINE"].startswith("django.db.backends.postgresql"):
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"].setdefault("sslmode", "require")

# ------------------------------------------------------------------
# Auth
# ------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------------------------------------------------
# Internationalization
# ------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------
# Static & Media
# ------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage" if not DEBUG else "django.contrib.staticfiles.storage.StaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ------------------------------------------------------------------
# Default primary key field
# ------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------
# REST Framework
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
}

from datetime import timedelta  # noqa: E402
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])

# ------------------------------------------------------------------
# Sites framework
# ------------------------------------------------------------------
SITE_ID = 1

# ------------------------------------------------------------------
# Celery
# ------------------------------------------------------------------
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/1")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/2")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 60 * 30  # 30 min hard limit for ML jobs
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# ------------------------------------------------------------------
# App-specific settings (ML / LLM / KG)
# ------------------------------------------------------------------
ML_SETTINGS = {
    "MODELS_DIR": BASE_DIR / "ml" / "models" / "saved",
    "DATA_DIR": BASE_DIR / "ml" / "data",
    "DEFAULT_DOMAIN": env("DEFAULT_DOMAIN_FOCUS", default="battery"),
    "PROPERTY_TARGETS": [
        "capacity_mah_g", "cycle_life", "voltage_v",
        "energy_density_wh_kg", "safety_score", "cost_usd_kg"
    ],
}

LLM_SETTINGS = {
    "OPENAI_API_KEY": env("OPENAI_API_KEY", default=""),
    "OPENAI_MODEL": env("OPENAI_MODEL", default="gpt-4o-mini"),
    "GROQ_API_KEY": env("GROQ_API_KEY", default=""),
    "GROQ_MODEL": env("GROQ_MODEL", default="llama3-70b-8192"),
    "HUGGINGFACE_API_KEY": env("HUGGINGFACE_API_KEY", default=""),
    "HUGGINGFACE_MODEL": env("HUGGINGFACE_MODEL", default="mistralai/Mistral-7B-Instruct-v0.2"),
    "EMBEDDING_MODEL": env("EMBEDDING_MODEL", default="sentence-transformers/all-MiniLM-L6-v2"),
    "CHROMA_PERSIST_DIR": BASE_DIR / env("CHROMA_PERSIST_DIR", default="./chroma_db"),
    "CHROMA_COLLECTION_NAME": env("CHROMA_COLLECTION_NAME", default="matdiscoverai_papers"),
    "CHUNK_SIZE": 800,
    "CHUNK_OVERLAP": 120,
    "TOP_K_RESULTS": 5,
}

KG_SETTINGS = {
    "NEO4J_URI": env("NEO4J_URI", default=""),
    "NEO4J_USERNAME": env("NEO4J_USERNAME", default=""),
    "NEO4J_PASSWORD": env("NEO4J_PASSWORD", default=""),
    "USE_NEO4J": False,  # set True in production for scale
}

EXTERNAL_APIS = {
    "MATERIALS_PROJECT_API_KEY": env("MATERIALS_PROJECT_API_KEY", default=""),
    "ARXIV_API_URL": env("ARXIV_API_URL", default="http://export.arxiv.org/api/query"),
    "SEMANTIC_SCHOLAR_API_KEY": env("SEMANTIC_SCHOLAR_API_KEY", default=""),
    "OPENALEX_EMAIL": env("OPENALEX_EMAIL", default=""),
    "CROSSREF_API_URL": env("CROSSREF_API_URL", default="https://api.crossref.org/works"),
}

# ------------------------------------------------------------------
# Security (production hardening)
# ------------------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO"},
        "backend": {"handlers": ["console"], "level": "DEBUG" if DEBUG else "INFO"},
        "ml": {"handlers": ["console"], "level": "DEBUG" if DEBUG else "INFO"},
    },
}

# Sentry (optional)
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN and not DEBUG:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    sentry_sdk.init(dsn=SENTRY_DSN, integrations=[DjangoIntegration()], traces_sample_rate=0.1)

APP_NAME = env("APP_NAME", default="MatDiscoverAI")
APP_VERSION = env("APP_VERSION", default="1.0.0")
