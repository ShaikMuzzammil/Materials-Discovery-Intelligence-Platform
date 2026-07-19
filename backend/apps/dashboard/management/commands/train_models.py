"""`python manage.py train_models` – train ML property predictors."""
from django.core.management.base import BaseCommand
from ml.models.train_property_predictor import train_all_models


class Command(BaseCommand):
    help = "Train ML property prediction models for all battery-material targets"

    def add_arguments(self, parser):
        parser.add_argument("--target", type=str, default="all",
                            help="Specific target (capacity_mah_g, cycle_life, ...) or 'all'")

    def handle(self, *args, **options):
        if options["target"] == "all":
            results = train_all_models()
        else:
            from ml.models.train_property_predictor import train_model
            results = train_model(target=options["target"], algorithm="random_forest", save=True)
        self.stdout.write(self.style.SUCCESS(f"Training results: {results}"))
