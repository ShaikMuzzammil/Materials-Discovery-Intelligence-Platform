from rest_framework import serializers
from .models import Material, GraphSnapshot


class MaterialSerializer(serializers.ModelSerializer):
    paper_count = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = (
            "id", "name", "formula", "aliases", "domain",
            "description", "properties", "paper_count", "created_at", "updated_at",
        )

    def get_paper_count(self, obj):
        return obj.mentioned_in.count()


class GraphSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraphSnapshot
        fields = ("id", "created_at", "node_count", "edge_count", "triggered_by")
