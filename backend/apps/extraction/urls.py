from django.shortcuts import get_object_or_404, render
from django.urls import path
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny

from backend.apps.papers.models import Paper
from .models import Entity, Relation, ExtractionRun
from .serializers import EntitySerializer, RelationSerializer, ExtractionRunSerializer
from .services import run_full_extraction


class EntityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Entity.objects.all()
    serializer_class = EntitySerializer
    filterset_fields = ["paper", "entity_type", "extractor"]
    search_fields = ["text", "normalized"]
    ordering_fields = ["confidence", "created_at"]


class RelationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Relation.objects.all()
    serializer_class = RelationSerializer
    filterset_fields = ["paper", "relation_type", "extractor"]


class ExtractionRunViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExtractionRun.objects.all()
    serializer_class = ExtractionRunSerializer


@api_view(["POST"])
@drf_perm([AllowAny])
def run_extraction_view(request, paper_id):
    """Trigger full extraction pipeline synchronously."""
    paper = get_object_or_404(Paper, pk=paper_id)
    result = run_full_extraction(paper.id)
    return Response(result)


@api_view(["POST"])
@drf_perm([AllowAny])
def run_async_extraction_view(request, paper_id):
    """Queue extraction via Celery (falls back to sync if broker is down)."""
    paper = get_object_or_404(Paper, pk=paper_id)
    from .tasks import extract_paper_entities
    try:
        from backend.celery import app as celery_app
        if celery_app.control.inspect(timeout=1).ping():
            task = extract_paper_entities.delay(paper.id)
            return Response({"paper_id": paper.id, "task_id": task.id, "queued": True})
    except Exception:
        pass
    result = run_full_extraction(paper.id)
    return Response({"paper_id": paper.id, "queued": False, "result": result})


# ---------------- Templates ----------------
def extraction_dashboard_view(request):
    entities = Entity.objects.all().select_related("paper")[:200]
    relations = Relation.objects.all().select_related("paper", "subject", "obj")[:200]
    # entity type counts for the chart
    from django.db.models import Count
    type_counts = (
        Entity.objects.values("entity_type").annotate(count=Count("id")).order_by("-count")
    )
    return render(request, "extraction/dashboard.html", {
        "entities": entities,
        "relations": relations,
        "type_counts": list(type_counts),
        "section": "extraction",
    })


def paper_extraction_view(request, paper_id):
    paper = get_object_or_404(Paper, pk=paper_id)
    entities = paper.entities.all()
    relations = paper.relations.all().select_related("subject", "obj")
    return render(request, "extraction/paper_detail.html", {
        "paper": paper, "entities": entities, "relations": relations,
        "section": "extraction",
    })


urlpatterns = [
    # API
    path("api/entities/", EntityViewSet.as_view({"get": "list"}), name="api-entity-list"),
    path("api/entities/<int:pk>/", EntityViewSet.as_view({"get": "retrieve"}), name="api-entity-detail"),
    path("api/relations/", RelationViewSet.as_view({"get": "list"}), name="api-relation-list"),
    path("api/relations/<int:pk>/", RelationViewSet.as_view({"get": "retrieve"}), name="api-relation-detail"),
    path("api/runs/", ExtractionRunViewSet.as_view({"get": "list"}), name="api-run-list"),
    path("api/runs/<int:pk>/", ExtractionRunViewSet.as_view({"get": "retrieve"}), name="api-run-detail"),
    path("api/run/<int:paper_id>/", run_extraction_view, name="api-run-extraction"),
    path("api/run-async/<int:paper_id>/", run_async_extraction_view, name="api-run-async-extraction"),
    # Templates
    path("", extraction_dashboard_view, name="extraction-dashboard"),
    path("paper/<int:paper_id>/", paper_extraction_view, name="extraction-paper-detail"),
]
