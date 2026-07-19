"""Advanced analytics – cross-domain insights, trends, recommendations."""
from django.shortcuts import render
from django.urls import path
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ml.datasets.loaders import DOMAIN_REGISTRY, get_domain_info
from ml.evaluation.analyzer import analyze_dataset, compare_datasets
from ml.models.universal_trainer import list_trained_models


@api_view(["GET"])
@drf_perm([AllowAny])
def cross_domain_insights_view(request):
    """Find patterns across all 7 domains."""
    comparison = compare_datasets()
    models = list_trained_models()

    # Best-performing domain
    domain_performance = {}
    for m in models:
        d = m["domain"]
        if d not in domain_performance:
            domain_performance[d] = []
        r2 = m.get("metrics", {}).get("r2", -1)
        if r2 is not None:
            domain_performance[d].append(r2)

    domain_avg_r2 = {d: sum(v) / len(v) for d, v in domain_performance.items() if v}
    best_domain = max(domain_avg_r2.items(), key=lambda x: x[1]) if domain_avg_r2 else None

    return Response({
        "total_datasets": len(comparison),
        "total_models": len(models),
        "total_samples": sum(d["n_samples"] for d in comparison),
        "total_targets": sum(d["n_targets"] for d in comparison),
        "best_performing_domain": {"domain": best_domain[0], "avg_r2": round(best_domain[1], 3)} if best_domain else None,
        "domain_avg_r2": {d: round(r, 3) for d, r in domain_avg_r2.items()},
        "quality_grades": {d["domain"]: d["grade"] for d in comparison},
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def trends_view(request):
    """Get trend data over time (papers added, predictions made, etc.)."""
    from django.db.models import Count
    from backend.apps.papers.models import Paper
    from backend.apps.predictions.models import PredictionRequest
    from backend.apps.extraction.models import Entity
    from collections import defaultdict

    # Papers per domain over time
    papers_per_domain = defaultdict(int)
    for p in Paper.objects.all():
        for d in p.domains:
            papers_per_domain[d] += 1

    # Predictions per target
    preds_per_target = defaultdict(int)
    for p in PredictionRequest.objects.all():
        preds_per_target[p.target] += 1

    # Entities per type
    entities_per_type = defaultdict(int)
    for stat in Entity.objects.values("entity_type").annotate(count=Count("id")):
        entities_per_type[stat["entity_type"]] = stat["count"]

    return Response({
        "papers_per_domain": dict(papers_per_domain),
        "predictions_per_target": dict(preds_per_target),
        "entities_per_type": dict(entities_per_type),
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def recommendations_view(request):
    """Recommend next experiments based on current data + model performance."""
    models = list_trained_models()
    recommendations = []

    # Find models with poor R² — recommend collecting more data
    for m in models:
        r2 = m.get("metrics", {}).get("r2", -1)
        if r2 is not None and r2 < 0.5:
            recommendations.append({
                "type": "collect_data",
                "priority": "high",
                "domain": m["domain"],
                "target": m["target"],
                "reason": f"R²={r2:.3f} is low; consider collecting more training data",
                "current_r2": round(r2, 3),
            })

    # Find domains with no models — recommend training
    trained_domains = set(m["domain"] for m in models)
    for d in DOMAIN_REGISTRY:
        if d not in trained_domains:
            recommendations.append({
                "type": "train_model",
                "priority": "medium",
                "domain": d,
                "reason": f"No trained models for domain '{d}'",
            })

    # Recommend hyperparameter tuning for tree-based models
    for m in models:
        if m["algorithm"] in ["random_forest", "gradient_boosting", "xgboost"]:
            r2 = m.get("metrics", {}).get("r2", 0)
            if r2 and 0.5 < r2 < 0.85:
                recommendations.append({
                    "type": "tune_hyperparams",
                    "priority": "medium",
                    "domain": m["domain"],
                    "target": m["target"],
                    "reason": f"R²={r2:.3f} could be improved with hyperparameter tuning",
                })

    return Response({
        "recommendations": sorted(recommendations, key=lambda x: {"high": 0, "medium": 1, "low": 2}[x["priority"]]),
        "total": len(recommendations),
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def model_comparison_view(request):
    """Compare model performance across algorithms for each (domain, target)."""
    models = list_trained_models()
    # Group by (domain, target)
    grouped = {}
    for m in models:
        key = f"{m['domain']}__{m['target']}"
        if key not in grouped:
            grouped[key] = []
        grouped[key].append({
            "algorithm": m["algorithm"],
            "r2": m.get("metrics", {}).get("r2"),
            "rmse": m.get("metrics", {}).get("rmse"),
            "mae": m.get("metrics", {}).get("mae"),
            "cv_r2_mean": m.get("metrics", {}).get("cv_r2_mean"),
        })

    return Response({
        "comparisons": [
            {
                "domain": k.split("__")[0],
                "target": k.split("__")[1],
                "models": v,
                "best_algorithm": max(v, key=lambda x: x.get("r2") or -1)["algorithm"] if v else None,
                "best_r2": max((x.get("r2") or -1) for x in v) if v else None,
            }
            for k, v in grouped.items()
        ]
    })


def analytics_landing_view(request):
    return render(request, "analytics/landing.html", {
        "section": "analytics",
        "domains": list(DOMAIN_REGISTRY.keys()),
    })


def insights_view(request):
    return render(request, "analytics/insights.html", {
        "section": "analytics",
    })


urlpatterns = [
    path("api/insights/", cross_domain_insights_view, name="api-analytics-insights"),
    path("api/trends/", trends_view, name="api-analytics-trends"),
    path("api/recommendations/", recommendations_view, name="api-analytics-recommendations"),
    path("api/model-comparison/", model_comparison_view, name="api-analytics-model-comparison"),
    path("", analytics_landing_view, name="analytics-landing"),
    path("insights/", insights_view, name="analytics-insights"),
]
