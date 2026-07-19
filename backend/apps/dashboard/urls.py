from django.urls import path
from .views import home_view, overview_view, stats_api


urlpatterns = [
    path("stats/", stats_api, name="api-stats"),
    path("overview/", overview_view, name="dashboard-overview"),
]
