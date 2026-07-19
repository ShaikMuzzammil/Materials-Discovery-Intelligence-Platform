"""`python manage.py ingest_arxiv` – fetch papers from arXiv API."""
from django.core.management.base import BaseCommand
from backend.apps.papers.services import search_arxiv


class Command(BaseCommand):
    help = "Search arXiv and ingest papers into the database"

    def add_arguments(self, parser):
        parser.add_argument("query", type=str, help="arXiv search query (e.g. 'lithium battery cathode')")
        parser.add_argument("--max", type=int, default=20, help="Max results")

    def handle(self, *args, **options):
        papers = search_arxiv(options["query"], max_results=options["max"])
        self.stdout.write(self.style.SUCCESS(
            f"Ingested {len(papers)} new papers from arXiv for query '{options['query']}'"
        ))
