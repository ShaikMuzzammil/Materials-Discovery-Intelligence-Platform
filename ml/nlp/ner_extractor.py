"""Materials-science Named Entity Recognition (NER).

Three extractors are supported, in order of increasing sophistication:

1. `RegexEntityExtractor`   – pure-Python regex patterns; zero-dependency fallback
2. `SpacyEntityExtractor`   – spaCy with a materials-science pipeline (if installed)
3. `TransformerEntityExtractor` – HuggingFace transformers (MatSciBERT / SciBERT)

Each extractor yields Entity candidates as dicts:
    {"text", "entity_type", "start", "end", "confidence", "extractor"}
"""
from __future__ import annotations
import re
import logging
from typing import Iterable
from dataclasses import dataclass, asdict

log = logging.getLogger(__name__)


@dataclass
class EntityCandidate:
    text: str
    entity_type: str
    start: int
    end: int
    confidence: float
    extractor: str

    def to_dict(self):
        return asdict(self)


# ------------------------------------------------------------------
# 1. Regex extractor
# ------------------------------------------------------------------
REGEX_PATTERNS: dict[str, list[str]] = {
    "CHEMICAL_FORMULA": [
        # explicit common formulas (highest priority, case-sensitive)
        r"\bLiFePO4\b", r"\bLiCoO2\b", r"\bLiMn2O4\b", r"\bLiNiMnCoO2\b",
        r"\bLiNi0\.8Co0\.1Mn0\.1O2\b", r"\bLiNi0\.6Co0\.2Mn0\.2O2\b",
        r"\bLiNi0\.5Co0\.2Mn0\.3O2\b", r"\bLi1\.2Mn0\.6Ni0\.2O2\b",
        r"\bLi4Ti5O12\b", r"\bLi7La3Zr2O12\b", r"\bLi6\.4La3Zr1\.4Ta0\.6O12\b",
        r"\bLi2S-P2S5\b", r"\bLi3InCl6\b", r"\bLi3V2\(PO4\)3\b",
        r"\bLiV3O8\b", r"\bLiTi2\(PO4\)3\b", r"\bNa3V2\(PO4\)2F3\b",
        r"\bNa3V2\(PO4\)3\b", r"\bNa0\.7Fe0\.4Mn0\.6O2\b",
        r"\bMoS2\b", r"\bWS2\b", r"\bTiO2\b", r"\bSiO2\b", r"\bSnO2\b", r"\bV2O5\b",
        r"\bAl2O3\b", r"\bCo-N-C\b", r"\bNMC811\b", r"\bNMC\b", r"\bLLZO\b",
        r"\bTa-LLZO\b", r"\bNCM811\b", r"\bNCM\b", r"\bLFP\b", r"\bLTO\b", r"\bNVPF\b",
        r"\bMXene\b", r"\brGO\b",
        # generic formula pattern: must contain at least one digit AND have 2+ element symbols.
        # Examples: LiFePO4, Na3V2(PO4)2F3, Li1.2Mn0.6Ni0.2O2
        # Negative examples (won't match): "Abstract", "Methods", "XRD", "SEM"
        r"\b(?=[A-Za-z0-9()\.]*\d)[A-Z][a-z]?\d*\.?\d*(?:[A-Z][a-z]?\d*\.?\d*)+(?:\([A-Z][a-z]?\d+\)\d*)?[A-Z]?[a-z]?\d*\.?\d*\b",
    ],
}

