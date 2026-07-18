"""
URL configuration for Papers App
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResearchPaperViewSet,
    ExtractedEntityViewSet,
    ExtractionJobViewSet
)

router = DefaultRouter()
router.register(r'', ResearchPaperViewSet, basename='researchpaper')
router.register(r'entities', ExtractedEntityViewSet, basename='extractedentity')
router.register(r'jobs', ExtractionJobViewSet, basename='extractionjob')

urlpatterns = [
    path('', include(router.urls)),
]
