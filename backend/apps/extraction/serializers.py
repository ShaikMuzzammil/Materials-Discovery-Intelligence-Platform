from rest_framework import serializers
from .models import Entity, Relation, ExtractionRun


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = (
            "id", "paper", "text", "entity_type", "normalized",
            "start_char", "end_char", "confidence", "extractor", "created_at",
        )


class RelationSerializer(serializers.ModelSerializer):
    subject_text = serializers.CharField(source="subject.text", read_only=True)
    subject_type = serializers.CharField(source="subject.entity_type", read_only=True)
    object_text = serializers.CharField(source="obj.text", read_only=True)
    object_type = serializers.CharField(source="obj.entity_type", read_only=True)

    class Meta:
        model = Relation
        fields = (
            "id", "paper", "subject", "subject_text", "subject_type",
            "obj", "object_text", "object_type", "relation_type",
            "confidence", "evidence", "extractor", "created_at",
        )


class ExtractionRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractionRun
        fields = "__all__"
