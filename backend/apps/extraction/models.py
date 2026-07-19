"""Extraction models – named entities, relations, extraction runs."""
from django.db import models
from django.conf import settings
from backend.apps.papers.models import Paper


class Entity(models.Model):
    """A materials-science named entity extracted from text.

    Categories: MATERIAL, PROPERTY, SYNTHESIS_METHOD, PROCESS_PARAMETER,
    TEMPERATURE, APPLICATION, EQUIPMENT, MEASUREMENT_TECHNIQUE.
    """

    ENTITY_TYPES = [
        ("MATERIAL", "Material"),
        ("PROPERTY", "Property"),
        ("SYNTHESIS_METHOD", "Synthesis method"),
        ("PROCESS_PARAMETER", "Process parameter"),
        ("TEMPERATURE", "Temperature"),
        ("APPLICATION", "Application"),
        ("EQUIPMENT", "Equipment"),
        ("MEASUREMENT", "Measurement technique"),
        ("CHEMICAL_FORMULA", "Chemical formula"),
        ("METRIC", "Metric / value"),
    ]

    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name="entities")
    text = models.CharField(max_length=400)
    entity_type = models.CharField(max_length=40, choices=ENTITY_TYPES)
    normalized = models.CharField(max_length=400, blank=True, help_text="Canonical form, e.g. LiFePO4")
    start_char = models.IntegerField(default=0)
    end_char = models.IntegerField(default=0)
    confidence = models.FloatField(default=0.0)
    extractor = models.CharField(max_length=80, default="regex", help_text="regex/spacy/matscibert/llm")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["paper", "entity_type"]),
            models.Index(fields=["entity_type", "normalized"]),
        ]

    def __str__(self):
        return f"[{self.entity_type}] {self.text}"


class Relation(models.Model):
    """A typed relation between two entities, e.g. (LiFePO4)-[HAS_PROPERTY]->(capacity 170 mAh/g)."""

    RELATION_TYPES = [
        ("HAS_PROPERTY", "has property"),
        ("SYNTHESIZED_BY", "synthesized by"),
        ("USED_IN", "used in"),
        ("MEASURED_BY", "measured by"),
        ("REACTS_WITH", "reacts with"),
        ("DOPED_WITH", "doped with"),
        ("SUBSTITUTE_FOR", "substitute for"),
        ("IMPROVES", "improves"),
        ("DEGRADES", "degrades"),
    ]

    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name="relations")
    subject = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="outgoing_relations")
    obj = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="incoming_relations")
    relation_type = models.CharField(max_length=40, choices=RELATION_TYPES)
    confidence = models.FloatField(default=0.0)
    evidence = models.TextField(blank=True, help_text="Sentence the relation was extracted from")
    extractor = models.CharField(max_length=80, default="regex")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("subject", "obj", "relation_type", "paper")

    def __str__(self):
        return f"{self.subject.text} -[{self.relation_type}]-> {self.obj.text}"


class ExtractionRun(models.Model):
    """One extraction pass over a paper."""

    paper = models.ForeignKey(Paper, on_delete=models.CASCADE, related_name="extraction_runs")
    extractor_name = models.CharField(max_length=80)
    entities_found = models.PositiveIntegerField(default=0)
    relations_found = models.PositiveIntegerField(default=0)
    duration_seconds = models.FloatField(default=0.0)
    success = models.BooleanField(default=False)
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.paper_id} via {self.extractor_name} ({'ok' if self.success else 'fail'})"
