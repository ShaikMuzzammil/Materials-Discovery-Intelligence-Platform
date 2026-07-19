"""`python manage.py train_all_domains` – train models for all 7 domains."""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Train ML models for all 7 material domains (or a single domain)"

    def add_arguments(self, parser):
        parser.add_argument("--domain", type=str, default="all",
                            help="Domain to train (battery, alloys, polymers, semiconductors, catalysts, solar, hydrogen, all)")
        parser.add_argument("--algorithm", type=str, default="random_forest",
                            help="Algorithm to use (random_forest, gradient_boosting, xgboost, etc.)")

    def handle(self, *args, **options):
        from ml.models.universal_trainer import train_all_models, train_all_models_for_domain
        domain = options["domain"]
        algorithm = options["algorithm"]

        if domain == "all":
            results = train_all_models([algorithm])
            for d, dr in results.items():
                self.stdout.write(f"\n=== {d} ===")
                for r in dr:
                    status = "✓" if r.success else "✗"
                    r2 = r.metrics.get("r2", "N/A") if r.metrics else "N/A"
                    self.stdout.write(f"  {status} {r.target:35s} R²={r2}")
        else:
            results = train_all_models_for_domain(domain, [algorithm])
            self.stdout.write(f"\n=== {domain} ===")
            for r in results:
                status = "✓" if r.success else "✗"
                r2 = r.metrics.get("r2", "N/A") if r.metrics else "N/A"
                self.stdout.write(f"  {status} {r.target:35s} R²={r2}")

        self.stdout.write(self.style.SUCCESS("Training complete."))
