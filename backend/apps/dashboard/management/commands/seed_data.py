"""`python manage.py seed_data` – populate the database with sample data."""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed the database with sample battery-materials papers + CSV dataset + MaterialRecords"

    def handle(self, *args, **options):
        # Run the seed functions directly (defined inline here to avoid sys.path hacks)
        from backend.apps.papers.models import Paper
        from backend.apps.knowledge_graph.models import Material
        from backend.apps.materials.models import MaterialRecord
        from django.conf import settings
        import csv
        from pathlib import Path

        # Import the sample papers + CSV generator from the standalone script
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "seed_data_script",
            Path(settings.BASE_DIR) / "scripts" / "seed_data.py"
        )
        seed_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(seed_module)

        seed_module.seed_papers()
        seed_module.seed_battery_csv()
        seed_module.seed_material_records()
        self.stdout.write(self.style.SUCCESS("Seed complete."))
