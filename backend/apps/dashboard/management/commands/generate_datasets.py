"""`python manage.py generate_datasets` – generate all 7 domain CSVs."""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Generate sample datasets for all 7 material domains"

    def handle(self, *args, **options):
        import importlib.util
        from pathlib import Path
        from django.conf import settings

        spec = importlib.util.spec_from_file_location(
            "gen_datasets",
            Path(settings.BASE_DIR) / "scripts" / "generate_all_datasets.py"
        )
        gen_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(gen_module)

        base_dir = Path(settings.ML_SETTINGS["DATA_DIR"])
        gen_module.write_all_datasets(base_dir)
        self.stdout.write(self.style.SUCCESS("All datasets generated."))
