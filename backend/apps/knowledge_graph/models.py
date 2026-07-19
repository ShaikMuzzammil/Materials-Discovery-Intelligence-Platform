"""Knowledge graph models – canonical materials + aggregated graph snapshots."""
from django.db import models
from backend.apps.papers.models import Paper


class Material(models.Model):
    """A canonical material aggregated across papers (e.g. LiFePO4)."""

    name = models.CharField(max_length=200, unique=True)
    formula = models.CharField(max_length=200, blank=True)
    aliases = models.JSONField(default=list, blank=True)
    domain = models.CharField(max_length=80, default="battery")
    description = models.TextField(blank=True)
    properties = models.JSONField(default=dict, blank=True, help_text="Aggregated properties")
    mentioned_in = models.ManyToManyField(Paper, related_name="materials", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class GraphSnapshot(models.Model):
    """Serialized snapshot of the full knowledge graph at a point in time."""

    created_at = models.DateTimeField(auto_now_add=True)
    node_count = models.PositiveIntegerField(default=0)
    edge_count = models.PositiveIntegerField(default=0)
    graph_json = models.JSONField(default=dict, help_text="NetworkX-format graph dict")
    triggered_by = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"KG snapshot @ {self.created_at:%Y-%m-%d %H:%M} – {self.node_count}N / {self.edge_count}E"
