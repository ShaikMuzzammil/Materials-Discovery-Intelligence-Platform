"""
Root URL configuration for MatDiscoverAI.
Includes admin, API routes (DRF), and template-based views.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from backend.apps.dashboard.views import home_view

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # Auth tokens (JWT)
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("backend.apps.accounts.urls")),

    # Domain API
    path("api/papers/", include("backend.apps.papers.urls")),
    path("api/extraction/", include("backend.apps.extraction.urls")),
    path("api/kg/", include("backend.apps.knowledge_graph.urls")),
    path("api/materials/", include("backend.apps.materials.urls")),
    path("api/predictions/", include("backend.apps.predictions.urls")),
    path("api/chat/", include("backend.apps.llm_chat.urls")),
    path("api/dashboard/", include("backend.apps.dashboard.urls")),
    path("api/domains/", include("backend.apps.domains.urls")),
    path("api/datasets/", include("backend.apps.datasets.urls")),
    path("api/experiments/", include("backend.apps.experiments.urls")),
    path("api/exports/", include("backend.apps.exports.urls")),
    path("api/workflow/", include("backend.apps.workflow.urls")),
    path("api/monitoring/", include("backend.apps.monitoring.urls")),
    path("api/analytics/", include("backend.apps.analytics.urls")),

    # Template views
    path("", home_view, name="home"),
    path("dashboard/", include("backend.apps.dashboard.urls")),
    path("papers/", include("backend.apps.papers.urls")),
    path("extraction/", include("backend.apps.extraction.urls")),
    path("materials/", include("backend.apps.materials.urls")),
    path("predictions/", include("backend.apps.predictions.urls")),
    path("chat/", include("backend.apps.llm_chat.urls")),
    path("accounts/", include("allauth.urls")),
    path("kg/", include("backend.apps.knowledge_graph.urls")),
    path("domains/", include("backend.apps.domains.urls")),
    path("datasets/", include("backend.apps.datasets.urls")),
    path("experiments/", include("backend.apps.experiments.urls")),
    path("exports/", include("backend.apps.exports.urls")),
    path("workflow/", include("backend.apps.workflow.urls")),
    path("monitoring/", include("backend.apps.monitoring.urls")),
    path("analytics/", include("backend.apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
