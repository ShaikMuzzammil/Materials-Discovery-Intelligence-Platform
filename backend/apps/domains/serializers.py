"""Domains app – serializers for prediction + training requests."""
from rest_framework import serializers


class PredictRequestSerializer(serializers.Serializer):
    domain = serializers.ChoiceField(choices=[
        ("battery", "Battery"), ("alloys", "Alloys"), ("polymers", "Polymers"),
        ("semiconductors", "Semiconductors"), ("catalysts", "Catalysts"),
        ("solar", "Solar"), ("hydrogen", "Hydrogen"),
    ])
    target = serializers.CharField(max_length=80)
    algorithm = serializers.CharField(max_length=40, default="random_forest")

    # Domain-specific inputs – flexible
    formula = serializers.CharField(max_length=200, required=False, allow_blank=True)
    smiles = serializers.CharField(max_length=500, required=False, allow_blank=True)
    polymer_type = serializers.CharField(max_length=100, required=False, allow_blank=True)
    molecular_weight = serializers.FloatField(required=False, default=100000.0)
    synthesis_method = serializers.CharField(max_length=80, required=False, allow_blank=True, default="solid-state")
    synthesis_temp_c = serializers.FloatField(required=False, default=700.0)
    processing_method = serializers.CharField(max_length=80, required=False, allow_blank=True, default="annealed")
    heat_treatment_temp_c = serializers.FloatField(required=False, default=600.0)
    crystal_structure = serializers.CharField(max_length=80, required=False, allow_blank=True, default="zincblende")
    doping_type = serializers.CharField(max_length=40, required=False, allow_blank=True, default="intrinsic")
    catalyst_type = serializers.CharField(max_length=80, required=False, allow_blank=True, default="metal")
    support_material = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    cell_type = serializers.CharField(max_length=80, required=False, allow_blank=True, default="mono-Si")
    deposition_method = serializers.CharField(max_length=100, required=False, allow_blank=True, default="Czochralski")
    storage_mechanism = serializers.CharField(max_length=80, required=False, allow_blank=True, default="metal-hydride")
    particle_size_nm = serializers.FloatField(required=False, default=1000.0)


class TrainRequestSerializer(serializers.Serializer):
    domain = serializers.ChoiceField(choices=[
        ("battery", "Battery"), ("alloys", "Alloys"), ("polymers", "Polymers"),
        ("semiconductors", "Semiconductors"), ("catalysts", "Catalysts"),
        ("solar", "Solar"), ("hydrogen", "Hydrogen"),
        ("all", "All domains"),
    ])
    target = serializers.CharField(max_length=80, required=False, default="all")
    algorithm = serializers.CharField(max_length=40, default="random_forest")


class TuneRequestSerializer(serializers.Serializer):
    domain = serializers.ChoiceField(choices=[
        ("battery", "Battery"), ("alloys", "Alloys"), ("polymers", "Polymers"),
        ("semiconductors", "Semiconductors"), ("catalysts", "Catalysts"),
        ("solar", "Solar"), ("hydrogen", "Hydrogen"),
    ])
    target = serializers.CharField(max_length=80)
    algorithm = serializers.CharField(max_length=40, default="random_forest")
    n_trials = serializers.IntegerField(default=20, min_value=5, max_value=200)
    use_optuna = serializers.BooleanField(default=True)


class ExplainRequestSerializer(serializers.Serializer):
    domain = serializers.CharField(max_length=40)
    target = serializers.CharField(max_length=80)
    algorithm = serializers.CharField(max_length=40, default="random_forest")
    input_features = serializers.JSONField(required=False)


class UncertaintyRequestSerializer(serializers.Serializer):
    domain = serializers.CharField(max_length=40)
    target = serializers.CharField(max_length=80)
    algorithm = serializers.CharField(max_length=40, default="random_forest")
    method = serializers.ChoiceField(choices=["conformal", "bootstrap", "quantile"], default="conformal")
    confidence = serializers.FloatField(default=0.9, min_value=0.5, max_value=0.99)
    input_features = serializers.JSONField(required=False)
