"""
Serializers for Papers App
"""

from rest_framework import serializers
from .models import ResearchPaper, ExtractedEntity, ExtractionJob


class ExtractedEntitySerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    
    class Meta:
        model = ExtractedEntity
        fields = '__all__'


class PaperListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    entity_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ResearchPaper
        fields = ['id', 'title', 'authors', 'year', 'journal', 'doi', 
                  'status', 'entity_count', 'created_at']


class PaperDetailSerializer(serializers.ModelSerializer):
    """Full serializer with entities."""
    entities = ExtractedEntitySerializer(many=True, read_only=True)
    author_list = serializers.ListField(child=serializers.CharField(), read_only=True)
    keyword_list = serializers.ListField(child=serializers.CharField(), read_only=True)
    
    class Meta:
        model = ResearchPaper
        fields = '__all__'


class PaperCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating papers."""
    
    class Meta:
        model = ResearchPaper
        fields = ['title', 'authors', 'abstract', 'year', 'doi', 'journal', 'keywords']


class ExtractionJobSerializer(serializers.ModelSerializer):
    paper_title = serializers.CharField(source='paper.title', read_only=True)
    
    class Meta:
        model = ExtractionJob
        fields = '__all__'
