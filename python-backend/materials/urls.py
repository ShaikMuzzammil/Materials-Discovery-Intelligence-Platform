"""
URL configuration for Materials App
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaterialViewSet,
    MaterialPropertyViewSet,
    CategoryViewSet,
    KnowledgeEdgeViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'', MaterialViewSet, basename='material')  # Root level for materials
router.register(r'properties', MaterialPropertyViewSet, basename='materialproperty')
router.register(r'knowledge', KnowledgeEdgeViewSet, basename='knowledgeedge')

urlpatterns = [
    path('', include(router.urls)),
]
