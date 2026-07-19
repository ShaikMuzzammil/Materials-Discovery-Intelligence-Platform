"""Paper ingestion services – arXiv, Semantic Scholar, OpenAlex, CrossRef."""
from __future__ import annotations
import re
import time
import logging
import xml.etree.ElementTree as ET
from typing import Iterable
import requests
from django.utils.dateparse import parse_date
from django.conf import settings

from .models import Paper, IngestionJob

log = logging.getLogger(__name__)
ATOM_NS = "{http://www.w3.org/2005/Atom}"


# ------------------------------------------------------------------
# arXiv
# ------------------------------------------------------------------
def search_arxiv(query: str, max_results: int = 20, domains: list[str] | None = None) -> list[Paper]:
    """Search arXiv and create Paper rows. Idempotent on source_id."""
    url = settings.EXTERNAL_APIS["ARXIV_API_URL"]
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max_results,
        "sortBy": "relevance",
        "sortOrder": "descending",
    }
    log.info("arXiv search: %s (max=%d)", query, max_results)
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()

    root = ET.fromstring(resp.content)
    papers: list[Paper] = []
    for entry in root.findall(f"{ATOM_NS}entry"):
        arxiv_id_el = entry.find(f"{ATOM_NS}id")
        if arxiv_id_el is None:
            continue
        raw_id = arxiv_id_el.text.strip()
        # extract short id e.g. 2401.12345
        m = re.search(r"arxiv\.org/abs/([^v]+)", raw_id)
        source_id = m.group(1) if m else raw_id.split("/")[-1]

        title_el = entry.find(f"{ATOM_NS}title")
        summary_el = entry.find(f"{ATOM_NS}summary")
        published_el = entry.find(f"{ATOM_NS}published")
        authors = [a.find(f"{ATOM_NS}name").text for a in entry.findall(f"{ATOM_NS}author") if a.find(f"{ATOM_NS}name") is not None]

        # find PDF link
        pdf_url = ""
        for link in entry.findall(f"{ATOM_NS}link"):
            if link.attrib.get("title") == "pdf" or link.attrib.get("type") == "application/pdf":
                pdf_url = link.attrib.get("href", "")
                break

        paper, created = Paper.objects.update_or_create(
            source="arxiv", source_id=source_id,
            defaults={
                "title": (title_el.text.strip() if title_el is not None else "")[:600],
                "abstract": summary_el.text.strip() if summary_el is not None else "",
                "authors": "\n".join(authors),
                "published_at": parse_date(published_el.text[:10]) if published_el is not None else None,
                "pdf_url": pdf_url,
                "keywords": [kw.strip() for kw in query.split()][:10],
                "domains": domains or [],
                "status": "fetched",
            },
        )
        if created:
            papers.append(paper)
    log.info("arXiv returned %d new papers", len(papers))
    return papers


# ------------------------------------------------------------------
# CrossRef (DOI → metadata)
# ------------------------------------------------------------------
def fetch_crossref(doi: str) -> Paper | None:
    url = f"{settings.EXTERNAL_APIS['CROSSREF_API_URL']}/{doi}"
    headers = {"User-Agent": f"MatDiscoverAI/1.0 (mailto:{settings.EXTERNAL_APIS['OPENALEX_EMAIL']})"}
    resp = requests.get(url, headers=headers, timeout=30)
    if resp.status_code != 200:
        return None
    msg = resp.json().get("message", {})
    title = (msg.get("title") or [""])[0]
    authors = []
    for a in msg.get("author", []):
        authors.append(f"{a.get('given', '')} {a.get('family', '')}".strip())
    abstract = msg.get("abstract", "") or ""
    published = msg.get("published-print") or msg.get("published-online") or {}
    parts = published.get("date-parts", [[None]])[0]
    published_at = None
    if parts and parts[0]:
        try:
            published_at = parse_date(f"{parts[0]:04d}-{parts[1] if len(parts) > 1 else 1:02d}-{parts[2] if len(parts) > 2 else 1:02d}")
        except Exception:
            pass

    paper, _ = Paper.objects.update_or_create(
        source="crossref", source_id=doi,
        defaults={
            "doi": doi,
            "title": title[:600],
            "abstract": abstract,
            "authors": "\n".join(authors),
            "journal": (msg.get("container-title") or [""])[0],
            "published_at": published_at,
            "pdf_url": (msg.get("link") or [{}])[0].get("URL", ""),
            "status": "fetched",
        },
    )
    return paper


# ------------------------------------------------------------------
# OpenAlex
# ------------------------------------------------------------------
def search_openalex(query: str, max_results: int = 20) -> list[Paper]:
    url = "https://api.openalex.org/works"
    headers = {"User-Agent": f"MatDiscoverAI/1.0 (mailto:{settings.EXTERNAL_APIS['OPENALEX_EMAIL']})"}
    params = {"search": query, "per-page": max_results}
    resp = requests.get(url, params=params, headers=headers, timeout=60)
    resp.raise_for_status()
    results = resp.json().get("results", [])

    papers: list[Paper] = []
    for w in results:
        oa_id = (w.get("id") or "").split("/")[-1]
        title = w.get("display_name") or ""
        authors = [a.get("author", {}).get("display_name", "") for a in w.get("authorships", [])]
        abstract_inv = w.get("abstract_inverted_index") or {}
        if abstract_inv:
            # rebuild abstract from inverted index
            positions = []
            for word, idxs in abstract_inv.items():
                for i in idxs:
                    positions.append((i, word))
            abstract = " ".join(w for _, w in sorted(positions))
        else:
            abstract = ""
        pub_date = w.get("publication_date")
        doi = (w.get("doi") or "").replace("https://doi.org/", "")
        paper, created = Paper.objects.update_or_create(
            source="openalex", source_id=oa_id,
            defaults={
                "doi": doi,
                "title": title[:600],
                "abstract": abstract,
                "authors": "\n".join(authors),
                "published_at": parse_date(pub_date) if pub_date else None,
                "journal": (w.get("primary_location", {}) or {}).get("source", {}).get("display_name", "") if w.get("primary_location") else "",
                "status": "fetched",
            },
        )
        if created:
            papers.append(paper)
    return papers


# ------------------------------------------------------------------
# Orchestration
# ------------------------------------------------------------------
def run_ingestion_job(job_id: int) -> int:
    """Execute an IngestionJob – runs synchronously or via Celery."""
    job = IngestionJob.objects.get(pk=job_id)
    job.status = "running"
    job.save(update_fields=["status"])

    added = 0
    try:
        if job.query_type == "arxiv_search":
            added = len(search_arxiv(job.query_text, max_results=job.max_results))
        elif job.query_type == "openalex":
            added = len(search_openalex(job.query_text, max_results=job.max_results))
        elif job.query_type == "doi_batch":
            for doi in job.query_text.split(","):
                doi = doi.strip()
                if doi and fetch_crossref(doi):
                    added += 1
        job.papers_added = added
        job.status = "completed"
    except Exception as e:
        job.status = "failed"
        job.error_log = str(e)
        log.exception("Ingestion job %s failed", job_id)
    finally:
        from django.utils import timezone
        job.finished_at = timezone.now()
        job.save()
    return added
