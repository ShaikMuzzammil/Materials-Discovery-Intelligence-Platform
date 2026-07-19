import time
from django.shortcuts import render
from django.urls import path
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny

from .models import PredictionRequest, ModelRegistry
from .serializers import PredictionRequestSerializer, PredictionInputSerializer, ModelRegistrySerializer


class PredictionRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PredictionRequest.objects.all()
    serializer_class = PredictionRequestSerializer
    filterset_fields = ["target", "model_name"]


class ModelRegistryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ModelRegistry.objects.all()
    serializer_class = ModelRegistrySerializer


@api_view(["POST"])
@drf_perm([AllowAny])
def predict_view(request):
    """Run a single prediction.

    POST /api/predictions/predict/
    {
        "target": "capacity_mah_g",
        "formula": "LiFePO4",
        "synthesis_method": "sol-gel",
        "synthesis_temp_c": 700
    }
    """
    ser = PredictionInputSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data

    from ml.models.train_property_predictor import predict_property
    started = time.time()
    result = predict_property(
        target=data["target"],
        formula=data["formula"],
        synthesis_method=data.get("synthesis_method") or "solid-state",
        synthesis_temp_c=data.get("synthesis_temp_c", 700.0),
        algorithm=data.get("algorithm", "random_forest"),
    )
    duration_ms = int((time.time() - started) * 1000)

    log_obj = PredictionRequest.objects.create(
        target=data["target"],
        inputs={
            "formula": data["formula"],
            "synthesis_method": data.get("synthesis_method"),
            "synthesis_temp_c": data.get("synthesis_temp_c", 700.0),
            "algorithm": data.get("algorithm", "random_forest"),
        },
        prediction=result["prediction"],
        confidence_low=result["confidence_low"],
        confidence_high=result["confidence_high"],
        model_name=f"{data['target']}_{data.get('algorithm', 'random_forest')}",
        model_version="1.0",
        duration_ms=duration_ms,
        requested_by=request.user if request.user.is_authenticated else None,
    )
    return Response({
        **result,
        "log_id": log_obj.id,
        "duration_ms": duration_ms,
    })


@api_view(["POST"])
@drf_perm([AllowAny])
def train_view(request):
    """Trigger model training for a specific target (or all)."""
    target = request.data.get("target", "all")
    algorithm = request.data.get("algorithm", "random_forest")
    from ml.models.train_property_predictor import train_model, train_all_models
    if target == "all":
        results = train_all_models()
    else:
        results = train_model(target=target, algorithm=algorithm, save=True)
    return Response({"ok": True, "results": results})


# ---------------- Templates ----------------
def predict_view_template(request):
    """Render the prediction form + result page."""
    history = PredictionRequest.objects.all()[:20]
    return render(request, "predictions/predict.html", {
        "history": history,
        "targets": PredictionRequest.TARGET_CHOICES,
        "section": "predictions",
    })


def training_view(request):
    """Render the model training dashboard."""
    models = ModelRegistry.objects.all()
    return render(request, "predictions/training.html", {
        "models": models,
        "section": "predictions",
    })


urlpatterns = [
    # API
    path("api/", PredictionRequestViewSet.as_view({"get": "list"}), name="api-prediction-list"),
    path("api/<int:pk>/", PredictionRequestViewSet.as_view({"get": "retrieve"}), name="api-prediction-detail"),
    path("api/models/", ModelRegistryViewSet.as_view({"get": "list"}), name="api-model-registry-list"),
    path("api/predict/", predict_view, name="api-predict"),
    path("api/train/", train_view, name="api-train"),
    # Templates
    path("", predict_view_template, name="predictions-predict"),
    path("training/", training_view, name="predictions-training"),
]
