"""Exports app – generate and download reports (PDF, CSV, JSON, Markdown)."""
from django.shortcuts import render
from django.urls import path
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.permissions import AllowAny

from ml.datasets.loaders import list_all_datasets
from .services import (
    export_dataset_csv, export_dataset_json, export_dataset_markdown, export_dataset_pdf,
    export_full_comparison_markdown,
)


@api_view(["GET"])
@drf_perm([AllowAny])
def export_csv_view(request, domain: str):
    """Download a domain's dataset as CSV."""
    return export_dataset_csv(domain)


@api_view(["GET"])
@drf_perm([AllowAny])
def export_json_view(request, domain: str):
    """Download a domain's dataset + analysis as JSON."""
    return export_dataset_json(domain)


@api_view(["GET"])
@drf_perm([AllowAny])
def export_markdown_view(request, domain: str):
    """Download a comprehensive Markdown report for a domain."""
    return export_dataset_markdown(domain)


@api_view(["GET"])
@drf_perm([AllowAny])
def export_pdf_view(request, domain: str):
    """Download a PDF report for a domain."""
    return export_dataset_pdf(domain)


@api_view(["GET"])
@drf_perm([AllowAny])
def export_comparison_markdown_view(request):
    """Download a comparison of all domains as Markdown."""
    return export_full_comparison_markdown()


def exports_landing_view(request):
    """Landing page showing all export options."""
    datasets = list_all_datasets()
    return render(request, "exports/landing.html", {
        "datasets": datasets, "section": "exports",
    })


urlpatterns = [
    # API
    path("api/<str:domain>/csv/", export_csv_view, name="api-export-csv"),
    path("api/<str:domain>/json/", export_json_view, name="api-export-json"),
    path("api/<str:domain>/markdown/", export_markdown_view, name="api-export-markdown"),
    path("api/<str:domain>/pdf/", export_pdf_view, name="api-export-pdf"),
    path("api/comparison/markdown/", export_comparison_markdown_view, name="api-export-comparison"),
    # Templates
    path("", exports_landing_view, name="exports-landing"),
]
