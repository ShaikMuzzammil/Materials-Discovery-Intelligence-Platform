from django.contrib import admin
from .models import MaterialRecord


@admin.register(MaterialRecord)
class MaterialRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "formula_pretty", "formula", "source", "band_gap", "is_stable", "cached_at")
    list_filter = ("source", "is_stable")
    search_fields = ("formula", "formula_pretty", "elements")
