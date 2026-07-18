"""
URL configuration for ML Services App
"""

from django.urls import path
from .views import (
    HealthCheckView,
    PropertyPredictionView,
    MaterialDiscoveryView,
    ModelInfoView
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('predict/', PropertyPredictionView.as_view(), name='property-prediction'),
    path('discover/', MaterialDiscoveryView.as_view(), name='material-discovery'),
    path('models/', ModelInfoView.as_view(), name='model-info'),
]
