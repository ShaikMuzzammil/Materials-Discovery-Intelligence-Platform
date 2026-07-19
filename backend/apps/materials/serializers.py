from rest_framework import serializers
from .models import MaterialRecord


class MaterialRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialRecord
        fields = (
            "id", "source", "source_id", "formula", "formula_pretty",
            "elements", "band_gap", "density",
            "formation_energy_per_atom", "bulk_modulus", "shear_modulus",
            "is_stable", "theoretical_capacity", "average_voltage",
            "energy_density", "notes", "cached_at", "created_at",
        )
