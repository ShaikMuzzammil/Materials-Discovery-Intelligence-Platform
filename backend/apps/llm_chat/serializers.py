from rest_framework import serializers
from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ("id", "role", "content", "sources", "tokens_used", "created_at")
        read_only_fields = ("id", "sources", "tokens_used", "created_at")


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ("id", "title", "session_key", "created_at", "updated_at", "messages")
        read_only_fields = ("id", "created_at", "updated_at")


class AskSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000)
    session_key = serializers.CharField(max_length=64, required=False)
    use_rag = serializers.BooleanField(default=True)
    top_k = serializers.IntegerField(default=5, min_value=1, max_value=20)
