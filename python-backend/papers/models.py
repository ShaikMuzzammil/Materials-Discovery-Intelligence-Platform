"""
Papers App - Models for Research Paper Management
"""

from django.db import models
from django.contrib.auth.models import User
import uuid


class ResearchPaper(models.Model):
    """Research paper model for storing scientific literature."""
    
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('extracted', 'Extracted'),
        ('error', 'Error'),
        ('validated', 'Validated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500, db_index=True)
    authors = models.TextField(help_text="Authors separated by commas")
    abstract = models.TextField(blank=True)
    year = models.IntegerField()
    doi = models.URLField(blank=True, unique=True, null=True)
    journal = models.CharField(max_length=255, blank=True)
    keywords = models.CharField(max_length=500, blank=True, help_text="Keywords separated by commas")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    
    # File storage
    pdf_file = models.FileField(upload_to='papers/pdfs/', null=True, blank=True)
    extracted_text = models.TextField(blank=True)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # NLP extraction stats
    entity_count = models.IntegerField(default=0)
    extraction_confidence = models.FloatField(default=0.0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['status']),
            models.Index(fields=['year']),
            models.Index(fields=['doi']),
        ]
    
    def __str__(self):
        return self.title[:100]
    
    @property
    def author_list(self):
        """Return authors as a list."""
        return [a.strip() for a in self.authors.split(',')]
    
    @property
    def keyword_list(self):
        """Return keywords as a list."""
        if self.keywords:
            return [k.strip() for k in self.keywords.split(',')]
        return []


class ExtractedEntity(models.Model):
    """Entity extracted from research papers using NLP."""
    
    ENTITY_TYPES = [
        ('material', 'Material'),
        ('property', 'Property'),
        ('method', 'Method'),
        ('application', 'Application'),
        ('condition', 'Condition'),
        ('value', 'Value'),
        ('unit', 'Unit'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paper = models.ForeignKey(ResearchPaper, on_delete=models.CASCADE, related_name='entities')
    material = models.ForeignKey('materials.Material', on_delete=models.SET_NULL, 
                                 related_name='paper_entities', null=True, blank=True)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES)
    entity_text = models.CharField(max_length=255, db_index=True)
    confidence = models.FloatField(default=0.8)
    context = models.TextField(blank=True, help_text="Surrounding text for context")
    position_start = models.IntegerField(null=True, blank=True)
    position_end = models.IntegerField(null=True, blank=True)
    
    # Normalized form (for linking to materials database)
    normalized_text = models.CharField(max_length=255, blank=True)
    is_linked = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-confidence']
        indexes = [
            models.Index(fields=['paper', 'entity_type']),
            models.Index(fields=['entity_type', 'entity_text']),
        ]
    
    def __str__(self):
        return f"{self.entity_type}: {self.entity_text}"


class ExtractionJob(models.Model):
    """Background job for paper processing/extraction."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    paper = models.ForeignKey(ResearchPaper, on_delete=models.CASCADE, related_name='extraction_jobs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Job details
    pipeline_used = models.CharField(max_length=100, default='nlp_pipeline_v1')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Results
    result = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    entities_found = models.IntegerField(default=0)
    processing_time_ms = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"ExtractionJob for {self.paper.title[:50]} - {self.status}"
