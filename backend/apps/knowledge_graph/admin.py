from django.contrib import admin
from .models import Material, GraphSnapshot


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "formula", "domain", "created_at")
    list_filter = ("domain",)


@admin.register(GraphSnapshot)
class GraphSnapshotAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "node_count", "edge_count", "triggered_by")
    readonly_fields = ("graph_json",)
