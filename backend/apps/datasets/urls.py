"""Datasets app – user-uploaded datasets + analysis endpoints."""
from django.shortcuts import render
from django.urls import path
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ml.datasets.loaders import list_all_datasets, get_domain_info, get_available_domains
from ml.evaluation.analyzer import analyze_dataset, get_dataset_quality_score, compare_datasets


@api_view(["GET"])
@drf_perm([AllowAny])
def list_datasets_api(request):
    """List all available datasets (built-in + uploaded)."""
    return Response({"datasets": list_all_datasets()})


@api_view(["GET"])
@drf_perm([AllowAny])
def dataset_detail_api(request, domain: str):
    """Get detailed info + analysis for a single dataset."""
    info = get_domain_info(domain)
    if not info:
        return Response({"error": "Unknown domain"}, status=404)
    analysis = analyze_dataset(domain)
    quality = get_dataset_quality_score(domain)
    return Response({
        "info": info,
        "analysis": analysis,
        "quality": quality,
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def compare_all_api(request):
    """Compare all datasets side-by-side."""
    return Response({"comparison": compare_datasets()})


@api_view(["GET"])
@drf_perm([AllowAny])
def statistics_api(request, domain: str):
    """Get detailed statistics (means, stds, distributions) for a dataset."""
    analysis = analyze_dataset(domain)
    return Response({
        "statistics": analysis.get("statistics", {}),
        "categorical_distributions": analysis.get("categorical_distributions", {}),
        "correlations": analysis.get("correlations", {}),
        "outliers": analysis.get("outliers", {}),
        "target_distributions": analysis.get("target_distributions", {}),
    })


@api_view(["GET"])
@drf_perm([AllowAny])
def quality_api(request, domain: str):
    """Get a quality score for a dataset."""
    return Response(get_dataset_quality_score(domain))


@api_view(["GET"])
@drf_perm([AllowAny])
def download_csv_api(request, domain: str):
    """Download the dataset as a CSV file."""
    from django.http import HttpResponse
    from ml.datasets.loaders import load_domain_dataset
    df = load_domain_dataset(domain)
    if df.empty:
        return HttpResponse("Dataset not found", status=404)
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{domain}_dataset.csv"'
    df.to_csv(response, index=False)
    return response


# Template views
def datasets_landing_view(request):
    datasets = list_all_datasets()
    comparison = compare_datasets()
    return render(request, "datasets/landing.html", {
        "datasets": datasets, "comparison": comparison, "section": "datasets",
    })


def dataset_detail_view(request, domain: str):
    info = get_domain_info(domain)
    if not info:
        from django.http import Http404
        raise Http404("Dataset not found")
    analysis = analyze_dataset(domain)
    quality = get_dataset_quality_score(domain)
    return render(request, "datasets/detail.html", {
        "domain": domain, "info": info,
        "analysis": analysis, "quality": quality,
        "section": "datasets",
    })


def compare_view(request):
    comparison = compare_datasets()
    return render(request, "datasets/compare.html", {
        "comparison": comparison, "section": "datasets",
    })


urlpatterns = [
    # API
    path("api/", list_datasets_api, name="api-datasets-list"),
    path("api/<str:domain>/", dataset_detail_api, name="api-dataset-detail"),
    path("api/<str:domain>/stats/", statistics_api, name="api-dataset-stats"),
    path("api/<str:domain>/quality/", quality_api, name="api-dataset-quality"),
    path("api/<str:domain>/download/", download_csv_api, name="api-dataset-download"),
    path("api/compare/", compare_all_api, name="api-datasets-compare"),
    # Templates
    path("", datasets_landing_view, name="datasets-landing"),
    path("compare/", compare_view, name="datasets-compare"),
    path("<str:domain>/", dataset_detail_view, name="dataset-detail"),
]
