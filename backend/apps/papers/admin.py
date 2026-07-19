from django.contrib import admin
from .models import Paper, PaperChunk, IngestionJob


@admin.register(Paper)
class PaperAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "source", "status", "published_at", "doi")
    list_filter = ("source", "status", "domains")
    search_fields = ("title", "abstract", "authors", "doi")
    readonly_fields = ("created_at", "updated_at")


@admin.register(PaperChunk)
class PaperChunkAdmin(admin.ModelAdmin):
    list_display = ("id", "paper", "chunk_index", "section", "token_count")
    list_filter = ("section",)


@admin.register(IngestionJob)
class IngestionJobAdmin(admin.ModelAdmin):
    list_display = ("id", "query_type", "query_text", "status", "papers_added", "created_at")
    list_filter = ("status", "query_type")
