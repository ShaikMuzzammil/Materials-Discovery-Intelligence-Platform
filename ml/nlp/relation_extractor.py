"""Relation extraction – sentence-level patterns + LLM-assisted extraction.

Examples of relations we want:
  (LiFePO4) -[HAS_PROPERTY]-> (specific capacity 170 mAh/g)
  (LiFePO4) -[SYNTHESIZED_BY]-> (sol-gel)
  (LiFePO4) -[MEASURED_BY]-> (XRD)
  (NMC) -[DOPED_WITH]-> (Mg)
"""
from __future__ import annotations
import re
import logging
from typing import Iterable
from dataclasses import dataclass
from .ner_extractor import EntityCandidate

log = logging.getLogger(__name__)


@dataclass
class RelationCandidate:
    subject_text: str
    subject_type: str
    relation_type: str
    object_text: str
    object_type: str
    confidence: float
    evidence: str
    extractor: str = "regex"


# ------------------------------------------------------------------
# Regex relation patterns
# ------------------------------------------------------------------
RELATION_PATTERNS: list[tuple[str, str, str, str, str]] = [
    # (subject_type, regex, relation_type, object_type, extractor)
    ("CHEMICAL_FORMULA", r"(.+?)\s+(?:exhibit\w*|show\w*|achiev\w*|has|have|possess\w*)\s+(?:an?\s+)?(?:specific\s+)?(capacity|energy density|voltage|conductivity)\s+of\s+([\d.]+\s*(?:mAh/g|Wh/kg|V|S/cm|mS/cm|%))",
     "HAS_PROPERTY", "METRIC", "regex_capacity"),
    ("CHEMICAL_FORMULA", r"(.+?)\s+(?:was|were)\s+(?:synthesized|prepared|fabricated)\s+(?:by|via|using)\s+(sol[- ]gel|hydrothermal|co[- ]precipitation|solid[- ]state reaction|ball milling|spray drying|electrospinning|sputtering|CVD|PVD|ALD)",
     "SYNTHESIZED_BY", "SYNTHESIS_METHOD", "regex_synth"),
    ("CHEMICAL_FORMULA", r"(.+?)\s+(?:was|were)\s+(?:characterized|analyzed|investigated)\s+(?:by|using|via)\s+(XRD|XPS|SEM|TEM|EDS|EDX|BET|FTIR|Raman|EIS|CV)",
     "MEASURED_BY", "MEASUREMENT", "regex_meas"),
    ("CHEMICAL_FORMULA", r"(.+?)\s+(?:doped|substituted)\s+(?:with)\s+([A-Z][a-z]?)",
     "DOPED_WITH", "CHEMICAL_FORMULA", "regex_doped"),
    ("CHEMICAL_FORMULA", r"(.+?)\s+(?:for|in)\s+(lithium[- ]ion batteries|sodium[- ]ion batteries|supercapacitors|fuel cells|solar cells)",
     "USED_IN", "APPLICATION", "regex_used_in"),
]


