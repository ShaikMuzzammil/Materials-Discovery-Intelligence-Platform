from rest_framework import serializers
from .models import PredictionRequest, ModelRegistry


class PredictionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionRequest
        fields = (
            "id", "target", "inputs", "prediction",
            "confidence_low", "confidence_high",
            "model_name", "model_version", "duration_ms",
            "requested_by", "created_at",
        )
        read_only_fields = ("prediction", "confidence_low", "confidence_high",
                             "model_name", "model_version", "duration_ms",
                             "requested_by", "created_at")


class PredictionInputSerializer(serializers.Serializer):
    target = serializers.ChoiceField(choices=[
        ("capacity_mah_g", "Specific capacity (mAh/g)"),
        ("cycle_life", "Cycle life"),
        ("voltage_v", "Average voltage (V)"),
        ("energy_density_wh_kg", "Energy density (Wh/kg)"),
        ("safety_score", "Safety score (0-1)"),
        ("cost_usd_kg", "Cost (USD/kg)"),
    ])
    formula = serializers.CharField(max_length=200)
    synthesis_method = serializers.CharField(max_length=80, required=False, allow_blank=True)
    synthesis_temp_c = serializers.FloatField(required=False, default=700.0)
    algorithm = serializers.CharField(max_length=40, required=False, default="random_forest")


class ModelRegistrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelRegistry
        fields = "__all__"
