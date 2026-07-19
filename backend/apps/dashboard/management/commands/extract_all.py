"""`python manage.py extract_all` – run full extraction pipeline on all papers."""
from django.core.management.base import BaseCommand
from backend.apps.papers.models import Paper
from backend.apps.extraction.services import run_full_extraction


class Command(BaseCommand):
    help = "Run the full NER + relation extraction pipeline on all papers"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=0, help="Max papers to process (0 = all)")
        parser.add_argument("--paper-id", type=int, default=0, help="Only process this paper ID")

    def handle(self, *args, **options):
        if options["paper_id"]:
            papers = Paper.objects.filter(pk=options["paper_id"])
        else:
            papers = Paper.objects.all()
        if options["limit"]:
            papers = papers[: options["limit"]]
        self.stdout.write(f"Processing {papers.count()} papers...")
        for paper in papers:
            self.stdout.write(f"  -> paper #{paper.id}: {paper.title[:60]}...")
            try:
                result = run_full_extraction(paper.id)
                self.stdout.write(self.style.SUCCESS(
                    f"     ok: chunks={result.get('chunks', 0)}, "
                    f"entities={result.get('entities', 0)}, "
                    f"relations={result.get('relations', 0)}"
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"     failed: {e}"))