# Patterns that ARE case-insensitive (synthesis methods, properties, etc.)
REGEX_PATTERNS_CI: dict[str, list[str]] = {
    "TEMPERATURE": [
        r"\b\d+(?:\.\d+)?\s*(?:°C|℃|K|degrees?\s*Celsius?)\b",
    ],
    "PROPERTY": [
        r"\b(?:capacity|specific capacity|energy density|power density|cycle life|"
        r"voltage|conductivity|coulombic efficiency|open[- ]circuit voltage|OCV|"
        r"diffusivity|ionic conductivity|electronic conductivity|capacity retention|"
        r"rate capability|initial coulombic efficiency|ICE)\b",
    ],
    "METRIC": [
        r"\b\d+(?:\.\d+)?\s*(?:mAh/g|mAh g[- ]?1|Wh/kg|Wh kg[- ]?1|V|S/cm|mS/cm|%)",
    ],
    "SYNTHESIS_METHOD": [
        r"\b(?:sol[- ]gel|hydrothermal|co[- ]precipitation|solid[- ]state reaction|"
        r"ball milling|spray drying|electrospinning|sputtering|CVD|PVD|ALD|"
        r"atomic layer deposition|chemical vapor deposition|melt spinning|"
        r"spark plasma sintering|SPS|coprecipitation|combustion|pyrolysis|"
        r"mechanochemical|in[- ]situ polymerization|evaporation)\b",
    ],
    "MEASUREMENT": [
        r"\b(?:XRD|XPS|SEM|TEM|EDS|EDX|BET|FTIR|Raman|EIS|CV|GCD|"
        r"galvanostatic|cyclic voltammetry|impedance spectroscopy|"
        r"X[- ]ray diffraction|X[- ]ray photoelectron)\b",
    ],
    "APPLICATION": [
        r"\b(?:lithium[- ]ion batter\w+|Li[- ]ion batter\w+|sodium[- ]ion batter\w+|"
        r"Na[- ]ion batter\w+|solid[- ]state batter\w+|supercapacitor\w*|"
        r"fuel cell\w*|photovoltaic\w*|solar cell\w*|electrocatalysis|catalysis)\b",
    ],
    "MATERIAL": [
        r"\b(?:cathode|anode|electrolyte|separator|current collector|"
        r"active material|catholyte|anolyte)\b",
    ],
}

# Merge for backward compatibility
for k, v in REGEX_PATTERNS_CI.items():
    REGEX_PATTERNS[k] = v


class RegexEntityExtractor:
    """Zero-dependency regex-based NER – works without ML libraries installed."""

    name = "regex"

    def extract(self, text: str) -> list[EntityCandidate]:
        candidates: list[EntityCandidate] = []
        for ent_type, patterns in REGEX_PATTERNS.items():
            # Chemical formulas must be case-sensitive; everything else uses IGNORECASE
            flags = 0 if ent_type == "CHEMICAL_FORMULA" else re.IGNORECASE
            for pat in patterns:
                for m in re.finditer(pat, text, flags=flags):
                    candidates.append(EntityCandidate(
                        text=m.group(0),
                        entity_type=ent_type,
                        start=m.start(),
                        end=m.end(),
                        confidence=0.7,
                        extractor=self.name,
                    ))
        # de-duplicate overlapping matches (keep longest)
        return _dedup_overlapping(candidates)


# ------------------------------------------------------------------
# 2. spaCy extractor (optional)
# ------------------------------------------------------------------
class SpacyEntityExtractor:
    """spaCy-based extractor. Loads `en_core_sci_sm` or `en_ner_bc5cdr_md` if available.

    For materials-science specific NER, you can install a domain pipeline:
        pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.4/en_core_sci_sm-0.5.4.tar.gz
    """

    name = "spacy"
    _nlp = None

    def __init__(self, model_name: str = "en_core_sci_sm"):
        if SpacyEntityExtractor._nlp is None:
            try:
                import spacy
                SpacyEntityExtractor._nlp = spacy.load(model_name)
                log.info("spaCy model '%s' loaded", model_name)
            except Exception as e:
                log.warning("spaCy model '%s' not available: %s", model_name, e)
                SpacyEntityExtractor._nlp = False  # mark as unavailable

    def extract(self, text: str) -> list[EntityCandidate]:
        if not SpacyEntityExtractor._nlp:
            return []
        doc = SpacyEntityExtractor._nlp(text)
        candidates: list[EntityCandidate] = []
        for ent in doc.ents:
            candidates.append(EntityCandidate(
                text=ent.text,
                entity_type=_map_spacy_label(ent.label_),
                start=ent.start_char,
                end=ent.end_char,
                confidence=0.85,
                extractor=self.name,
            ))
        return candidates


