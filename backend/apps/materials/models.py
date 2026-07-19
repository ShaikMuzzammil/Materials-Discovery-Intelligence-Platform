"""Cached material records – mirror Materials Project data + user annotations."""
from django.db import models
from django.conf import settings


class MaterialRecord(models.Model):
    """A cached material record (sourced from Materials Project or manually entered)."""

    SOURCE_CHOICES = [
        ("materials_project", "Materials Project"),
        ("manual", "Manual"),
        ("extracted", "Extracted from paper"),
    ]

    source = models.CharField(max_length=40, choices=SOURCE_CHOICES, default="manual")
    source_id = models.CharField(max_length=100, blank=True, help_text="MP ID e.g. mp-1101")
    formula = models.CharField(max_length=200, db_index=True)
    formula_pretty = models.CharField(max_length=200, blank=True)
    elements = models.JSONField(default=list, blank=True)
    structure = models.JSONField(default=dict, blank=True, help_text="Crystal structure dict")
    band_gap = models.FloatField(null=True, blank=True)
    density = models.FloatField(null=True, blank=True, help_text="g/cm^3")
    formation_energy_per_atom = models.FloatField(null=True, blank=True, help_text="eV/atom")
    bulk_modulus = models.FloatField(null=True, blank=True, help_text="GPa")
    shear_modulus = models.FloatField(null=True, blank=True, help_text="GPa")
    is_stable = models.BooleanField(default=False)
    # battery-specific
    theoretical_capacity = models.FloatField(null=True, blank=True, help_text="mAh/g")
    average_voltage = models.FloatField(null=True, blank=True, help_text="V")
    energy_density = models.FloatField(null=True, blank=True, help_text="Wh/kg")
    notes = models.TextField(blank=True)
    cached_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="material_records"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["formula"]
        unique_together = ("source", "source_id")
        indexes = [
            models.Index(fields=["formula"]),
            models.Index(fields=["source", "source_id"]),
        ]

    def __str__(self):
        return f"{self.formula_pretty or self.formula} ({self.source}:{self.source_id or 'manual'})"
