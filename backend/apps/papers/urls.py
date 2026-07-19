from django.shortcuts import get_object_or_404, render
from django.urls import path
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny

from .models import Paper, PaperChunk, IngestionJob
from .serializers import PaperSerializer, PaperChunkSerializer, IngestionJobSerializer
from .services import run_ingestion_job


# ---------------- API ----------------
class PaperViewSet(viewsets.ModelViewSet):
    queryset = Paper.objects.all()
    serializer_class = PaperSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["source", "status", "doi"]
    search_fields = ["title", "abstract", "authors"]
    ordering_fields = ["published_at", "created_at", "title"]

    @action(detail=True, methods=["post"])
    @drf_perm([AllowAny])
    def extract(self, request, pk=None):
        """Trigger entity extraction for this paper."""
        from backend.apps.extraction.tasks import extract_paper_entities
        paper = self.get_object()
        try:
            task = extract_paper_entities.delay(paper.id)
            return Response({"task_id": task.id, "paper_id": paper.id, "status": "queued"})
        except Exception:
            # Celery broker not available — run synchronously
            from backend.apps.extraction.services import run_full_extraction
            result = run_full_extraction(paper.id)
            return Response({"paper_id": paper.id, "status": "done", "result": result})

    @action(detail=True, methods=["post"])
    @drf_perm([AllowAny])
    def index(self, request, pk=None):
        """Vector-index this paper's chunks for RAG."""
        from backend.apps.extraction.tasks import index_paper_in_vector_db
        paper = self.get_object()
        try:
            task = index_paper_in_vector_db.delay(paper.id)
            return Response({"task_id": task.id, "paper_id": paper.id, "status": "queued"})
        except Exception:
            from ml.llm.rag_pipeline import index_paper
            count = index_paper(paper.id)
            return Response({"paper_id": paper.id, "status": "done", "indexed_chunks": count})


class IngestionJobViewSet(viewsets.ModelViewSet):
    queryset = IngestionJob.objects.all()
    serializer_class = IngestionJobSerializer
    permission_classes = [AllowAny]  # demo-friendly; tighten in production

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save(started_by=request.user if request.user.is_authenticated else None)
        # Run synchronously if Celery broker not available, else queue
        try:
            from backend.celery import app as celery_app
            inspect = celery_app.control.inspect(timeout=1)
            if inspect.ping():
                task = run_ingestion_job.delay(job.id)
                job.celery_task_id = task.id
                job.save(update_fields=["celery_task_id"])
            else:
                run_ingestion_job(job.id)
        except Exception:
            run_ingestion_job(job.id)
        return Response(IngestionJobSerializer(job).data, status=status.HTTP_201_CREATED)


# ---------------- Templates ----------------
def paper_list_view(request):
    papers = Paper.objects.all()[:50]
    return render(request, "papers/list.html", {"papers": papers, "section": "papers"})


def paper_detail_view(request, pk):
    paper = get_object_or_404(Paper, pk=pk)
    chunks = paper.chunks.all()[:20]
    return render(request, "papers/detail.html", {"paper": paper, "chunks": chunks, "section": "papers"})


urlpatterns = [
    # API
    path("api/", PaperViewSet.as_view({"get": "list", "post": "create"}), name="api-paper-list"),
    path("api/<int:pk>/", PaperViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="api-paper-detail"),
    path("api/<int:pk>/extract/", PaperViewSet.as_view({"post": "extract"}), name="api-paper-extract"),
    path("api/<int:pk>/index/", PaperViewSet.as_view({"post": "index"}), name="api-paper-index"),
    path("api/jobs/", IngestionJobViewSet.as_view({"get": "list", "post": "create"}), name="api-job-list"),
    path("api/jobs/<int:pk>/", IngestionJobViewSet.as_view({"get": "retrieve"}), name="api-job-detail"),
    # Templates
    path("", paper_list_view, name="paper-list"),
    path("<int:pk>/", paper_detail_view, name="paper-detail"),
]
