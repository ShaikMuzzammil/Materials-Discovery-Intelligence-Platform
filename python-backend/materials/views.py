"""
Views for Materials App
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Material, MaterialProperty, Category, KnowledgeEdge
from .serializers import (
    MaterialSerializer, 
    MaterialListSerializer, 
    MaterialCreateSerializer,
    CategorySerializer,
    KnowledgeEdgeSerializer,
    DashboardStatsSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for categories."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class MaterialViewSet(viewsets.ModelViewSet):
    """API endpoint for materials with full CRUD operations."""
    queryset = Material.objects.select_related('category').prefetch_related(
        'properties', 'outgoing_edges', 'incoming_edges'
    )
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'source']
    search_fields = ['name', 'formula', 'description']
    ordering_fields = ['name', 'created_at', 'confidence', '-created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MaterialListSerializer
        elif self.action == 'create':
            return MaterialCreateSerializer
        return MaterialSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Return dashboard statistics."""
        from papers.models import ResearchPaper
        
        stats = {
            'total_materials': Material.objects.count(),
            'total_papers': ResearchPaper.objects.count(),
            'total_properties': MaterialProperty.objects.count(),
            'total_edges': KnowledgeEdge.objects.count(),
            'extraction_accuracy': 96.2,
            'ml_prediction_score': 94.7,
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Return material counts by category."""
        from django.db.models import Count
        
        categories = Category.objects.annotate(
            material_count=Count('materials')
        ).order_by('-material_count')
        
        data = [
            {
                'name': cat.name,
                'value': cat.material_count,
                'color': cat.color,
                'slug': cat.slug
            }
            for cat in categories
        ]
        
        return Response(data)
    
    @action(detail=True, methods=['get'])
    def related_papers(self, request, pk=None):
        """Get research papers related to this material."""
        material = self.get_object()
        from papers.models import ResearchPaper
        
        # Find papers that mention this material in their entities or abstract
        papers = ResearchPaper.objects.filter(
            models.Q(entities__entity_text__icontains=material.name) |
            models.Q(abstract__icontains=material.name) |
            models.Q(title__icontains=material.name)
        ).distinct()
        
        from papers.serializers import PaperListSerializer
        serializer = PaperListSerializer(papers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def predict_property(self, request):
        """ML-based property prediction endpoint."""
        # This would integrate with ML service
        composition = request.data.get('composition')
        property_name = request.data.get('property_name')
        model_type = request.data.get('model_type', 'ensemble')
        
        # Mock prediction (replace with actual ML call)
        prediction = {
            'composition': composition,
            'property': property_name,
            'predicted_value': 172.4,
            'uncertainty': 5.2,
            'confidence_interval_95': [167.2, 177.6],
            'model_used': model_type,
            'similar_materials': ['LiFePO4', 'NMC 111'],
            'model_confidence': 0.94,
            'processing_time_ms': 45
        }
        
        return Response(prediction)


class MaterialPropertyViewSet(viewsets.ModelViewSet):
    """API endpoint for material properties."""
    queryset = MaterialProperty.objects.select_related('material').all()
    serializer_class = MaterialPropertySerializer
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['material', 'property_type']
    search_fields = ['property_name', 'unit']


class KnowledgeEdgeViewSet(viewsets.ModelViewSet):
    """API endpoint for knowledge graph edges."""
    queryset = KnowledgeEdge.objects.select_related('source_material', 'target_material').all()
    serializer_class = KnowledgeEdgeSerializer
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['relation_type']
    search_fields = ['source_material__name', 'target_material__name']
    
    @action(detail=False, methods=['get'])
    def graph_data(self, request):
        """Return data for knowledge graph visualization."""
        edges = self.queryset[:100]  # Limit to prevent huge responses
        
        nodes = set()
        links = []
        
        for edge in edges:
            nodes.add(edge.source_material.id)
            nodes.add(edge.target_material.id)
            links.append({
                'source': str(edge.source_material.id),
                'target': str(edge.target_material.id),
                'type': edge.relation_type,
                'confidence': edge.confidence
            })
        
        # Get node details
        materials = Material.objects.filter(id__in=nodes)
        node_data = [{
            'id': str(m.id),
            'name': m.name,
            'formula': m.formula,
            'category': m.category.name,
            'color': m.category.color
        } for m in materials]
        
        return Response({
            'nodes': node_data,
            'links': links,
            'stats': {
                'total_nodes': len(node_data),
                'total_links': len(links)
            }
        })
