"""Dashboard views – landing page + analytics overview."""
from django.shortcuts import render
from django.db.models import Count
from rest_framework.decorators import api_view
from rest_framework.response import Response

from backend.apps.papers.models import Paper
from backend.apps.extraction.models import Entity, Relation
from backend.apps.knowledge_graph.models import Material, GraphSnapshot
from backend.apps.predictions.models import PredictionRequest
from backend.apps.materials.models import MaterialRecord


def home_view(request):
    """Landing page – project overview + key stats + architecture diagram."""
    stats = {
        "papers": Paper.objects.count(),
        "entities": Entity.objects.count(),
        "relations": Relation.objects.count(),
        "materials": Material.objects.count(),
        "predictions": PredictionRequest.objects.count(),
        "snapshots": GraphSnapshot.objects.count(),
        "mp_records": MaterialRecord.objects.count(),
    }
    return render(request, "dashboard/home.html", {
        "stats": stats,
        "section": "home",
    })


def overview_view(request):
    """Main analytics dashboard."""
    from django.utils import timezone
    from datetime import timedelta
    since = timezone.now() - timedelta(days=30)
    recent_papers = Paper.objects.filter(created_at__gte=since).count()

    entity_types = list(
        Entity.objects.values("entity_type").annotate(count=Count("id")).order_by("-count")
    )
    relation_types = list(
        Relation.objects.values("relation_type").annotate(count=Count("id")).order_by("-count")
    )
    top_materials = list(
        Material.objects.annotate(
            paper_count=Count("mentioned_in")
        ).order_by("-paper_count")[:10].values("name", "formula", "paper_count")
    )
    snapshot = GraphSnapshot.objects.order_by("-created_at").first()

    return render(request, "dashboard/overview.html", {
        "section": "dashboard",
        "recent_papers": recent_papers,
        "entity_types": entity_types,
        "relation_types": relation_types,
        "top_materials": top_materials,
        "snapshot": snapshot,
        "total_papers": Paper.objects.count(),
        "total_entities": Entity.objects.count(),
        "total_relations": Relation.objects.count(),
        "total_materials": Material.objects.count(),
    })


@api_view(["GET"])
def stats_api(request):
    """JSON API returning aggregate stats for charts."""
    return Response({
        "papers": Paper.objects.count(),
        "entities": Entity.objects.count(),
        "relations": Relation.objects.count(),
        "materials": Material.objects.count(),
        "predictions": PredictionRequest.objects.count(),
        "entity_types": list(
            Entity.objects.values("entity_type").annotate(count=Count("id")).order_by("-count")
        ),
        "relation_types": list(
            Relation.objects.values("relation_type").annotate(count=Count("id")).order_by("-count")
        ),
        "papers_by_source": list(
            Paper.objects.values("source").annotate(count=Count("id")).order_by("-count")
        ),
        "papers_by_status": list(
            Paper.objects.values("status").annotate(count=Count("id")).order_by("-count")
        ),
    })
