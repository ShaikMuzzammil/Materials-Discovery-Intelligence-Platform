"""RAG pipeline – ChromaDB vector store + retrieval + answer synthesis."""
from __future__ import annotations
import logging
import os
from typing import Optional
from django.conf import settings
from .embeddings import embed_text, embed_texts
from .chat import get_llm_client

log = logging.getLogger(__name__)

_chroma_collection = None


def _get_collection():
    """Lazy-init ChromaDB persistent collection."""
    global _chroma_collection
    if _chroma_collection is not None:
        return _chroma_collection
    try:
        import chromadb
        persist_dir = str(settings.BASE_DIR / "chroma_db")
        os.makedirs(persist_dir, exist_ok=True)
        client = chromadb.PersistentClient(path=persist_dir)
        _chroma_collection = client.get_or_create_collection(
            name=settings.LLM_SETTINGS["CHROMA_COLLECTION_NAME"],
            metadata={"hnsw:space": "cosine"},
        )
        log.info("ChromaDB collection ready at %s", persist_dir)
    except Exception as e:
        log.warning("ChromaDB unavailable (%s) – RAG will return []", e)
        _chroma_collection = False
    return _chroma_collection


def index_paper(paper_id: int) -> int:
    """Embed all chunks of a paper and add to ChromaDB."""
    from backend.apps.papers.models import Paper
    collection = _get_collection()
    if not collection:
        return 0
    paper = Paper.objects.get(pk=paper_id)
    chunks = list(paper.chunks.all())
    if not chunks:
        # chunk on the fly
        from backend.apps.extraction.services import parse_paper_text, chunk_and_persist
        text = parse_paper_text(paper)
        if not text:
            return 0
        chunks = chunk_and_persist(paper, text)

    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts)
    ids = [f"paper{paper_id}-chunk{c.chunk_index}" for c in chunks]
    metadatas = [
        {
            "paper_id": paper_id,
            "chunk_index": c.chunk_index,
            "section": c.section or "",
            "title": paper.title[:200],
        }
        for c in chunks
    ]

    # filter out empty embeddings
    valid = [(t, e, i, m) for t, e, i, m in zip(texts, embeddings, ids, metadatas) if e]
    if not valid:
        log.warning("No valid embeddings for paper %s", paper_id)
        return 0
    texts, embeddings, ids, metadatas = zip(*valid)

    collection.upsert(
        ids=list(ids),
        embeddings=list(embeddings),
        documents=list(texts),
        metadatas=list(metadatas),
    )

    paper.status = "indexed"
    paper.save(update_fields=["status"])
    log.info("Indexed %d chunks from paper %s", len(ids), paper_id)
    return len(ids)


def retrieve(query: str, top_k: int = 5, paper_id: Optional[int] = None) -> list[dict]:
    """Retrieve top_k most relevant chunks for a query."""
    collection = _get_collection()
    if not collection:
        return []
    q_emb = embed_text(query)
    if not q_emb:
        return []
    where = {"paper_id": paper_id} if paper_id else None
    results = collection.query(
        query_embeddings=[q_emb],
        n_results=top_k,
        where=where,
    )
    out = []
    for i, doc in enumerate(results.get("documents", [[]])[0]):
        out.append({
            "text": doc,
            "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
            "distance": results["distances"][0][i] if results.get("distances") else 0.0,
        })
    return out


def answer_question(question: str, top_k: int = 5) -> dict:
    """End-to-end RAG: retrieve + synthesise answer."""
    contexts = retrieve(question, top_k=top_k)
    context_text = "\n\n".join([f"[{i+1}] {c['text']}" for i, c in enumerate(contexts)])

    prompt = f"""You are MatDiscoverAI, an AI research assistant specialised in materials science.

Use ONLY the following retrieved context to answer the question.
Cite sources by their [number]. If the context is insufficient, say so explicitly.

CONTEXT:
{context_text}

QUESTION:
{question}

ANSWER:"""

    llm = get_llm_client()
    answer = llm.complete(prompt, temperature=0.2, max_tokens=800)
    return {
        "question": question,
        "answer": answer,
        "sources": [
            {
                "paper_id": c["metadata"].get("paper_id"),
                "chunk_index": c["metadata"].get("chunk_index"),
                "section": c["metadata"].get("section"),
                "title": c["metadata"].get("title"),
                "snippet": c["text"][:300],
            }
            for c in contexts
        ],
    }


def hybrid_search(query: str, top_k: int = 10) -> list[dict]:
    """Combine RAG vector search with keyword search (Django ORM LIKE)."""
    from backend.apps.papers.models import Paper, PaperChunk
    # vector results
    vector_results = retrieve(query, top_k=top_k)

    # keyword fallback
    keywords = query.split()
    qs = PaperChunk.objects.none()
    for kw in keywords:
        if len(kw) >= 3:
            qs = qs | PaperChunk.objects.filter(text__icontains=kw)
    keyword_chunks = qs.distinct()[:top_k]

    # merge + de-dup by chunk text
    seen = set()
    merged = []
    for r in vector_results:
        key = r["text"][:100]
        if key not in seen:
            seen.add(key)
            merged.append({"source": "vector", **r})
    for c in keyword_chunks:
        key = c.text[:100]
        if key not in seen:
            seen.add(key)
            merged.append({
                "source": "keyword",
                "text": c.text,
                "metadata": {
                    "paper_id": c.paper_id,
                    "chunk_index": c.chunk_index,
                    "section": c.section,
                    "title": c.paper.title[:200],
                },
            })
    return merged[:top_k]
