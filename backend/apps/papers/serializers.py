from rest_framework import serializers
from .models import Paper, PaperChunk, IngestionJob


class PaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paper
        fields = (
            "id", "source", "source_id", "doi", "title", "authors",
            "abstract", "published_at", "journal", "pdf_url",
            "keywords", "domains", "status", "ingestion_error",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "ingestion_error", "created_at", "updated_at")


class PaperChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperChunk
        fields = ("id", "paper", "chunk_index", "text", "token_count", "section", "vector_id")


class IngestionJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionJob
        fields = (
            "id", "query_type", "query_text", "max_results",
            "status", "papers_added", "error_log", "celery_task_id",
            "created_at", "finished_at",
        )
        read_only_fields = ("status", "papers_added", "error_log", "celery_task_id", "created_at", "finished_at")