class RegexRelationExtractor:
    """Sentence-level relation extractor using curated patterns."""

    name = "regex"

    def extract(self, text: str, entities: list[EntityCandidate]) -> list[RelationCandidate]:
        relations: list[RelationCandidate] = []
        # split into sentences (very simple split)
        sentences = re.split(r"(?<=[.!?])\s+", text)
        for sent in sentences:
            for subj_type, pat, rel_type, obj_type, extractor_name in RELATION_PATTERNS:
                for m in re.finditer(pat, sent, flags=re.IGNORECASE):
                    # groups: (1)=subject, (2)=property_or_method, (3)=value_or_object
                    groups = m.groups()
                    if len(groups) >= 3:
                        relations.append(RelationCandidate(
                            subject_text=groups[0].strip(),
                            subject_type=subj_type,
                            relation_type=rel_type,
                            object_text=groups[-1].strip(),
                            object_type=obj_type,
                            confidence=0.6,
                            evidence=sent.strip()[:500],
                            extractor=extractor_name,
                        ))
        # also: co-occurrence based – if two entities appear in same sentence, link them
        relations.extend(self._cooccurrence_relations(sentences, entities))
        return relations

    def _cooccurrence_relations(self, sentences: list[str], entities: list[EntityCandidate]) -> list[RelationCandidate]:
        """Link material <-> property / measurement / synthesis if they share a sentence."""
        out: list[RelationCandidate] = []
        for sent in sentences:
            sent_entities = [
                e for e in entities
                if e.start < len(sent)  # rough – entities are offsets in full text
            ]
            materials = [e for e in sent_entities if e.entity_type in ("MATERIAL", "CHEMICAL_FORMULA")]
            props = [e for e in sent_entities if e.entity_type in ("PROPERTY", "METRIC")]
            methods = [e for e in sent_entities if e.entity_type == "SYNTHESIS_METHOD"]
            measures = [e for e in sent_entities if e.entity_type == "MEASUREMENT"]

            for m in materials:
                for p in props:
                    out.append(RelationCandidate(
                        subject_text=m.text, subject_type=m.entity_type,
                        relation_type="HAS_PROPERTY",
                        object_text=p.text, object_type=p.entity_type,
                        confidence=0.4, evidence=sent.strip()[:500],
                        extractor="cooccur_material_property",
                    ))
                for s in methods:
                    out.append(RelationCandidate(
                        subject_text=m.text, subject_type=m.entity_type,
                        relation_type="SYNTHESIZED_BY",
                        object_text=s.text, object_type=s.entity_type,
                        confidence=0.4, evidence=sent.strip()[:500],
                        extractor="cooccur_material_synth",
                    ))
                for me in measures:
                    out.append(RelationCandidate(
                        subject_text=m.text, subject_type=m.entity_type,
                        relation_type="MEASURED_BY",
                        object_text=me.text, object_type=me.entity_type,
                        confidence=0.4, evidence=sent.strip()[:500],
                        extractor="cooccur_material_meas",
                    ))
        return out


class LLMRelationExtractor:
    """LLM-assisted relation extractor (zero-shot).

    Uses an LLM to extract structured relations from a sentence.
    Requires an LLM client – see ml.llm.chat.
    """

    name = "llm"

    PROMPT_TEMPLATE = """You are a materials-science information extractor.

Given the following sentence from a research paper, extract all (subject, relation, object) triples.

Allowed relation types:
- HAS_PROPERTY
- SYNTHESIZED_BY
- MEASURED_BY
- USED_IN
- DOPED_WITH
- REACTS_WITH
- IMPROVES
- DEGRADES

Sentence:
\"\"\"{sentence}\"\"\"

Return ONLY a JSON list of triples, each: {{"subject": "...", "relation": "...", "object": "...", "subject_type": "...", "object_type": "..."}}
If no relations, return [].
"""

    def __init__(self, llm_client=None):
        self.llm = llm_client

    def extract(self, text: str, entities: list[EntityCandidate] = None) -> list[RelationCandidate]:
        if self.llm is None:
            return []
        import json
        relations: list[RelationCandidate] = []
        sentences = re.split(r"(?<=[.!?])\s+", text)
        for sent in sentences[:20]:  # cap to keep API costs down
            try:
                prompt = self.PROMPT_TEMPLATE.format(sentence=sent[:1000])
                response = self.llm.complete(prompt)
                # parse JSON
                start = response.find("[")
                end = response.rfind("]")
                if start == -1 or end == -1:
                    continue
                triples = json.loads(response[start:end + 1])
                for t in triples:
                    relations.append(RelationCandidate(
                        subject_text=t.get("subject", ""),
                        subject_type=t.get("subject_type", "MATERIAL"),
                        relation_type=t.get("relation", "HAS_PROPERTY"),
                        object_text=t.get("object", ""),
                        object_type=t.get("object_type", "PROPERTY"),
                        confidence=0.85,
                        evidence=sent[:500],
                        extractor="llm",
                    ))
            except Exception as e:
                log.warning("LLM relation extraction failed for sentence: %s", e)
        return relations


def get_default_relation_extractor():
    return RegexRelationExtractor()
