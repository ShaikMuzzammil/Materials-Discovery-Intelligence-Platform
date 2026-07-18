"""
Serializers for Materials App
"""

from rest_framework import serializers
from .models import Material, MaterialProperty, Category, KnowledgeEdge


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class MaterialPropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialProperty
        fields = '__all__'


class KnowledgeEdgeSerializer(serializers.ModelSerializer):
    source_material_name = serializers.CharField(source='source_material.name', read_only=True)
    target_material_name = serializers.CharField(source='target_material.name', read_only=True)
    
    class Meta:
        model = KnowledgeEdge
        fields = '__all__'


class MaterialSerializer(serializers.ModelSerializer):
    properties = MaterialPropertySerializer(many=True, read_only=True)
    outgoing_edges = KnowledgeEdgeSerializer(many=True, read_only=True)
    incoming_edges = KnowledgeEdgeSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Material
        fields = '__all__'


class MaterialListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    property_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Material
        fields = ['id', 'name', 'formula', 'category', 'category_name', 'source', 
                  'confidence', 'property_count', 'created_at']


class MaterialCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating materials with nested properties."""
    properties = MaterialPropertySerializer(many=True, required=False)
    
    class Meta:
        model = Material
        fields = ['name', 'formula', 'category', 'description', 'source', 'confidence', 'properties']
    
    def create(self, validated_data):
        properties_data = validated_data.pop('properties', [])
        material = Material.objects.create(**validated_data)
        
        for prop_data in properties_data:
            MaterialProperty.objects.create(material=material, **prop_data)
        
        return material


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    total_materials = serializers.IntegerField()
    total_papers = serializers.IntegerField()
    total_properties = serializers.IntegerField()
    total_edges = serializers.IntegerField()
    extraction_accuracy = serializers.FloatField()
    ml_prediction_score = serializers.FloatField()
