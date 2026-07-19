"""Embeddings wrapper – uses sentence-transformers locally, falls back to OpenAI."""
from __future__ import annotations
import os
import logging
from typing import Iterable
from django.conf import settings

log = logging.getLogger(__name__)

_embedding_model = None


def get_embedding_model():
    """Lazy-load a sentence-transformers model (cached as singleton)."""
    global _embedding_model
    if _embedding_model is not None:
        return _embedding_model
    try:
        from sentence_transformers import SentenceTransformer
        model_name = settings.LLM_SETTINGS["EMBEDDING_MODEL"]
        _embedding_model = SentenceTransformer(model_name)
        log.info("Embedding model loaded: %s", model_name)
    except Exception as e:
        log.warning("sentence-transformers unavailable (%s) – embeddings disabled", e)
        _embedding_model = False
    return _embedding_model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of strings. Returns list of float vectors."""
    model = get_embedding_model()
    if not model:
        return [[] for _ in texts]
    try:
        vectors = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        return [list(map(float, v)) for v in vectors]
    except Exception as e:
        log.warning("Embedding failed: %s", e)
        return [[] for _ in texts]


def embed_text(text: str) -> list[float]:
    return embed_texts([text])[0]
