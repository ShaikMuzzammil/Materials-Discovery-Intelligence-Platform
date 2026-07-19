import uuid
from django.shortcuts import render, get_object_or_404
from django.urls import path
from rest_framework.decorators import api_view, permission_classes as drf_perm
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import ChatSession, ChatMessage
from .serializers import AskSerializer, ChatSessionSerializer


@api_view(["POST"])
@drf_perm([AllowAny])
def ask_view(request):
    """Ask a question to the LLM (optionally RAG-augmented)."""
    ser = AskSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    d = ser.validated_data

    session_key = d.get("session_key") or str(uuid.uuid4())
    session, _ = ChatSession.objects.get_or_create(
        session_key=session_key,
        defaults={"title": d["question"][:80]},
    )
    if request.user.is_authenticated and session.user is None:
        session.user = request.user
        session.save(update_fields=["user"])

    # Persist user message
    ChatMessage.objects.create(session=session, role="user", content=d["question"])

    if d["use_rag"]:
        from ml.llm.rag_pipeline import answer_question
        result = answer_question(d["question"], top_k=d["top_k"])
        answer = result["answer"]
        sources = result["sources"]
    else:
        from ml.llm.chat import get_llm_client
        answer = get_llm_client().complete(d["question"])
        sources = []

    ChatMessage.objects.create(
        session=session, role="assistant", content=answer,
        sources=sources, tokens_used=len(answer) // 4,
    )

    return Response({
        "session_key": session_key,
        "answer": answer,
        "sources": sources,
    })


@api_view(["GET"])
def history_view(request, session_key: str):
    session = get_object_or_404(ChatSession, session_key=session_key)
    return Response(ChatSessionSerializer(session).data)


# ---------------- Templates ----------------
def chat_view(request):
    """Render the chat UI."""
    session_key = request.session.session_key or str(uuid.uuid4())
    request.session.save()
    return render(request, "chat/chat.html", {
        "session_key": session_key,
        "section": "chat",
    })


urlpatterns = [
    # API
    path("api/ask/", ask_view, name="api-ask"),
    path("api/history/<str:session_key>/", history_view, name="api-history"),
    # Templates
    path("", chat_view, name="chat"),
]
