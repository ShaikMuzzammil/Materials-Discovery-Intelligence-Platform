from rest_framework import serializers
from .models import Experiment, TrainingRun, HyperparameterTuningRun


class ExperimentSerializer(serializers.ModelSerializer):
    n_runs = serializers.SerializerMethodField()

    class Meta:
        model = Experiment
        fields = ("id", "name", "description", "domain", "created_by", "created_at", "updated_at", "n_runs")

    def get_n_runs(self, obj):
        return obj.runs.count()


class TrainingRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingRun
        fields = "__all__"


class HyperparameterTuningRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = HyperparameterTuningRun
        fields = "__all__"
