"""PDF → plain text parser using pdfplumber (with pypdf fallback).

Also performs light cleaning + section detection (intro/methods/results).
"""
from __future__ import annotations
import re
import logging
from pathlib import Path
from typing import Tuple
import io

log = logging.getLogger(__name__)

SECTION_PATTERNS = {
    "abstract": r"^\s*(abstract|summary)\s*[:.]?\s*$",
    "introduction": r"^\s*(1\.?\s*)?introduction\s*$",
    "methods": r"^\s*((\d+\.?\s*)?(methods?|experimental|materials and methods?|methodology))\s*$",
    "results": r"^\s*((\d+\.?\s*)?(results?|results and discussion))\s*$",
    "discussion": r"^\s*((\d+\.?\s*)?discussion)\s*$",
    "conclusion": r"^\s*((\d+\.?\s*)?conclusions?)\s*$",
    "references": r"^\s*references\s*$",
}


def parse_pdf(file_path_or_bytes) -> str:
    """Parse a PDF into plain text. Accepts a path string, Path, or bytes."""
    if isinstance(file_path_or_bytes, (bytes, bytearray)):
        return _parse_pdf_bytes(file_path_or_bytes)
    return _parse_pdf_file(Path(file_path_or_bytes))


def _parse_pdf_file(path: Path) -> str:
    text_parts: list[str] = []
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                text_parts.append(t)
    except Exception as e:
        log.warning("pdfplumber failed on %s: %s; falling back to pypdf", path, e)
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(path))
            for page in reader.pages:
                text_parts.append(page.extract_text() or "")
        except Exception as e2:
            log.error("Both PDF parsers failed on %s: %s", path, e2)
            return ""
    return _clean_text("\n".join(text_parts))


def _parse_pdf_bytes(data: bytes) -> str:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            return _clean_text("\n".join((p.extract_text() or "") for p in pdf.pages))
    except Exception:
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(data))
            return _clean_text("\n".join((p.extract_text() or "") for p in reader.pages))
        except Exception as e:
            log.error("Both PDF parsers failed: %s", e)
            return ""


def _clean_text(text: str) -> str:
    """Light normalisation: collapse whitespace, fix hyphenation, drop headers."""
    # de-hyphenate line breaks:  "ther-\nmal"  ->  "thermal"
    text = re.sub(r"-\s*\n\s*", "", text)
    # collapse multiple spaces but preserve newlines
    text = re.sub(r"[ \t]+", " ", text)
    # drop page numbers (e.g. "12", "Page 12 of 24")
    text = re.sub(r"^\s*page\s+\d+\s*(of\s+\d+)?\s*$", "", text, flags=re.IGNORECASE | re.MULTILINE)
    # drop DOI lines
    text = re.sub(r"^\s*doi:.*$", "", text, flags=re.IGNORECASE | re.MULTILINE)
    return text.strip()


def detect_section(line: str) -> str | None:
    for name, pat in SECTION_PATTERNS.items():
        if re.match(pat, line, flags=re.IGNORECASE):
            return name
    return None


def split_into_sections(text: str) -> list[Tuple[str, str]]:
    """Return list of (section_name, text). Section name = 'intro' / 'methods' / 'body' / ..."""
    sections: list[Tuple[str, str]] = []
    current = "body"
    buffer: list[str] = []
    for line in text.splitlines():
        sec = detect_section(line)
        if sec:
            if buffer:
                sections.append((current, "\n".join(buffer).strip()))
                buffer = []
            current = sec
        else:
            buffer.append(line)
    if buffer:
        sections.append((current, "\n".join(buffer).strip()))
    return sections


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    """Sliding-window chunker – character-based (approximate token count)."""
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        # extend to next sentence boundary if possible
        if end < len(text):
            last_period = text.rfind(". ", start, end)
            if last_period > start + chunk_size // 2:
                end = last_period + 1
        chunks.append(text[start:end].strip())
        start = end - overlap
        if start >= len(text):
            break
    return [c for c in chunks if c]
