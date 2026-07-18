"""
Views for Papers App
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import ResearchPaper, ExtractedEntity, ExtractionJob
from .serializers import (
    PaperListSerializer,
    PaperDetailSerializer,
    PaperCreateSerializer,
    ExtractedEntitySerializer,
    ExtractionJobSerializer
)


class ResearchPaperViewSet(viewsets.ModelViewSet):
    """API endpoint for research papers."""
    
    parser_classes = [MultiPartParser, FormParser]
    queryset = ResearchPaper.objects.prefetch_related('entities').all()
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'year', 'journal']
    search_fields = ['title', 'authors', 'abstract', 'keywords']
    ordering_fields = ['year', 'created_at', '-created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PaperListSerializer
        elif self.action == 'create':
            return PaperCreateSerializer
        return PaperDetailSerializer
    
    @action(detail=True, methods=['post'])
    def extract_entities(self, request, pk=None):
        """Trigger NLP extraction for a paper."""
        paper = self.get_object()
        
        # Create extraction job
        job = ExtractionJob.objects.create(
            paper=paper,
            status='processing'
        )
        
        # Here you would call the NLP pipeline asynchronously
        # For now, we'll simulate it
        
        return Response({
            'job_id': str(job.id),
            'status': 'processing',
            'message': 'Extraction job started'
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Return paper statistics."""
        from django.db.models import Count
        
        stats = {
            'total': ResearchPaper.objects.count(),
            'by_status': dict(
                ResearchPaper.objects.values_list('status')
                .annotate(count=Count('id'))
                .values_list('status', 'count')
            ),
            'by_year': dict(
                ResearchPaper.objects.values_list('year')
                .annotate(count=Count('id'))
                .order_by('-year')
                .values_list('year', 'count')
            ),
            'total_entities': ExtractedEntity.objects.count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Generate download URL for paper PDF."""
        paper = self.get_object()
        
        if paper.pdf_file:
            return Response({
                'url': paper.pdf_file.url,
                'filename': paper.pdf_file.name.split('/')[-1]
            })
        
        # If no file, try to construct DOI URL
        if paper.doi:
            return Response({
                'url': f'https://doi.org/{paper.doi}',
                'external': True
            })
        
        return Response({'error': 'No file available'}, status=status.HTTP_404_NOT_FOUND)


class ExtractedEntityViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for extracted entities (read-only)."""
    queryset = ExtractedEntity.objects.select_related('paper', 'material').all()
    serializer_class = ExtractedEntitySerializer
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['entity_type', 'paper', 'is_linked']
    search_fields = ['entity_text', 'context']


class ExtractionJobViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for extraction jobs (read-only)."""
    queryset = ExtractionJob.objects.select_related('paper').all()
    serializer_class = ExtractionJobSerializer
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'paper']
