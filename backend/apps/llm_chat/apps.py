from django.apps import AppConfig


class LlmChatConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.apps.llm_chat"
    label = "llm_chat"
