"""Paper models – store metadata + raw text + processing state."""
from django.db import models
from django.conf import settings


class Paper(models.Model):
    SOURCE_CHOICES = [
        ("arxiv", "arXiv"),
        ("semantic_scholar", "Semantic Scholar"),
        ("openalex", "OpenAlex"),
        ("crossref", "Crossref"),
        ("materials_project", "Materials Project"),
        ("manual", "Manual upload"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending ingestion"),
        ("fetched", "Fetched"),
        ("parsed", "Parsed"),
        ("extracted", "Entities extracted"),
        ("indexed", "Vector-indexed"),
        ("failed", "Failed"),
    ]

    source = models.CharField(max_length=40, choices=SOURCE_CHOICES, default="manual")
    source_id = models.CharField(max_length=200, blank=True, help_text="arXiv ID, DOI, MP ID")
    doi = models.CharField(max_length=200, blank=True, db_index=True)
    title = models.CharField(max_length=600)
    authors = models.TextField(blank=True, help_text="Newline-separated list of authors")
    abstract = models.TextField(blank=True)
    full_text = models.TextField(blank=True, help_text="Extracted plain text")
    published_at = models.DateField(null=True, blank=True)
    journal = models.CharField(max_length=300, blank=True)
    pdf_url = models.URLField(blank=True, max_length=1000)
    keywords = models.JSONField(default=list, blank=True)
    domains = models.JSONField(default=list, blank=True, help_text="battery, alloy, polymer, etc.")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    ingestion_error = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="papers"
    )
    raw_pdf = models.FileField(upload_to="papers/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["source", "source_id"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.title[:80]} ({self.source})"


class PaperChunk(models.Model):
    """A chunk of a paper used for vector embedding + RAG retrieval."""

    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name="chunks")
    chunk_index = models.PositiveIntegerField()
    text = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    section = models.CharField(max_length=120, blank=True, help_text="intro/methods/results/etc.")
    vector_id = models.CharField(max_length=200, blank=True, help_text="ChromaDB chunk id")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("paper", "chunk_index")
        indexes = [models.Index(fields=["paper", "chunk_index"])]


class IngestionJob(models.Model):
    """Tracks a batch ingestion task (e.g. fetch 50 arXiv papers about Li-ion cathodes)."""

    QUERY_CHOICES = [
        ("arxiv_search", "arXiv search"),
        ("semantic_scholar", "Semantic Scholar search"),
        ("openalex", "OpenAlex search"),
        ("doi_batch", "DOI list"),
        ("pdf_upload", "PDF upload"),
    ]

    query_type = models.CharField(max_length=40, choices=QUERY_CHOICES)
    query_text = models.CharField(max_length=400)
    max_results = models.PositiveIntegerField(default=20)
    status = models.CharField(max_length=20, default="queued")
    papers_added = models.PositiveIntegerField(default=0)
    error_log = models.TextField(blank=True)
    started_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="ingestion_jobs"
    )
    celery_task_id = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.query_type}:{self.query_text[:40]} → {self.status}"
