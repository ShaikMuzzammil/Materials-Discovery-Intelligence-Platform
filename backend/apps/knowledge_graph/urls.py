from django.shortcuts import render, get_object_or_404
from django.urls import path
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Material, GraphSnapshot
from .serializers import MaterialSerializer, GraphSnapshotSerializer
from .services import build_graph_from_papers, get_latest_graph, graph_to_json, query_neighbors, recommend_materials


class MaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    search_fields = ["name", "formula", "description"]
    filterset_fields = ["domain"]


class GraphSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GraphSnapshot.objects.all()
    serializer_class = GraphSnapshotSerializer


@api_view(["POST"])
@drf_perm([AllowAny])
def build_kg_view(request):
    """Trigger KG build from all extracted papers."""
    G = build_graph_from_papers(save_snapshot=True)
    return Response({
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "snapshot_created": True,
    })


@api_view(["GET"])
def graph_view(request):
    """Return the latest graph snapshot as JSON (for visualisation)."""
    G = get_latest_graph()
    if G is None:
        return Response({"nodes": [], "edges": [], "message": "No snapshot yet — POST /api/kg/build/ first"})
    return Response(graph_to_json(G))


@api_view(["GET"])
def subgraph_view(request):
    """Return a subgraph centered on a given node (?node=LiFePO4&depth=2)."""
    node = request.GET.get("node", "")
    depth = int(request.GET.get("depth", 2))
    G = get_latest_graph()
    if G is None or not node:
        return Response({"nodes": [], "edges": []})
    sub = query_neighbors(G, node, max_depth=depth)
    return Response(graph_to_json(sub))


@api_view(["GET"])
def recommend_view(request):
    """Recommend materials for a target property (?property=capacity)."""
    prop = request.GET.get("property", "capacity")
    G = get_latest_graph()
    if G is None:
        return Response([])
    return Response(recommend_materials(G, prop, top_k=10))


# ---------------- Templates ----------------
def kg_dashboard_view(request):
    snapshots = GraphSnapshot.objects.all()[:10]
    materials = Material.objects.all()[:50]
    return render(request, "knowledge_graph/dashboard.html" if False else "kg/dashboard.html", {
        "snapshots": snapshots,
        "materials": materials,
        "section": "kg",
    })


urlpatterns = [
    # API
    path("api/materials/", MaterialViewSet.as_view({"get": "list"}), name="api-material-list"),
    path("api/materials/<int:pk>/", MaterialViewSet.as_view({"get": "retrieve"}), name="api-material-detail"),
    path("api/snapshots/", GraphSnapshotViewSet.as_view({"get": "list"}), name="api-snapshot-list"),
    path("api/snapshots/<int:pk>/", GraphSnapshotViewSet.as_view({"get": "retrieve"}), name="api-snapshot-detail"),
    path("api/build/", build_kg_view, name="api-kg-build"),
    path("api/graph/", graph_view, name="api-kg-graph"),
    path("api/subgraph/", subgraph_view, name="api-kg-subgraph"),
    path("api/recommend/", recommend_view, name="api-kg-recommend"),
    # Templates
    path("", kg_dashboard_view, name="kg-dashboard"),
]
