"""Domains app views – predict, train, analyze, explain, uncertainty for any domain."""
import time
import logging
from django.shortcuts import render
from django.urls import path
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ml.datasets.loaders import DOMAIN_REGISTRY, get_domain_info, list_all_datasets
from ml.models.universal_trainer import predict, train_model, train_all_models, train_all_models_for_domain, list_trained_models
from ml.models.tuning import tune_model
from ml.models.explainability import explain_prediction, global_feature_importance
from ml.models.uncertainty import compute_uncertainty
from ml.evaluation.analyzer import analyze_dataset, get_dataset_quality_score, compare_datasets
from .serializers import (
    PredictRequestSerializer, TrainRequestSerializer, TuneRequestSerializer,
    ExplainRequestSerializer, UncertaintyRequestSerializer,
)

log = logging.getLogger(__name__)


# ------------------------------------------------------------------
# API endpoints
# ------------------------------------------------------------------
@api_view(["GET"])
@drf_perm([AllowAny])
def list_domains_view(request):
    """List all available material domains with their info."""
    return Response({
        "domains": [
            {
                "key": k,
                "name": v["name"],
                "description": v["description"],
                "targets": v["targets"],
                "target_units": v.get("target_units", {}),
                "feature_columns": v["feature_columns"],
            }
            for k, v in DOMAIN_REGISTRY.items()
        ]
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def domain_info_view(request, domain: str):
    """Get detailed info for a single domain."""
    info = get_domain_info(domain)
    if not info:
        return Response({"error": f"Unknown domain: {domain}"}, status=404)
    quality = get_dataset_quality_score(domain)
    return Response({
        "domain": domain,
        "info": info,
        "quality": quality,
    })


@api_view(["POST"])
@drf_perm([AllowAny])
def predict_view(request):
    """Predict a target property for a given material."""
    ser = PredictRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    domain = d["domain"]
    target = d["target"]
    algorithm = d["algorithm"]

    # Build kwargs based on what the featurizer expects for this domain
    domain_info = get_domain_info(domain)
    feature_cols = domain_info["feature_columns"]
    input_kwargs = {}
    for col in feature_cols:
        if col in d:
            input_kwargs[col] = d[col]
        elif col == "formula" and "formula" in d:
            input_kwargs["formula"] = d["formula"]
    input_kwargs["algorithm"] = algorithm

    try:
        started = time.time()
        result = predict(domain, target, **input_kwargs)
        result["duration_ms"] = int((time.time() - started) * 1000)
        return Response(result)
    except Exception as e:
        log.exception("Prediction failed")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@drf_perm([AllowAny])
def train_view(request):
    """Train a model for a (domain, target) pair, or all targets in a domain."""
    ser = TrainRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    domain = d["domain"]
    target = d.get("target", "all")
    algorithm = d["algorithm"]

    try:
        if domain == "all":
            results = train_all_models([algorithm])
            return Response({
                "ok": True,
                "results": {k: [r.__dict__ for r in v] for k, v in results.items()}
            })
        elif target == "all":
            results = train_all_models_for_domain(domain, [algorithm])
            return Response({
                "ok": True,
                "results": [r.__dict__ for r in results]
            })
        else:
            r = train_model(domain, target, algorithm, save=True)
            return Response({"ok": True, "result": r.__dict__})
    except Exception as e:
        log.exception("Training failed")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@drf_perm([AllowAny])
def tune_view(request):
    """Hyperparameter tuning for a (domain, target, algorithm) combo."""
    ser = TuneRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    try:
        result = tune_model(d["domain"], d["target"], d["algorithm"],
                            n_trials=d["n_trials"], use_optuna=d["use_optuna"])
        return Response(result.__dict__)
    except Exception as e:
        log.exception("Tuning failed")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@drf_perm([AllowAny])
def explain_view(request):
    """Explain a prediction using SHAP or permutation importance."""
    ser = ExplainRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    try:
        result = explain_prediction(d["domain"], d["target"], d["algorithm"],
                                    input_features=d.get("input_features"))
        return Response(result)
    except Exception as e:
        log.exception("Explain failed")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@drf_perm([AllowAny])
def uncertainty_view(request):
    """Compute uncertainty / prediction interval."""
    ser = UncertaintyRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data
    try:
        input_features = d.get("input_features", {})
        # If input_features not provided, try to extract from request data
        if not input_features:
            domain_info = get_domain_info(d["domain"])
            for col in domain_info["feature_columns"]:
                if col in request.data:
                    input_features[col] = request.data[col]
        result = compute_uncertainty(d["domain"], d["target"], method=d["method"],
                                      algorithm=d["algorithm"],
                                      confidence=d["confidence"], **input_features)
        return Response(result)
    except Exception as e:
        log.exception("Uncertainty computation failed")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@drf_perm([AllowAny])
def analyze_dataset_view(request, domain: str):
    """Analyze the dataset for a given domain (statistics, distributions, correlations)."""
    try:
        result = analyze_dataset(domain)
        return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@drf_perm([AllowAny])
def compare_datasets_view(request):
    """Compare all 7 domain datasets side-by-side."""
    return Response({"datasets": compare_datasets()})


@api_view(["GET"])
@drf_perm([AllowAny])
def list_trained_models_view(request):
    """List all trained models on disk."""
    return Response({"models": list_trained_models()})


@api_view(["GET"])
@drf_perm([AllowAny])
def feature_importance_view(request, domain: str, target: str):
    """Get global feature importance for a model."""
    algorithm = request.GET.get("algorithm", "random_forest")
    try:
        result = global_feature_importance(domain, target, algorithm)
        return Response(result)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ------------------------------------------------------------------
# Template views
# ------------------------------------------------------------------
def domains_landing_view(request):
    """Landing page showing all 7 domains with stats."""
    datasets = list_all_datasets()
    comparison = compare_datasets()
    return render(request, "domains/landing.html", {
        "datasets": datasets,
        "comparison": comparison,
        "section": "domains",
    })


def domain_detail_view(request, domain: str):
    """Detail page for a single domain – predict + train + analyze tabs."""
    info = get_domain_info(domain)
    if not info:
        from django.http import Http404
        raise Http404("Domain not found")
    analysis = analyze_dataset(domain)
    quality = get_dataset_quality_score(domain)
    trained_models = [m for m in list_trained_models() if m["domain"] == domain]
    return render(request, "domains/detail.html", {
        "domain": domain,
        "info": info,
        "analysis": analysis,
        "quality": quality,
        "trained_models": trained_models,
        "section": "domains",
    })


def compare_view_template(request):
    """Compare all domains side-by-side page."""
    comparison = compare_datasets()
    return render(request, "domains/compare.html", {
        "comparison": comparison,
        "section": "domains",
    })


urlpatterns = [
    # API
    path("api/", list_domains_view, name="api-domains-list"),
    path("api/<str:domain>/info/", domain_info_view, name="api-domain-info"),
    path("api/predict/", predict_view, name="api-domain-predict"),
    path("api/train/", train_view, name="api-domain-train"),
    path("api/tune/", tune_view, name="api-domain-tune"),
    path("api/explain/", explain_view, name="api-domain-explain"),
    path("api/uncertainty/", uncertainty_view, name="api-domain-uncertainty"),
    path("api/<str:domain>/analyze/", analyze_dataset_view, name="api-domain-analyze"),
    path("api/compare-datasets/", compare_datasets_view, name="api-compare-datasets"),
    path("api/models/", list_trained_models_view, name="api-domain-models"),
    path("api/<str:domain>/<str:target>/importance/", feature_importance_view, name="api-domain-importance"),
    # Templates
    path("", domains_landing_view, name="domains-landing"),
    path("compare/", compare_view_template, name="domains-compare"),
    path("<str:domain>/", domain_detail_view, name="domain-detail"),
]
