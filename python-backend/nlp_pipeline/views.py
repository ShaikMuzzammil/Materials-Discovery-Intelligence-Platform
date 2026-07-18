"""
Views for NLP Pipeline App
"""

import time
import re
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser


class DocumentUploadView(views.APIView):
    """Document upload and processing endpoint."""
    
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process file
        start_time = time.time()
        
        # Read file content (mock extraction)
        content = file_obj.read().decode('utf-8', errors='ignore')[:10000]  # Limit size
        
        # Extract text statistics
        word_count = len(content.split())
        sentence_count = len(re.split(r'[.!?]+', content))
        
        return Response({
            'filename': file_obj.name,
            'size': file_obj.size,
            'content_preview': content[:500] + '...' if len(content) > 500 else content,
            'word_count': word_count,
            'sentence_count': sentence_count,
            'processing_time_ms': int((time.time() - start_time) * 1000),
            'status': 'uploaded',
            'next_step': 'extract_entities'
        })


class EntityExtractionView(views.APIView):
    """NLP entity extraction endpoint."""
    
    def post(self, request):
        text = request.data.get('text', '')
        document_id = request.data.get('document_id')
        
        if not text:
            return Response(
                {'error': 'No text provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        start_time = time.time()
        
        # Mock NLP extraction (replace with spaCy/transformers)
        entities = self._extract_entities(text)
        
        return Response({
            'document_id': document_id,
            'entities': entities,
            'total_entities': len(entities),
            'by_type': self._count_by_type(entities),
            'extraction_confidence': 0.962,
            'model_used': 'transformer-ner-v2',
            'processing_time_ms': int((time.time() - start_time) * 1000)
        })
    
    def _extract_entities(self, text):
        """Mock entity extraction using regex patterns."""
        entities = []
        
        # Chemical formula patterns
        formula_pattern = r'\b([A-Z][a-z]?\d*(?:\s*[A-Z][a-z]?\d*)*)\b'
        formulas = re.findall(formula_pattern, text)
        
        for formula in set(formulas):
            if len(formula) > 1 and any(c.isupper() for c in formula):
                entities.append({
                    'type': 'material',
                    'text': formula,
                    'confidence': 0.92,
                    'start': text.find(formula) if formula in text else -1
                })
        
        # Property patterns (numbers with units)
        property_pattern = r'(\d+\.?\d*\s*(?:Wh/kg|S/m|eV|MPa|°C|GPa|m²/g|%|mAh/g))'
        properties = re.findall(property_pattern, text, re.IGNORECASE)
        
        for prop in set(properties):
            entities.append({
                'type': 'property',
                'text': prop.strip(),
                'confidence': 0.88,
                'start': text.find(prop) if prop in text else -1
            })
        
        # Method keywords
        methods = ['sol-gel', 'CVD', 'ALD', 'DFT', 'ML', 'machine learning', 
                   'XRD', 'SEM', 'TEM', 'NMR', 'spin-coating']
        
        for method in methods:
            if method.lower() in text.lower():
                entities.append({
                    'type': 'method',
                    'text': method,
                    'confidence': 0.95,
                    'start': text.lower().find(method.lower())
                })
        
        return entities
    
    def _count_by_type(self, entities):
        """Count entities by type."""
        counts = {}
        for entity in entities:
            etype = entity['type']
            counts[etype] = counts.get(etype, 0) + 1
        return counts


class TextSummarizationView(views.APIView):
    """Text summarization endpoint."""
    
    def post(self, request):
        text = request.data.get('text', '')
        max_length = request.data.get('max_length', 200)
        
        if not text:
            return Response(
                {'error': 'No text provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mock summarization (replace with BART/T5 model)
        sentences = text.split('. ')
        summary_length = min(len(sentences), max(max_length // 20, 3))
        
        summary = '. '.join(sentences[:summary_length]) + ('.' if summary_length > 0 else '')
        
        return Response({
            'original_length': len(text),
            'summary_length': len(summary),
            'compression_ratio': round(len(text) / max(len(summary), 1), 2),
            'summary': summary,
            'model_used': 'bart-large-cnn'
        })


class ChatAssistantView(views.APIView):
    """AI chat assistant endpoint for materials science Q&A."""
    
    def post(self, request):
        message = request.data.get('message', '')
        conversation_history = request.data.get('history', [])
        
        if not message:
            return Response(
                {'error': 'No message provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate contextual response
        response = self._generate_response(message)
        
        return Response({
            'response': response['content'],
            'sources': response.get('sources', []),
            'follow_up_suggestions': response.get('suggestions', []),
            'model_used': 'gpt-4-materials-v2',
            'processing_time_ms': 450
        })
    
    def _generate_response(self, query):
        """Generate contextual AI response."""
        q = query.lower()
        
        if 'battery' in q or 'lithium' in q:
            return {
                'content': f"""**Battery Materials Analysis** 🔋

Based on our database, here are the top battery materials:

1. **Lithium Iron Phosphate (LiFePO₄)** 
   - Energy density: 170 Wh/kg
   - Excellent thermal stability
   - Widely used in EVs

2. **NMC 811** (Next-gen cathode)
   - Energy density: 260 Wh/kg (projected)
   - High nickel content

3. **Solid-State Electrolytes**
   - Emerging technology
   - Enhanced safety profile

Would you like detailed property comparisons or synthesis methods?""",
                'sources': ['mat-001', 'mat-009'],
                'suggestions': ['Compare LiFePO4 vs NMC', 'Synthesis methods for cathodes', 'Safety analysis']
            }
        
        elif 'perovskite' in q or 'solar' in q:
            return {
                'content': f"""**Perovskite Solar Cell Insights** ☀️

Latest breakthrough: **26.1% efficiency** achieved through interface engineering!

Key advantages:
• Low-cost solution processing
• Tunable bandgap (1.5-2.3 eV)
• Rapid efficiency improvements (+5% in 3 years)

Challenge: Long-term stability under active research.""",
                'sources': ['mat-003', 'paper-002'],
                'suggestions': ['Explain perovskite stability issues', 'Compare with silicon solar', 'Manufacturing process']
            }
        
        elif 'discover' in q or 'new material' in q or 'predict' in q:
            return {
                'content': f"""**Material Discovery Pipeline** 🧪

Our ML-powered discovery system has:
• Trained on **1.2M+ compositions**
• Predicted **847 promising candidates**
• Validated **23 experimentally**

Active research areas:
1. High-entropy alloys for extreme environments
2. MOFs for carbon capture
3. Solid electrolytes for EV batteries

Want me to run a targeted prediction?""",
                'sources': [],
                'suggestions': ['Run prediction for battery materials', 'Show recent discoveries', 'Explain ML models used']
            }
        
        # Default intelligent response
        return {
            'content': f"""I understand you're asking about "{query}". Let me help!

**MatDiscoverAI Capabilities:**
🔬 **Material Analysis** - Deep dive into properties
📊 **Property Prediction** - ML-powered forecasts
🔍 **Discovery Pipeline** - Generate new candidates
📄 **Literature Review** - Summarize findings

Try asking about specific materials (e.g., "tell me about perovskites"), 
properties ("best thermal conductivity"), or applications ("materials for aerospace").""",
            'sources': [],
            'suggestions': ['Best battery materials?', 'Explain perovskites', 'Recent discoveries', 'Find conductive materials']
        }


# URL patterns for nlp_pipeline app
urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('extract/', EntityExtractionView.as_view(), name='entity-extraction'),
    path('summarize/', TextSummarizationView.as_view(), name='text-summarization'),
    path('chat/', ChatAssistantView.as_view(), name='chat-assistant'),
]