def _map_spacy_label(label: str) -> str:
    """Map spaCy's general labels to our materials-science taxonomy."""
    mapping = {
        "CHEMICAL": "CHEMICAL_FORMULA",
        "ENTITY": "MATERIAL",
        "ORG": "EQUIPMENT",
        "GPE": "MATERIAL",  # placeholder
        "DATE": "PROCESS_PARAMETER",
        "QUANTITY": "METRIC",
    }
    return mapping.get(label, "MATERIAL")


# ------------------------------------------------------------------
# 3. Transformer extractor (MatSciBERT / SciBERT) – optional, heavy
# ------------------------------------------------------------------
class TransformerEntityExtractor:
    """HuggingFace token-classification extractor.

    Default model: `sumedhaa/MatSciBERT` (or fallback to `allenai/scibert_scivocab_uncased`).
    Requires `transformers` and `torch` to be installed.
    """

    name = "transformer"
    _pipe = None

    def __init__(self, model_name: str = "allenai/scibert_scivocab_uncased"):
        if TransformerEntityExtractor._pipe is None:
            try:
                from transformers import pipeline
                TransformerEntityExtractor._pipe = pipeline(
                    "token-classification",
                    model=model_name,
                    aggregation_strategy="simple",
                )
                log.info("Transformer NER model '%s' loaded", model_name)
            except Exception as e:
                log.warning("Transformer NER unavailable: %s", e)
                TransformerEntityExtractor._pipe = False

    def extract(self, text: str) -> list[EntityCandidate]:
        if not TransformerEntityExtractor._pipe:
            return []
        # transformers truncates internally; for long texts, run on first 1500 chars
        snippet = text[:1500]
        results = TransformerEntityExtractor._pipe(snippet)
        candidates: list[EntityCandidate] = []
        for r in results:
            candidates.append(EntityCandidate(
                text=r["word"],
                entity_type=_map_transformer_label(r.get("entity_group", "")),
                start=r.get("start", 0),
                end=r.get("end", 0),
                confidence=float(r.get("score", 0.0)),
                extractor=self.name,
            ))
        return candidates


def _map_transformer_label(label: str) -> str:
    return {
        "PER": "MATERIAL",
        "ORG": "EQUIPMENT",
        "LOC": "MATERIAL",
        "MISC": "MATERIAL",
    }.get(label, "MATERIAL")


# ------------------------------------------------------------------
# Ensemble extractor
# ------------------------------------------------------------------
class EnsembleEntityExtractor:
    """Run regex + spaCy + transformer (whichever are available) and merge."""

    def __init__(self, use_spacy: bool = True, use_transformer: bool = False):
        self.regex = RegexEntityExtractor()
        self.spacy = SpacyEntityExtractor() if use_spacy else None
        self.transformer = TransformerEntityExtractor() if use_transformer else None

    def extract(self, text: str) -> list[EntityCandidate]:
        all_cands: list[EntityCandidate] = []
        all_cands.extend(self.regex.extract(text))
        if self.spacy:
            all_cands.extend(self.spacy.extract(text))
        if self.transformer:
            all_cands.extend(self.transformer.extract(text))
        return _dedup_overlapping(all_cands)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def _dedup_overlapping(candidates: list[EntityCandidate]) -> list[EntityCandidate]:
    """Keep best candidate per (start, end) overlap. Prefer longer + higher confidence."""
    if not candidates:
        return []
    # sort by start asc, then by descending length, then by descending confidence
    candidates.sort(key=lambda c: (c.start, -(c.end - c.start), -c.confidence))
    result: list[EntityCandidate] = []
    last_end = -1
    for c in candidates:
        if c.start >= last_end:
            result.append(c)
            last_end = c.end
        else:
            # overlapping — keep the one with longer span or higher confidence
            existing = result[-1]
            new_len = c.end - c.start
            old_len = existing.end - existing.start
            if new_len > old_len or (new_len == old_len and c.confidence > existing.confidence):
                result[-1] = c
                last_end = c.end
    return result


# Convenience singleton
_default_extractor = None


def get_default_extractor() -> EnsembleEntityExtractor:
    global _default_extractor
    if _default_extractor is None:
        _default_extractor = EnsembleEntityExtractor(use_spacy=False, use_transformer=False)
    return _default_extractor
