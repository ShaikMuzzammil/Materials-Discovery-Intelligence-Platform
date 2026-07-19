"""`python manage.py build_kg` – build the knowledge graph from extracted entities."""
from django.core.management.base import BaseCommand
from backend.apps.knowledge_graph.services import build_graph_from_papers


class Command(BaseCommand):
    help = "Build the materials knowledge graph from all extracted entities + relations"

    def handle(self, *args, **options):
        G = build_graph_from_papers(save_snapshot=True)
        self.stdout.write(self.style.SUCCESS(
            f"KG built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges"
        ))
