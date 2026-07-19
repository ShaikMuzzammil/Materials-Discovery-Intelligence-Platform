"""Experiments app – MLflow-style experiment tracking views."""
import time
import logging
from django.shortcuts import render, get_object_or_404
from django.urls import path
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from ml.models.universal_trainer import train_model, train_all_models_for_domain, list_trained_models
from ml.models.tuning import tune_model
from .models import Experiment, TrainingRun, HyperparameterTuningRun
from .serializers import ExperimentSerializer, TrainingRunSerializer, HyperparameterTuningRunSerializer

log = logging.getLogger(__name__)


class ExperimentViewSet(viewsets.ModelViewSet):
    queryset = Experiment.objects.all()
    serializer_class = ExperimentSerializer
    permission_classes = [AllowAny]
    search_fields = ["name", "domain"]
    filterset_fields = ["domain"]


class TrainingRunViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TrainingRun.objects.all()
    serializer_class = TrainingRunSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["domain", "target", "algorithm", "status", "experiment"]
    ordering_fields = ["created_at", "duration_seconds"]


@api_view(["POST"])
@drf_perm([AllowAny])
def track_training_view(request):
    """Train a model AND log it as a TrainingRun (experiment tracking)."""
    domain = request.data.get("domain", "battery")
    target = request.data.get("target", "capacity_mah_g")
    algorithm = request.data.get("algorithm", "random_forest")
    experiment_id = request.data.get("experiment_id")

    # Create or get experiment
    if experiment_id:
        experiment = get_object_or_404(Experiment, pk=experiment_id)
    else:
        experiment, _ = Experiment.objects.get_or_create(
            name=f"{domain} {target} optimization",
            defaults={"domain": domain, "description": f"Auto-created for {target}"},
        )

    # Create the training run record (status=running)
    run = TrainingRun.objects.create(
        experiment=experiment, domain=domain, target=target,
        algorithm=algorithm, hyperparameters=request.data.get("hyperparameters", {}),
        status="running",
    )

    try:
        result = train_model(domain, target, algorithm, save=True)
        run.metrics = result.metrics
        run.model_path = result.model_path
        run.dataset_n_samples = result.n_samples
        run.dataset_n_features = result.n_features
        run.duration_seconds = result.duration_seconds
        run.feature_importance = result.metrics.get("top_features", {})
        run.status = "completed" if result.success else "failed"
        if not result.success:
            run.error_log = result.error
        run.save()
        return Response({
            "run_id": run.id, "experiment_id": experiment.id,
            "result": result.__dict__,
        })
    except Exception as e:
        run.status = "failed"
        run.error_log = str(e)
        run.save()
        return Response({"error": str(e), "run_id": run.id}, status=500)


@api_view(["POST"])
@drf_perm([AllowAny])
def track_tuning_view(request):
    """Tune hyperparameters AND log it as a HyperparameterTuningRun."""
    domain = request.data.get("domain", "battery")
    target = request.data.get("target", "capacity_mah_g")
    algorithm = request.data.get("algorithm", "random_forest")
    n_trials = int(request.data.get("n_trials", 20))
    use_optuna = request.data.get("use_optuna", True)

    try:
        result = tune_model(domain, target, algorithm, n_trials=n_trials, use_optuna=use_optuna)
        run = HyperparameterTuningRun.objects.create(
            domain=domain, target=target, algorithm=algorithm,
            n_trials=n_trials, best_params=result.best_params,
            best_score=result.best_score,
            duration_seconds=result.duration_seconds,
            method="optuna" if use_optuna else "grid_search",
        )
        return Response({"run_id": run.id, "result": result.__dict__})
    except Exception as e:
        log.exception("Tuning tracking failed")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@drf_perm([AllowAny])
def leaderboard_view(request):
    """Get a leaderboard of best models per (domain, target)."""
    runs = TrainingRun.objects.filter(status="completed").values(
        "domain", "target", "algorithm", "metrics", "duration_seconds", "created_at"
    )
    # Group by (domain, target) and pick best R²
    leaderboard = {}
    for run in runs:
        key = f"{run['domain']}__{run['target']}"
        r2 = (run.get("metrics") or {}).get("r2", -1)
        if key not in leaderboard or r2 > leaderboard[key]["r2"]:
            leaderboard[key] = {
                "domain": run["domain"],
                "target": run["target"],
                "algorithm": run["algorithm"],
                "r2": r2,
                "rmse": (run.get("metrics") or {}).get("rmse", 0),
                "mae": (run.get("metrics") or {}).get("mae", 0),
                "duration_seconds": run["duration_seconds"],
                "created_at": run["created_at"].isoformat(),
            }
    return Response({"leaderboard": list(leaderboard.values())})


# Template views
def experiments_landing_view(request):
    experiments = Experiment.objects.all()[:20]
    recent_runs = TrainingRun.objects.all()[:30]
    return render(request, "experiments/landing.html", {
        "experiments": experiments,
        "recent_runs": recent_runs,
        "section": "experiments",
    })


def experiment_detail_view(request, pk):
    exp = get_object_or_404(Experiment, pk=pk)
    runs = exp.runs.all()
    return render(request, "experiments/detail.html", {
        "experiment": exp, "runs": runs, "section": "experiments",
    })


def leaderboard_view_template(request):
    from django.db.models import Max
    runs = TrainingRun.objects.filter(status="completed").order_by("-metrics__r2")[:50]
    return render(request, "experiments/leaderboard.html", {
        "runs": runs, "section": "experiments",
    })


urlpatterns = [
    # API
    path("api/experiments/", ExperimentViewSet.as_view({
        "get": "list", "post": "create"
    }), name="api-experiment-list"),
    path("api/experiments/<int:pk>/", ExperimentViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="api-experiment-detail"),
    path("api/runs/", TrainingRunViewSet.as_view({"get": "list"}), name="api-run-list"),
    path("api/runs/<int:pk>/", TrainingRunViewSet.as_view({"get": "retrieve"}), name="api-run-detail"),
    path("api/track-training/", track_training_view, name="api-track-training"),
    path("api/track-tuning/", track_tuning_view, name="api-track-tuning"),
    path("api/leaderboard/", leaderboard_view, name="api-leaderboard"),
    # Templates
    path("", experiments_landing_view, name="experiments-landing"),
    path("<int:pk>/", experiment_detail_view, name="experiment-detail"),
    path("leaderboard/", leaderboard_view_template, name="experiments-leaderboard"),
]
