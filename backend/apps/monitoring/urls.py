"""Model monitoring – track predictions over time, detect drift, alert on anomalies."""
from django.shortcuts import render
from django.urls import path
from django.db.models import Count, Avg, Q
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from backend.apps.predictions.models import PredictionRequest
from backend.apps.experiments.models import TrainingRun
from backend.apps.papers.models import Paper
from backend.apps.extraction.models import Entity, Relation
from backend.apps.knowledge_graph.models import GraphSnapshot, Material
from backend.apps.llm_chat.models import ChatSession, ChatMessage


@api_view(["GET"])
@drf_perm([AllowAny])
def system_overview_view(request):
    """System overview: counts of all entities + recent activity."""
    return Response({
        "counts": {
            "papers": Paper.objects.count(),
            "entities": Entity.objects.count(),
            "relations": Relation.objects.count(),
            "materials": Material.objects.count(),
            "predictions": PredictionRequest.objects.count(),
            "training_runs": TrainingRun.objects.count(),
            "chat_sessions": ChatSession.objects.count(),
            "kg_snapshots": GraphSnapshot.objects.count(),
        },
        "recent_activity": {
            "last_24h_papers": Paper.objects.filter(created_at__gte=__import__("django").utils.timezone.now() - __import__("datetime").timedelta(days=1)).count(),
            "last_24h_predictions": PredictionRequest.objects.filter(created_at__gte=__import__("django").utils.timezone.now() - __import__("datetime").timedelta(days=1)).count(),
            "last_24h_chats": ChatMessage.objects.filter(created_at__gte=__import__("django").utils.timezone.now() - __import__("datetime").timedelta(days=1)).count(),
        },
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def model_performance_view(request):
    """Track model performance over time."""
    runs = TrainingRun.objects.filter(status="completed").order_by("-created_at")[:50]
    return Response({
        "runs": [
            {
                "id": r.id, "domain": r.domain, "target": r.target,
                "algorithm": r.algorithm,
                "r2": (r.metrics or {}).get("r2"),
                "rmse": (r.metrics or {}).get("rmse"),
                "duration_seconds": r.duration_seconds,
                "created_at": r.created_at.isoformat(),
            }
            for r in runs
        ]
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def prediction_drift_view(request):
    """Detect prediction drift (distribution of recent predictions vs historical)."""
    import numpy as np
    from django.utils import timezone
    from datetime import timedelta

    recent = PredictionRequest.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).values_list("prediction", flat=True)
    historical = PredictionRequest.objects.filter(
        created_at__lt=timezone.now() - timedelta(days=7)
    ).values_list("prediction", flat=True)

    if len(recent) < 5 or len(historical) < 5:
        return Response({"status": "insufficient_data", "recent_count": len(recent), "historical_count": len(historical)})

    recent_arr = np.array(list(recent), dtype=float)
    hist_arr = np.array(list(historical), dtype=float)

    # Simple drift metric: difference of means / std
    drift = abs(recent_arr.mean() - hist_arr.mean()) / max(hist_arr.std(), 1e-9)

    return Response({
        "status": "drift_detected" if drift > 0.5 else "stable",
        "drift_score": round(float(drift), 3),
        "recent_mean": round(float(recent_arr.mean()), 3),
        "historical_mean": round(float(hist_arr.mean()), 3),
        "recent_std": round(float(recent_arr.std()), 3),
        "historical_std": round(float(hist_arr.std()), 3),
        "recent_count": len(recent_arr),
        "historical_count": len(hist_arr),
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def usage_stats_view(request):
    """Usage statistics over time."""
    from django.utils import timezone
    from datetime import timedelta
    from collections import defaultdict

    days = int(request.GET.get("days", 30))
    since = timezone.now() - timedelta(days=days)

    # Daily counts
    daily_papers = defaultdict(int)
    daily_predictions = defaultdict(int)
    daily_chats = defaultdict(int)

    for p in Paper.objects.filter(created_at__gte=since):
        daily_papers[p.created_at.date().isoformat()] += 1
    for p in PredictionRequest.objects.filter(created_at__gte=since):
        daily_predictions[p.created_at.date().isoformat()] += 1
    for c in ChatMessage.objects.filter(created_at__gte=since, role="user"):
        daily_chats[c.created_at.date().isoformat()] += 1

    return Response({
        "days": days,
        "daily_papers": dict(daily_papers),
        "daily_predictions": dict(daily_predictions),
        "daily_chats": dict(daily_chats),
    })


def monitoring_landing_view(request):
    from django.utils import timezone
    from datetime import timedelta
    return render(request, "monitoring/landing.html", {
        "section": "monitoring",
        "recent_predictions": PredictionRequest.objects.all()[:20],
        "recent_runs": TrainingRun.objects.all()[:20],
        "last_24h_papers": Paper.objects.filter(created_at__gte=timezone.now() - timedelta(days=1)).count(),
    })


urlpatterns = [
    path("api/overview/", system_overview_view, name="api-monitoring-overview"),
    path("api/models/", model_performance_view, name="api-monitoring-models"),
    path("api/drift/", prediction_drift_view, name="api-monitoring-drift"),
    path("api/usage/", usage_stats_view, name="api-monitoring-usage"),
    path("", monitoring_landing_view, name="monitoring-landing"),
]
