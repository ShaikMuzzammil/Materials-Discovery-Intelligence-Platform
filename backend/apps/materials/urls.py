from django.shortcuts import render, get_object_or_404
from django.urls import path
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import MaterialRecord
from .serializers import MaterialRecordSerializer
from .services import fetch_material_from_mp, compare_materials


class MaterialRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MaterialRecord.objects.all()
    serializer_class = MaterialRecordSerializer
    search_fields = ["formula", "formula_pretty", "elements"]
    filterset_fields = ["source", "is_stable"]
    ordering_fields = ["formula", "band_gap", "density", "cached_at"]


@api_view(["GET"])
def fetch_from_mp_view(request, formula: str):
    """Fetch a material from Materials Project and cache it locally."""
    rec = fetch_material_from_mp(formula)
    if not rec:
        return Response({"error": "Not found or MP API key not set"}, status=404)
    return Response(MaterialRecordSerializer(rec).data)


@api_view(["GET"])
def compare_view(request):
    """Compare multiple materials. Usage: ?formulas=LiFePO4,LiCoO2,LiMn2O4"""
    formulas_param = request.GET.get("formulas", "")
    formulas = [f.strip() for f in formulas_param.split(",") if f.strip()]
    if not formulas:
        return Response({"error": "Provide ?formulas=A,B,C"}, status=400)
    return Response(compare_materials(formulas))


# ---------------- Templates ----------------
def material_list_view(request):
    materials = MaterialRecord.objects.all()[:100]
    return render(request, "materials/list.html", {
        "materials": materials, "section": "materials",
    })


def material_detail_view(request, pk):
    material = get_object_or_404(MaterialRecord, pk=pk)
    return render(request, "materials/detail.html", {
        "material": material, "section": "materials",
    })


def material_compare_view(request):
    """Render a side-by-side comparison page."""
    formulas_param = request.GET.get("formulas", "LiFePO4,LiCoO2,LiMn2O4")
    formulas = [f.strip() for f in formulas_param.split(",") if f.strip()]
    comparison = compare_materials(formulas)
    return render(request, "materials/compare.html", {
        "comparison": comparison,
        "formulas": formulas,
        "section": "materials",
    })


urlpatterns = [
    # API
    path("api/", MaterialRecordViewSet.as_view({"get": "list"}), name="api-material-record-list"),
    path("api/<int:pk>/", MaterialRecordViewSet.as_view({"get": "retrieve"}), name="api-material-record-detail"),
    path("api/fetch-mp/<str:formula>/", fetch_from_mp_view, name="api-fetch-mp"),
    path("api/compare/", compare_view, name="api-compare"),
    # Templates
    path("", material_list_view, name="material-list"),
    path("<int:pk>/", material_detail_view, name="material-detail"),
    path("compare/", material_compare_view, name="material-compare"),
]
