"""
URL configuration for MatDiscoverAI project.

Defines all API endpoints for the material discovery platform.
Integrates with Next.js frontend at /api/* routes.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API Endpoints (used by Next.js frontend)
    path('api/materials/', include('materials.urls')),
    path('api/papers/', include('papers.urls')),
    path('api/ml/', include('ml_services.urls')),
    path('api/nlp/', include('nlp_pipeline.urls')),
    
    # Health check endpoint
    path('api/health/', include('ml_services.urls')),  # Health check in ml_services
    
    # API Root
    path('api/', include('materials.urls')),  # Default to materials
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
