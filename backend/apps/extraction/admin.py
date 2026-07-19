from django.contrib import admin
from .models import Entity, Relation, ExtractionRun


@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ("id", "paper", "entity_type", "text", "normalized", "confidence", "extractor")
    list_filter = ("entity_type", "extractor")
    search_fields = ("text", "normalized")


@admin.register(Relation)
class RelationAdmin(admin.ModelAdmin):
    list_display = ("id", "paper", "subject", "relation_type", "obj", "confidence")
    list_filter = ("relation_type", "extractor")


@admin.register(ExtractionRun)
class ExtractionRunAdmin(admin.ModelAdmin):
    list_display = ("id", "paper", "extractor_name", "entities_found", "relations_found", "success", "created_at")
    list_filter = ("extractor_name", "success")
