"""High-level extraction service – parse paper, run NER + relation extraction, persist."""
from __future__ import annotations
import time
import logging
from django.db import transaction
from backend.apps.papers.models import Paper, PaperChunk
from backend.apps.extraction.models import Entity, Relation, ExtractionRun
from ml.nlp.pdf_parser import parse_pdf, chunk_text, split_into_sections
from ml.nlp.ner_extractor import get_default_extractor, EnsembleEntityExtractor
from ml.nlp.relation_extractor import get_default_relation_extractor

log = logging.getLogger(__name__)


def parse_paper_text(paper: Paper) -> str:
    """Get paper's full text: from cached full_text, raw_pdf, abstract, or PDF download."""
    if paper.full_text:
        return paper.full_text
    if paper.raw_pdf:
        try:
            return parse_pdf(paper.raw_pdf.path)
        except Exception as e:
            log.warning("Failed to parse raw_pdf for paper %s: %s", paper.id, e)
    if paper.abstract:
        # Fallback – use abstract as the text
        return paper.abstract
    if paper.pdf_url:
        try:
            import requests
            resp = requests.get(paper.pdf_url, timeout=60)
            if resp.status_code == 200 and resp.content[:4] == b"%PDF":
                text = parse_pdf(resp.content)
                paper.full_text = text
                paper.save(update_fields=["full_text"])
                return text
        except Exception as e:
            log.warning("Failed to download PDF from %s: %s", paper.pdf_url, e)
    return paper.abstract or ""


def chunk_and_persist(paper: Paper, text: str, chunk_size: int = 800, overlap: int = 120) -> list[PaperChunk]:
    """Split text into chunks and persist as PaperChunk rows."""
    # Clear any existing chunks for this paper (idempotent re-runs)
    PaperChunk.objects.filter(paper=paper).delete()

    sections = split_into_sections(text)
    if not sections:
        sections = [("body", text)]

    chunks: list[PaperChunk] = []
    idx = 0
    for section_name, section_text in sections:
        for c in chunk_text(section_text, chunk_size=chunk_size, overlap=overlap):
            chunk = PaperChunk.objects.create(
                paper=paper,
                chunk_index=idx,
                text=c,
                token_count=len(c) // 4,  # rough estimate
                section=section_name,
            )
            chunks.append(chunk)
            idx += 1
    paper.status = "parsed"
    paper.save(update_fields=["status"])
    log.info("Paper %s chunked into %d pieces", paper.id, len(chunks))
    return chunks


def extract_entities(paper: Paper, text: str = None, extractor=None) -> list[Entity]:
    """Run NER on a paper's text and persist Entity rows."""
    text = text or paper.full_text or parse_paper_text(paper)
    if not text:
        log.warning("Paper %s has no text to extract entities from", paper.id)
        return []

    extractor = extractor or get_default_extractor()
    extractor_name = getattr(extractor, "name", "ensemble")
    started = time.time()
    candidates = extractor.extract(text)

    entities: list[Entity] = []
    with transaction.atomic():
        # Clear prior entities from this extractor
        Entity.objects.filter(paper=paper, extractor=extractor_name).delete()
        for c in candidates:
            entities.append(Entity.objects.create(
                paper=paper,
                text=c.text[:400],
                entity_type=c.entity_type,
                normalized=c.text[:400].strip(),
                start_char=c.start,
                end_char=c.end,
                confidence=c.confidence,
                extractor=c.extractor,
            ))

    duration = time.time() - started
    ExtractionRun.objects.create(
        paper=paper,
        extractor_name=extractor_name,
        entities_found=len(entities),
        relations_found=0,
        duration_seconds=duration,
        success=True,
    )

    paper.status = "extracted"
    paper.save(update_fields=["status"])
    log.info("Extracted %d entities from paper %s in %.2fs", len(entities), paper.id, duration)
    return entities


def extract_relations(paper: Paper, entities: list[Entity] = None, text: str = None) -> list[Relation]:
    """Run relation extraction and persist Relation rows."""
    text = text or paper.full_text or parse_paper_text(paper)
    if not text:
        return []
    entities = entities or list(paper.entities.all())
    if not entities:
        return []

    extractor = get_default_relation_extractor()
    extractor_name = getattr(extractor, "name", "regex")
    from ml.nlp.ner_extractor import EntityCandidate
    ec = [EntityCandidate(
        text=e.text, entity_type=e.entity_type,
        start=e.start_char, end=e.end_char,
        confidence=e.confidence, extractor=e.extractor,
    ) for e in entities]
    candidates = extractor.extract(text, ec)

    relations: list[Relation] = []
    # build lookup by text
    by_text = {e.text.lower(): e for e in entities}

    with transaction.atomic():
        Relation.objects.filter(paper=paper, extractor=extractor_name).delete()
        seen_keys = set()  # dedupe (subject_text, obj_text, relation_type)
        for c in candidates:
            # Skip duplicate (subject, object, relation_type) combos
            key = (c.subject_text.lower(), c.object_text.lower(), c.relation_type)
            if key in seen_keys:
                continue
            seen_keys.add(key)

            subj = by_text.get(c.subject_text.lower())
            obj = by_text.get(c.object_text.lower())
            # If subject/object not in entity list, create them
            if not subj:
                subj = Entity.objects.create(
                    paper=paper, text=c.subject_text[:400],
                    entity_type=c.subject_type, normalized=c.subject_text[:400].strip(),
                    confidence=0.5, extractor="relation_inferred",
                )
                by_text[subj.text.lower()] = subj
            if not obj:
                obj = Entity.objects.create(
                    paper=paper, text=c.object_text[:400],
                    entity_type=c.object_type, normalized=c.object_text[:400].strip(),
                    confidence=0.5, extractor="relation_inferred",
                )
                by_text[obj.text.lower()] = obj
            try:
                relations.append(Relation.objects.create(
                    paper=paper, subject=subj, obj=obj,
                    relation_type=c.relation_type,
                    confidence=c.confidence,
                    evidence=c.evidence,
                    extractor=c.extractor,
                ))
            except Exception:
                # Skip if duplicate relation already exists (race / dedup miss)
                continue

    log.info("Extracted %d relations from paper %s", len(relations), paper.id)
    return relations


def run_full_extraction(paper_id: int) -> dict:
    """End-to-end extraction pipeline for a single paper."""
    paper = Paper.objects.get(pk=paper_id)
    started = time.time()
    try:
        text = parse_paper_text(paper)
        if not text:
            return {"paper_id": paper_id, "ok": False, "error": "No text available"}
        paper.full_text = text
        paper.save(update_fields=["full_text"])

        chunks = chunk_and_persist(paper, text)
        entities = extract_entities(paper, text)
        relations = extract_relations(paper, entities, text)
        return {
            "paper_id": paper_id,
            "ok": True,
            "chunks": len(chunks),
            "entities": len(entities),
            "relations": len(relations),
            "duration_seconds": round(time.time() - started, 2),
        }
    except Exception as e:
        log.exception("Full extraction failed for paper %s", paper_id)
        return {"paper_id": paper_id, "ok": False, "error": str(e)}
