from django.contrib import admin
from .models import PredictionRequest, ModelRegistry


@admin.register(PredictionRequest)
class PredictionRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "target", "prediction", "model_name", "duration_ms", "created_at")
    list_filter = ("target", "model_name")


@admin.register(ModelRegistry)
class ModelRegistryAdmin(admin.ModelAdmin):
    list_display = ("name", "target", "algorithm", "is_active", "trained_at")
    list_filter = ("target", "algorithm", "is_active")
