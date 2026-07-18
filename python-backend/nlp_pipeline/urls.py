"""
URL configuration for NLP Pipeline App
"""

from django.urls import path
from .views import (
    DocumentUploadView,
    EntityExtractionView,
    TextSummarizationView,
    ChatAssistantView
)

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('extract/', EntityExtractionView.as_view(), name='entity-extraction'),
    path('summarize/', TextSummarizationView.as_view(), name='text-summarization'),
    path('chat/', ChatAssistantView.as_view(), name='chat-assistant'),
]
