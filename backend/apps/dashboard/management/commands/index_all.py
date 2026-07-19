"""`python manage.py index_all` – vector-index all papers into ChromaDB for RAG."""
from django.core.management.base import BaseCommand
from backend.apps.papers.models import Paper
from ml.llm.rag_pipeline import index_paper


class Command(BaseCommand):
    help = "Index all papers' chunks into the ChromaDB vector store"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=0)

    def handle(self, *args, **options):
        papers = Paper.objects.all()
        if options["limit"]:
            papers = papers[: options["limit"]]
        total_chunks = 0
        for paper in papers:
            n = index_paper(paper.id)
            self.stdout.write(f"  paper #{paper.id}: indexed {n} chunks")
            total_chunks += n
        self.stdout.write(self.style.SUCCESS(f"Total indexed: {total_chunks} chunks across {papers.count()} papers"))
