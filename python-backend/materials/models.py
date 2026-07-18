"""
Materials App - Models for Material Discovery Platform
"""

from django.db import models
from django.contrib.auth.models import User
import uuid


class Category(models.Model):
    """Material category classification."""
    
    CATEGORY_CHOICES = [
        ('battery', 'Battery'),
        ('semiconductor', 'Semiconductor'),
        ('alloy', 'Alloy'),
        ('polymer', 'Polymer'),
        ('ceramic', 'Ceramic'),
        ('catalyst', 'Catalyst'),
        ('solar', 'Solar'),
        ('biomedical', 'Biomedical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, choices=CATEGORY_CHOICES)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#6366f1')
    icon = models.CharField(max_length=50, default='atom')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Material(models.Model):
    """Core material model."""
    
    SOURCE_CHOICES = [
        ('manual', 'Manual Entry'),
        ('literature', 'Literature Extraction'),
        ('ml_predicted', 'ML Prediction'),
        ('experimental', 'Experimental Data'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    formula = models.CharField(max_length=100, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='materials')
    description = models.TextField(blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    confidence = models.FloatField(default=1.0)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    doi = models.URLField(blank=True)
    embedding_vector = models.JSONField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.formula})"
    
    @property
    def property_count(self):
        return self.properties.count()


class MaterialProperty(models.Model):
    """Property of a material."""
    
    PROPERTY_TYPES = [
        ('electrical', 'Electrical'),
        ('thermal', 'Thermal'),
        ('mechanical', 'Mechanical'),
        ('optical', 'Optical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='properties')
    property_name = models.CharField(max_length=100, db_index=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    value = models.FloatField(null=True, blank=True)
    value_string = models.CharField(max_length=100, blank=True)
    unit = models.CharField(max_length=20, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    pressure = models.FloatField(null=True, blank=True)
    source = models.CharField(max_length=100, default='literature')
    confidence = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['property_name']
    
    def __str__(self):
        return f"{self.material.name}: {self.property_name}"


class KnowledgeEdge(models.Model):
    """Relationship between materials."""
    
    RELATION_TYPES = [
        ('has_property', 'Has Property'),
        ('used_in', 'Used In'),
        ('related_to', 'Related To'),
        ('alternative_to', 'Alternative To'),
        ('improves', 'Improves'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='outgoing_edges')
    target_material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='incoming_edges')
    relation_type = models.CharField(max_length=30, choices=RELATION_TYPES)
    confidence = models.FloatField(default=0.8)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-confidence']
    
    def __str__(self):
        return f"{self.source_material.name} -> {self.target_material.name}"
