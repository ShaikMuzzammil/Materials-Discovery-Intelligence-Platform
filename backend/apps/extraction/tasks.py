"""Celery tasks for async extraction + indexing."""
from __future__ import annotations
import logging
from celery import shared_task

log = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def extract_paper_entities(self, paper_id: int):
    """Extract entities + relations for a single paper (async)."""
    from .services import run_full_extraction
    try:
        result = run_full_extraction(paper_id)
        log.info("Extraction complete: %s", result)
        return result
    except Exception as exc:
        log.exception("Async extraction failed for paper %s", paper_id)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def index_paper_in_vector_db(self, paper_id: int):
    """Embed a paper's chunks and add to ChromaDB vector store."""
    from ml.llm.rag_pipeline import index_paper
    try:
        count = index_paper(paper_id)
        return {"paper_id": paper_id, "indexed_chunks": count}
    except Exception as exc:
        log.exception("Async vector indexing failed for paper %s", paper_id)
        raise self.retry(exc=exc)


@shared_task
def batch_extract(paper_ids: list[int]):
    """Run extraction across many papers sequentially."""
    results = []
    for pid in paper_ids:
        try:
            r = run_full_extraction(pid)
            results.append(r)
        except Exception as e:
            results.append({"paper_id": pid, "ok": False, "error": str(e)})
    return results


@shared_task
def build_knowledge_graph():
    """Aggregate all entities + relations across all papers into the KG."""
    from backend.apps.knowledge_graph.services import build_graph_from_papers
    return build_graph_from_papers()
