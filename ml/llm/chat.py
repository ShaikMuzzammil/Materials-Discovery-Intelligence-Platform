"""LLM client wrapper – OpenAI / Groq / HuggingFace with graceful fallback."""
from __future__ import annotations
import os
import logging
from typing import Optional
from django.conf import settings

log = logging.getLogger(__name__)


class LLMClient:
    """Minimal LLM completion interface. Picks first available provider."""

    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or self._auto_pick_provider()
        self._client = None

    def _auto_pick_provider(self) -> str:
        if settings.LLM_SETTINGS.get("OPENAI_API_KEY"):
            return "openai"
        if settings.LLM_SETTINGS.get("GROQ_API_KEY"):
            return "groq"
        if settings.LLM_SETTINGS.get("HUGGINGFACE_API_KEY"):
            return "huggingface"
        return "none"

    def _ensure_client(self):
        if self._client is not None:
            return
        if self.provider == "openai":
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=settings.LLM_SETTINGS["OPENAI_API_KEY"])
            except Exception as e:
                log.warning("OpenAI client init failed: %s", e)
                self.provider = "none"
        elif self.provider == "groq":
            try:
                from openai import OpenAI  # Groq uses OpenAI-compatible SDK
                self._client = OpenAI(
                    api_key=settings.LLM_SETTINGS["GROQ_API_KEY"],
                    base_url="https://api.groq.com/openai/v1",
                )
            except Exception as e:
                log.warning("Groq client init failed: %s", e)
                self.provider = "none"
        elif self.provider == "huggingface":
            # HuggingFace uses HTTP directly (no SDK needed)
            self._client = "hf"

    def complete(self, prompt: str, temperature: float = 0.2, max_tokens: int = 800) -> str:
        """Generate a completion for the given prompt."""
        self._ensure_client()
        if self.provider == "openai":
            try:
                resp = self._client.chat.completions.create(
                    model=settings.LLM_SETTINGS["OPENAI_MODEL"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return resp.choices[0].message.content or ""
            except Exception as e:
                log.warning("OpenAI completion failed: %s", e)
                return ""
        elif self.provider == "groq":
            try:
                resp = self._client.chat.completions.create(
                    model=settings.LLM_SETTINGS["GROQ_MODEL"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return resp.choices[0].message.content or ""
            except Exception as e:
                log.warning("Groq completion failed: %s", e)
                return ""
        elif self.provider == "huggingface":
            return self._hf_complete(prompt, temperature, max_tokens)
        else:
            # No LLM available – return a deterministic stub
            return self._stub_response(prompt)

    def _hf_complete(self, prompt: str, temperature: float, max_tokens: int) -> str:
        try:
            import requests
            url = f"https://api-inference.huggingface.co/models/{settings.LLM_SETTINGS['HUGGINGFACE_MODEL']}"
            headers = {"Authorization": f"Bearer {settings.LLM_SETTINGS['HUGGINGFACE_API_KEY']}"}
            payload = {
                "inputs": prompt,
                "parameters": {"temperature": temperature, "max_new_tokens": max_tokens},
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            if resp.status_code != 200:
                return ""
            data = resp.json()
            if isinstance(data, list) and data:
                return data[0].get("generated_text", "")
            return ""
        except Exception as e:
            log.warning("HuggingFace completion failed: %s", e)
            return ""

    def _stub_response(self, prompt: str) -> str:
        """Used when no LLM is configured – returns a small placeholder so the UI still works."""
        return (
            "[LLM not configured] Set OPENAI_API_KEY / GROQ_API_KEY / HUGGINGFACE_API_KEY "
            "in your .env to enable LLM features. Your prompt was: "
            f"{prompt[:200]}..."
        )


# Singleton
_default_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client
