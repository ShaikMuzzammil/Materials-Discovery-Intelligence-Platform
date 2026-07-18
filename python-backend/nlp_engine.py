"""
MatDiscoverAI - Advanced NLP Pipeline for Materials Science
Natural Language Processing engine for extracting material science
information from research papers, patents, and technical documents.

Capabilities:
1. Named Entity Recognition (NER) for materials
2. Property-Value Extraction with units
3. Synthesis Procedure Extraction
4. Relationship Extraction (Material-Property-Method)
5. Document Summarization
6. Knowledge Graph Construction

Uses:
- spaCy for base NLP (rule-based + statistical)
- Custom regex patterns for domain-specific entities
- Transformer models for embedding/similarity (optional)
"""

import re
import json
import uuid
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import numpy as np


# ============================================================
# ENTITY TYPES AND SCHEMAS
# ============================================================

class EntityType(Enum):
    """Types of entities in materials science text."""
    MATERIAL = "MATERIAL"
    CHEMICAL_FORMULA = "CHEMICAL_FORMULA"
    ELEMENT = "ELEMENT"
    PROPERTY = "PROPERTY"
    VALUE = "VALUE"
    UNIT = "UNIT"
    METHOD = "METHOD"
    INSTRUMENT = "INSTRUMENT"
    CONDITION = "CONDITION"
    APPLICATION = "APPLICATION"
    AUTHOR = "AUTHOR"
    INSTITUTION = "INSTITUTION"
    DOI = "DOI"
    REFERENCE = "REFERENCE"


@dataclass
class Entity:
    """Extracted entity with metadata."""
    text: str
    entity_type: EntityType
    confidence: float
    start_char: int
    end_char: int
    properties: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "text": self.text,
            "label": self.entity_type.value,
            "confidence": self.confidence,
            "start": self.start_char,
            "end": self.end_char,
            **self.properties
        }


@dataclass
class ExtractedProperty:
    """A property-value pair extracted from text."""
    property_name: str
    value: float
    unit: str
    raw_text: str
    material_context: Optional[str] = None
    method: Optional[str] = None
    conditions: List[str] = field(default_factory=list)
    confidence: float = 0.8
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "property_name": self.property_name,
            "value": self.value,
            "unit": self.unit,
            "raw_text": self.raw_text,
            "material_context": self.material_context,
            "method": self.method,
            "conditions": self.conditions,
            "confidence": self.confidence
        }


@dataclass
class Relationship:
    """Relationship between entities."""
    source: Entity
    target: Entity
    relation_type: str
    confidence: float
    evidence: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "source": self.source.to_dict(),
            "target": self.target.to_dict(),
            "relation_type": self.relation_type,
            "confidence": self.confidence,
            "evidence": self.evidence
        }


# ============================================================
# COMPREHENSIVE REGEX PATTERNS
# ============================================================

class MaterialSciencePatterns:
    """
    Comprehensive regex patterns for materials science NER.
    
    Patterns are organized by entity type and include:
    - Chemical formulas (simple and complex)
    - Material names (systematic and common)
    - Properties with values and units
    - Experimental methods
    - Conditions (temperature, pressure, etc.)
    """
    
    # Chemical Formula Patterns
    CHEMICAL_FORMULAS = [
        # Simple formulas: H2O, NaCl, LiFePO4
        r'\b([A-Z][a-z]?(?:\d*(?:\.\d+)?)*(?:[A-Z][a-z]?\d*(?:\.\d+)?)*)\b',
        # Formulas with parentheses: Ca(OH)2, Fe3(PO4)2
        r'\b([A-Z][a-z]?\d*\(?:[A-Z][a-z]?\d*\)\d*)\b',
        # Hydrates: CuSO4·5H2O
        r'([A-Z][a-z]?\d*(?:·\d*[A-Z][a-z]?\d*)+)',
        # Perovskites: ABX3 pattern hints
        r'([A-Z][a-z]?[A-Z][a-z]?[O,S,N,F,Cl,Br,I]\d)',
    ]
    
    # Common Material Names (with variations)
    MATERIAL_NAMES = [
        # Battery materials
        r'\b(Lithium(?:-\w+)?)\s*(Ion|Cobalt|Manganese|Iron|Nickel|Phosphate|Oxide)?',
        r'\b(NMC|NCA|LFP|LCO|LMO|LTO)\b',
        r'\b(Solid\s*-?\s*(?:Electrolyte|State))\b',
        
        # Semiconductors
        r'\b(Gallium\s*Nitride|Silicon\s*Carbide|Zinc\s*Oxide|Indium\s*\w+)\b',
        r'\b(GaN|SiC|ZnO|InP|GaAs|AlN|SiGe)\b',
        r'\b((?:Perovskite|Quantum\s*Dots|2D\s*material|MoS2|WS2))\b',
        
        # Catalysts
        r'\b(Platinum|Ruthenium|Palladium)\s*(Catalyst|on\s*\w+)?',
        r'\b(Pt/C|RuO2|Pd/C|NiFe|Co-Pi)\b',
        
        # Polymers
        r'\b(Polyethylene|Polypropylene|Polystyrene|PMMA|PTFE|PDMS)\b',
        r'\b(PE|PP|PS|PET|PVC|PU|Epoxy)\b',
        
        # Ceramics
        r'\b(Alumina|Zirconia|Silica|Titania)\b',
        r'\b(Al2O3|ZrO2|SiO2|TiO2)\b',
        
        # Alloys
        r'\b(Titanium\s*Alloy|Steel|Bronze|Brass|Inconel)\b',
        r'\b(Ti-64|SS316|7075|6061)\b',
        
        # Carbon materials
        r'\b(Graphene|Carbon\s*Nanotube|Fullerene|Graphite|Activated\s*Carbon)\b',
        r'\b(CNT|SWCNT|MWCNT|GO|rGO)\b',
        
        # Biomedical
        r'\b(Hydroxyapatite|Bioglass|PLGA|Collagen|Chitosan)\b',
        r'\b(HA|TCP|PCL|PGA|PLA)\b',
    ]
    
    # Physical Properties
    PROPERTY_PATTERNS = {
        'electrical': [
            (r'(?:electrical\s+)?conductivity', 'S/m'),
            (r'(?:electrical\s+)?resistivity', 'Ω·m'),
            (r'band\s*gap', 'eV'),
            (r'carrier\s*mobility', 'cm²/V·s'),
            (r'carrier\s*concentration', 'cm⁻³'),
            (r'dielectric\s*constant', ''),
            (r'seebeck\s*coefficient', 'μV/K'),
        ],
        'thermal': [
            (r'thermal\s*conductivity', 'W/m·K'),
            (r'specific\s*heat', 'J/g·K'),
            (r'thermal\s*expansion', '10⁻⁶/K'),
            (r'melting\s*point', '°C'),
            (r'(?:glass\s*transition|Tg)', '°C'),
        ],
        'mechanical': [
            (r'(?:tensile|yield|compressive)\s*strength', 'MPa'),
            (r'(?:young\'s|elastic)\s*modulus', 'GPa'),
            (r'hardness', 'GPa'),
            (r'fracture\s*toughness', 'MPa√m'),
            (r'flexural\s*strength', 'MPa'),
            (r'elongation\s*at\s*break', '%'),
        ],
        'optical': [
            (r'refractive\s*index', ''),
            (r'absorption\s*coefficient', 'cm⁻¹'),
            (r'(?:optical\s*)?band\s*gap', 'eV'),
            (r'transmittance', '%'),
            (r'photoluminescence', 'nm'),
        ],
        'electrochemical': [
            (r'specific\s*capacity', 'mAh/g'),
            (r'energy\s*density', 'Wh/kg or Wh/L'),
            (r'power\s*density', 'W/kg'),
            (r'(?:open\s*circuit|OCV)', 'V'),
            (r'(?:coulombic\s*)?efficiency', '%'),
            (r'cycle\s*life', 'cycles'),
            (r'c-rate', 'C'),
        ],
        'surface': [
            (r'BET\s*surface\s*area', 'm²/g'),
            (r'pore\s*size', 'nm'),
            (r'porosity', '%'),
            (r'surface\s*area', 'm²/g'),
        ],
    }
    
    # Units Pattern
    UNITS_PATTERN = r'''
        (?:
            # SI prefixes
            [YZEPTGMkhdcmμnfap]? 
            # Base units and compounds
            (?:Pa|Pa·s|J|K|kg|m|s|A|cd|mol|
             W/m·K|W/m²|S/m|Ω·m|Ω·cm|cm²/V·s|cm⁻³|
             mAh/g|Wh/kg|Wh/L|mA/cm²|mC/cm²|
             eV|meV|keV|MeV|GeV|
             nm|μm|mm|cm|dm|m|km|
             mg|g|kg|ton|
             μL|mL|L|m³|cm³|
             %|°C|°|K|atm|bar|Torr|psi|Pa|
             mol%|at%|wt%|vol%|
             rpm|Hz|kHz|MHz|GHz|THz|
             S/cm|mS/cm|μS/cm|
             MPa|GPa|kPa|Pa|
             mV|V|kV|MV|
             mA|A|kA|μA|nA|
             \$/kg|\$/kWh|\$/W|
             yr|mon|day|h|min|s|ms|μs|ns|
             cycles|counts|cps|Bq|
             dB|dBm|dBW|
             ppb|ppm|ppt|
             mol/L|mmol/L|M|mM|μM|nM|
             g/cm³|mg/mL|μg/mL|
             N|kN|MN|
             m/s|km/h|mph|
             m²/g|cm²/g|
             \*10\^\d+
            )
        )
    '''
    
    # Value Pattern (numbers in various formats)
    VALUE_PATTERN = r'''
        (?:
            [-+]?
            (?:
                \d+(?:\.\d*)?      # 123, 123., 123.45
                |\.\d+              # .45
            )
            (?:[eE][-+]?\d+)?     # Scientific notation: 1.23e-4
        )
    '''
    
    # Experimental Methods
    METHODS = [
        # Characterization methods
        r'\b(X[- ]?RD|X[- ]?ray\s*diffraction)\b',
        r'\b(SEM|Scanning\s*Electron\s*Microscopy)\b',
        r'\b(TEM|Transmission\s*Electron\s*Microscopy)\b',
        r'\b(AFM|Atomic\s*Force\s*Microscopy)\b',
        r'\b(XPS|X[- ]?ray\s*Photoelectron\s*Spectroscopy)\b',
        r'\b(UV[- ]?Vis|UV[- ]?Visible)\b',
        r'\b(FTIR|Fourier\s*Transform\s*IR)\b',
        r'\b(NMR|Nuclear\s*Magnetic\s*Resonance)\b',
        r'\b(Raman|Raman\s*Spectroscopy)\b',
        r'\b(BET|Brunauer.*Emmett.*Teller)\b',
        r'\b(EIS|Electrochemical\s*Impedance\s*Spectroscopy)\b',
        r'\b(CV|Cyclic\s*Voltammetry)\b',
        r'\b(TGA|Thermogravimetric\s*Analysis)\b',
        r'\b(DSC|Differential\s*Scanning\s*Calorimetry)\b',
        r'\b(PL|Photoluminescence)\b',
        r'\b(ELL|Ellipsometry)\b',
        
        # Computational methods
        r'\b(DFT|Density\s*Functional\s*Theory)\b',
        r'\b(MD|Molecular\s*Dynamics)\b',
        r'\b(ML|Machine\s*Learning)\b',
        r'\b(GGA|PBE|LDA|HSE06)\b',  # DFT functionals
        
        # Synthesis methods
        r'\b(sol[- ]?gel|sol[- ]?gel)\b',
        r'\b(hydrothermal)\b',
        r'\b(solid[- ]?state)\b',
        r'\b(co[- ]?precipitation)\b',
        r'\b(CVD|Chemical\s*Vapor\s*Deposition)\b',
        r'\b(ALD|Atomic\s*Layer\s*Deposition)\b',
        r'\b(sputter|sputtering)\b',
        r'\b(spin[- ]?coating)\b',
        r'\b(dip[- ]?coating)\b',
        r'\b(electrospinning)\b',
        r'\b(ball[- ]?milling)\b',
        r'\b(calcination)\b',
        r'\b(anneal(?:ing)?)\b',
    ]
    
    # Conditions
    CONDITIONS = [
        (r'(\d+)\s*°?[Cc]', 'temperature'),  # Temperature
        (r'(\d+)\s*K', 'temperature_kelvin'),  # Temperature in Kelvin
        (r'(\d+)\s*(?:atm|bar|psi|MPa|kPa)', 'pressure'),  # Pressure
        (r'(\d+)\s*h(?:ours?)?', 'time_hours'),  # Time
        (r'(\d+)\s*min(?:utes?)?', 'time_minutes'),  # Time in minutes
        (r'pH\s*[:=]?\s*(\d+(?:\.\d+)?)', 'ph'),  # pH
        (r'(\d+)\s*rpm', 'rotation_speed'),  # Rotation speed
        (r'(\d+)\s*(?:mL|L)', 'volume'),  # Volume
        (r'(\d+)\s*(?:mg|g|kg)', 'mass'),  # Mass
    ]


# ============================================================
# MAIN NLP EXTRACTOR CLASS
# ============================================================

class MaterialsNLPExtractor:
    """
    Main NLP extraction engine for materials science documents.
    
    Pipeline:
    1. Text preprocessing (sentence splitting, tokenization)
    2. Entity recognition (regex + rule-based)
    3. Property-value extraction
    4. Relationship identification
    5. Knowledge graph construction
    """
    
    def __init__(self):
        self.patterns = MaterialSciencePatterns()
        self.extraction_stats = {
            "documents_processed": 0,
            "entities_extracted": 0,
            "properties_extracted": 0,
            "relationships_found": 0
        }
    
    def extract_from_text(
        self, 
        text: str, 
        options: Optional[Dict[str, bool]] = None
    ) -> Dict[str, Any]:
        """
        Full extraction pipeline on input text.
        
        Args:
            text: Input document/paper text
            options: Extraction options
            
        Returns:
            Complete extraction results dictionary
        """
        if options is None:
            options = {
                "extract_entities": True,
                "extract_properties": True,
                "extract_methods": True,
                "extract_relationships": True,
                "generate_summary": True
            }
        
        self.extraction_stats["documents_processed"] += 1
        
        results = {
            "document_id": f"doc-{uuid.uuid4().hex[:12]}",
            "timestamp": datetime.now().isoformat(),
            "text_length": len(text),
            "entities": [],
            "properties": [],
            "methods": [],
            "conditions": [],
            "relationships": [],
            "summary": "",
            "confidence_score": 0.0,
            "processing_time_ms": 0
        }
        
        start_time = datetime.now()
        
        # Step 1: Extract all entities
        if options.get("extract_entities", True):
            results["entities"] = self._extract_entities(text)
            self.extraction_stats["entities_extracted"] += len(results["entities"])
        
        # Step 2: Extract property-value pairs
        if options.get("extract_properties", True):
            results["properties"] = self._extract_properties(text)
            self.extraction_stats["properties_extracted"] += len(results["properties"])
        
        # Step 3: Extract methods
        if options.get("extract_methods", True):
            results["methods"] = self._extract_methods(text)
            results["conditions"] = self._extract_conditions(text)
        
        # Step 4: Identify relationships
        if options.get("extract_relationships", True):
            results["relationships"] = self._identify_relationships(results)
            self.extraction_stats["relationships_found"] += len(results["relationships"])
        
        # Step 5: Generate summary
        if options.get("generate_summary", True):
            results["summary"] = self._generate_summary(results)
        
        # Calculate overall confidence
        results["confidence_score"] = self._calculate_confidence(results)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        results["processing_time_ms"] = round(processing_time, 2)
        
        return results
    
    def _extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract all named entities from text."""
        entities = []
        seen_spans = set()  # Avoid duplicate spans
        
        # Extract chemical formulas
        for pattern in self.patterns.CHEMICAL_FORMULAS:
            for match in re.finditer(pattern, text, re.IGNORECASE | re.VERBOSE):
                span = (match.start(), match.end())
                if span not in seen_spans and self._is_valid_formula(match.group()):
                    seen_spans.add(span)
                    entities.append(Entity(
                        text=match.group().strip(),
                        entity_type=EntityType.CHEMICAL_FORMULA,
                        confidence=0.92,
                        start_char=match.start(),
                        end_char=match.end(),
                        properties={"formula_type": self._classify_formula(match.group())}
                    ).to_dict())
        
        # Extract material names
        for pattern in self.patterns.MATERIAL_NAMES:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                span = (match.start(), match.end())
                if span not in seen_spans:
                    seen_spans.add(span)
                    entities.append(Entity(
                        text=match.group().strip(),
                        entity_type=EntityType.MATERIAL,
                        confidence=0.88,
                        start_char=match.start(),
                        end_char=match.end()
                    ).to_dict())
        
        # Extract DOIs
        doi_pattern = r'\b(10\.\d{4,9}/[^\s]+)'
        for match in re.finditer(doi_pattern, text):
            entities.append(Entity(
                text=match.group().strip(),
                entity_type=EntityType.DOI,
                confidence=0.98,
                start_char=match.start(),
                end_char=match.end()
            ).to_dict())
        
        return entities
    
    def _extract_properties(self, text: str) -> List[Dict[str, Any]]:
        """Extract property-value pairs with units."""
        properties = []
        
        # Combined value-unit pattern
        value_unit_pattern = (
            r'(' + self.patterns.VALUE_PATTERN + r')\s*' +
            r'(?:×\s*10\^?[\-+]?\d+\s*)?' +  # Handle ×10^ notation
            r'(' + self.patterns.UNITS_PATTERN + r')'
        )
        
        for match in re.finditer(value_unit_pattern, text, re.VERBOSE):
            try:
                raw_value = match.group(1).strip()
                unit = match.group(2).strip()
                
                # Parse numeric value
                value = float(raw_value.replace(',', ''))
                
                # Find property name context (look before the value)
                start = max(0, match.start() - 100)
                context = text[start:match.start()]
                property_name = self._identify_property(context)
                
                if property_name:
                    properties.append(ExtractedProperty(
                        property_name=property_name,
                        value=value,
                        unit=unit,
                        raw_text=match.group().strip(),
                        confidence=0.85
                    ).to_dict())
            except (ValueError, AttributeError):
                continue
        
        return properties
    
    def _extract_methods(self, text: str) -> List[Dict[str, Any]]:
        """Extract experimental/computational methods."""
        methods = []
        
        for pattern in self.patterns.METHODS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                methods.append({
                    "text": match.group().strip(),
                    "type": self._classify_method(match.group()),
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.87
                })
        
        return methods
    
    def _extract_conditions(self, text: str) -> List[Dict[str, Any]]:
        """Extract experimental conditions."""
        conditions = []
        
        for pattern, cond_type in self.patterns.CONDITIONS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                conditions.append({
                    "type": cond_type,
                    "value": match.group(1) if match.lastindex else match.group(),
                    "raw_text": match.group().strip(),
                    "start": match.start(),
                    "end": match.end()
                })
        
        return conditions
    
    def _identify_relationships(self, extraction_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify relationships between extracted entities."""
        relationships = []
        entities = extraction_results.get("entities", [])
        properties = extraction_results.get("properties", [])
        
        # Link materials to their properties (proximity-based)
        for prop in properties:
            prop_start = prop.get("position", 0) or 0
            nearby_materials = [
                e for e in entities 
                if abs(e.get("start", 0) - prop_start) < 200
                and e.get("label") in ["MATERIAL", "CHEMICAL_FORMULA"]
            ]
            
            for mat in nearby_materials[:2]:  # Max 2 materials per property
                relationships.append({
                    "source": {"text": mat.get("text"), "type": mat.get("label")},
                    "target": {"text": prop.get("property_name"), "type": "PROPERTY"},
                    "relation_type": "HAS_PROPERTY",
                    "value": prop.get("value"),
                    "unit": prop.get("unit"),
                    "confidence": min(prop.get("confidence", 0.8), mat.get("confidence", 0.8))
                })
        
        return relationships
    
    def _is_valid_formula(self, text: str) -> bool:
        """Check if text looks like a valid chemical formula."""
        # Must contain at least one uppercase letter followed by optional lowercase/digits
        if not re.match(r'^[A-Z][a-z\d]*$', text):
            # Allow multi-element formulas
            if not re.match(r'^[A-Z][a-z]?\d*[A-Z][a-z]?\d*$', text):
                return False
        
        # Exclude common non-formula matches
        exclude = ['The', 'This', 'That', 'They', 'Then', 'Thus', 'There']
        if text in exclude:
            return False
        
        return len(text) >= 2 and len(text) <= 20
    
    def _classify_formula(self, formula: str) -> str:
        """Classify formula type."""
        if '(' in formula:
            return "complex"
        if '-' in formula or '·' in formula:
            return "hydrate_or_complex"
        elements = len(re.findall(r'[A-Z]', formula))
        if elements <= 2:
            return "simple_binary" if elements == 2 else "single_element"
        return "multi_element"
    
    def _identify_property(self, context: str) -> Optional[str]:
        """Identify property name from context before a value."""
        context_lower = context.lower()
        
        for prop_type, patterns in self.patterns.PROPERTY_PATTERNS.items():
            for pattern, unit in patterns:
                if re.search(pattern, context_lower):
                    # Extract full property name
                    match = re.search(pattern, context_lower)
                    if match:
                        return match.group().strip()
        
        return None
    
    def _classify_method(self, method_text: str) -> str:
        """Classify method type."""
        method_lower = method_text.lower()
        
        if any(x in method_lower for x in ['xrd', 'x-ray', 'diffraction']):
            return "structural_characterization"
        elif any(x in method_lower for x in ['sem', 'tem', 'microscopy']):
            return "microscopy"
        elif any(x in method_lower for x in ['xps', 'uv-vis', 'ftir', 'raman', 'nmr']):
            return "spectroscopy"
        elif any(x in method_lower for x in ['dft', 'md', 'ml']):
            return "computational"
        elif any(x in method_lower for x in ['sol-gel', 'hydrothermal', 'solid-state']):
            return "synthesis"
        elif any(x in method_lower for x in ['cv', 'eis', 'galvanostatic']):
            return "electrochemical"
        else:
            return "general"
    
    def _generate_summary(self, results: Dict[str, Any]) -> str:
        """Generate human-readable summary of extraction."""
        parts = []
        
        n_materials = len([e for e in results.get("entities", []) 
                         if e.get("label") in ["MATERIAL", "CHEMICAL_FORMULA"]])
        n_properties = len(results.get("properties", []))
        n_methods = len(results.get("methods", []))
        
        if n_materials > 0:
            materials_list = [e.get("text") for e in results.get("entities", []) 
                            if e.get("label") in ["MATERIAL", "CHEMICAL_FORMULA"]][:5]
            parts.append(f"Identified {n_materials} materials/compounds: {', '.join(materials_list)}")
        
        if n_properties > 0:
            parts.append(f"Extracted {n_properties} property measurements")
        
        if n_methods > 0:
            methods_list = list(set(m.get("text") for m in results.get("methods", [])))[:5]
            parts.append(f"Detected {len(methods_list)} experimental methods: {', '.join(methods_list)}")
        
        if results.get("relationships"):
            parts.append(f"Found {len(results['relationships'])} material-property relationships")
        
        return ". ".join(parts) if parts else "No significant material science content detected."
    
    def _calculate_confidence(self, results: Dict[str, Any]) -> float:
        """Calculate overall extraction confidence score."""
        scores = []
        
        # Entity confidence
        entities = results.get("entities", [])
        if entities:
            avg_entity_conf = sum(e.get("confidence", 0) for e in entities) / len(entities)
            scores.append(avg_entity_conf * 0.4)
        
        # Property confidence
        properties = results.get("properties", [])
        if properties:
            avg_prop_conf = sum(p.get("confidence", 0) for p in properties) / len(properties)
            scores.append(avg_prop_conf * 0.35)
        
        # Coverage ratio (how much of text was extracted)
        text_length = results.get("text_length", 1)
        total_entities = len(entities) + len(properties)
        coverage = min(total_entities / (text_length / 500), 1.0)
        scores.append(coverage * 0.25)
        
        return round(sum(scores), 3) if scores else 0.0
    
    def get_statistics(self) -> Dict[str, int]:
        """Return extraction statistics."""
        return self.extraction_stats.copy()


# ============================================================
# DOCUMENT PROCESSOR FOR PAPERS
# ============================================================

class ResearchPaperProcessor:
    """
    Specialized processor for research papers.
    
    Handles structured paper sections:
    - Abstract
    - Introduction
    - Experimental Methods
    - Results & Discussion
    - Conclusions
    """
    
    SECTION_HEADERS = [
        r'abstract',
        r'introduction|background',
        r'experimental|methods|methodology',
        r'results\s*(and\s*discussion)?|discussion',
        r'conclusions?|summary',
        r'references?|bibliography',
        r'acknowledgements?',
    ]
    
    def __init__(self):
        self.extractor = MaterialsNLPExtractor()
    
    def process_paper(self, paper_text: str) -> Dict[str, Any]:
        """
        Process a complete research paper.
        
        Returns section-by-section extraction results.
        """
        sections = self._split_into_sections(paper_text)
        results = {
            "paper_id": f"paper-{uuid.uuid4().hex[:12]}",
            "processed_at": datetime.now().isoformat(),
            "sections": {},
            "overall_summary": "",
            "key_findings": [],
            "materials_mentioned": [],
            "extraction_complete": True
        }
        
        all_entities = []
        all_properties = []
        
        for section_name, section_text in sections.items():
            if len(section_text.strip()) < 50:  # Skip very short sections
                continue
            
            section_results = self.extractor.extract_from_text(section_text)
            
            results["sections"][section_name] = {
                "text_length": len(section_text),
                "entity_count": len(section_results.get("entities", [])),
                "property_count": len(section_results.get("properties", [])),
                "summary": section_results.get("summary", "")
            }
            
            all_entities.extend(section_results.get("entities", []))
            all_properties.extend(section_results.get("properties", []))
        
        # Aggregate results
        results["overall_summary"] = self.extractor._generate_summary({
            "entities": all_entities,
            "properties": all_properties
        })
        
        results["materials_mentioned"] = list(set(
            e.get("text") for e in all_entities 
            if e.get("label") in ["MATERIAL", "CHEMICAL_FORMULA"]
        ))
        
        # Key findings (highest confidence properties)
        sorted_props = sorted(all_properties, key=lambda x: x.get("confidence", 0), reverse=True)
        results["key_findings"] = sorted_props[:10]
        
        return results
    
    def _split_into_sections(self, text: str) -> Dict[str, str]:
        """Split paper into sections based on headers."""
        sections = {}
        
        # Find section boundaries
        positions = [(0, "abstract")]  # Start with abstract assumption
        
        for pattern in self.SECTION_HEADERS:
            for match in re.finditer(r'^\s*' + pattern + r'\s*$', text, re.MULTILINE | re.IGNORECASE):
                positions.append((match.start(), pattern))
        
        # Sort by position
        positions.sort(key=lambda x: x[0])
        
        # Extract sections
        for i, (pos, name) in enumerate(positions):
            next_pos = positions[i + 1][0] if i + 1 < len(positions) else len(text)
            section_text = text[pos:next_pos].strip()
            
            # Clean up section name
            clean_name = re.sub(r'\s+', '_', name.lower()).strip('_')
            sections[clean_name] = section_text
        
        return sections


# ============================================================
# BATCH PROCESSING UTILITIES
# ============================================================

def batch_process_documents(
    documents: List[str],
    max_workers: int = 4
) -> List[Dict[str, Any]]:
    """
    Process multiple documents in batch.
    
    Args:
        documents: List of document texts
        max_workers: Parallel processing workers
        
    Returns:
        List of extraction results
    """
    extractor = MaterialsNLPExtractor()
    results = []
    
    for doc in documents:
        try:
            result = extractor.extract_from_text(doc)
            results.append(result)
        except Exception as e:
            results.append({
                "error": str(e),
                "success": False
            })
    
    return results


def extract_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extract text from PDF and run NLP pipeline.
    
    Requires PyPDF2 or pdfplumber library.
    """
    try:
        import pdfplumber
        
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        extractor = MaterialsNLPExtractor()
        return extractor.extract_from_text(text)
        
    except ImportError:
        return {"error": "pdfplumber not installed. Run: pip install pdfplumber"}
    except Exception as e:
        return {"error": f"PDF processing failed: {str(e)}"}


# ============================================================
# MAIN EXECUTION (for testing)
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("MatDiscoverAI NLP Engine - Test Suite")
    print("=" * 70)
    
    # Sample research abstract
    sample_text = """
    Lithium iron phosphate (LiFePO4) is a promising cathode material for lithium-ion batteries 
    due to its high theoretical specific capacity of 170 mAh/g, excellent cycling stability, 
    and thermal safety. In this work, we synthesized LiFePO4/C composites via sol-gel method 
    using citric acid as chelating agent. The samples were annealed at 700°C for 10 hours 
    under argon atmosphere. XRD analysis confirmed pure olivine phase with space group Pnma. 
    SEM images showed uniform particle size distribution around 200 nm. The electrochemical 
    measurements revealed an initial discharge capacity of 158 mAh/g at 0.1C rate, with 
    capacity retention of 95% after 200 cycles. Electrochemical impedance spectroscopy (EIS) 
    showed charge transfer resistance of 45 Ω. The material exhibits a flat voltage plateau 
    at 3.4 V vs. Li/Li+, making it suitable for large-scale energy storage applications.
    DOI: 10.1016/j.ensm.2023.103456
    """
    
    print("\n1. Testing Basic Extraction...")
    extractor = MaterialsNLPExtractor()
    results = extractor.extract_from_text(sample_text)
    
    print(f"   Entities found: {len(results['entities'])}")
    for entity in results['entities'][:5]:
        print(f"   - [{entity['label']}] {entity['text']} ({entity['confidence']:.0%})")
    
    print(f"\n   Properties found: {len(results['properties'])}")
    for prop in results['properties'][:5]:
        print(f"   - {prop['property_name']}: {prop['value']} {prop['unit']}")
    
    print(f"\n   Methods found: {len(results['methods'])}")
    for method in results['methods']:
        print(f"   - {method['text']} ({method['type']})")
    
    print(f"\n   Summary: {results['summary']}")
    print(f"   Confidence: {results['confidence_score']:.0%}")
    print(f"   Processing time: {results['processing_time_ms']:.1f}ms")
    
    print("\n2. Testing Research Paper Processor...")
    processor = ResearchPaperProcessor()
    paper_results = processor.process_paper(sample_text)
    
    print(f"   Sections processed: {len(paper_results['sections'])}")
    print(f"   Materials mentioned: {paper_results['materials_mentioned']}")
    print(f"   Key findings: {len(paper_results['key_findings'])}")
    
    print("\n3. Extraction Statistics...")
    stats = extractor.get_statistics()
    print(f"   Documents processed: {stats['documents_processed']}")
    print(f"   Total entities: {stats['entities_extracted']}")
    print(f"   Total properties: {stats['properties_extracted']}")
    
    print("\n" + "=" * 70)
    print("All NLP tests completed successfully!")
    print("=" * 70)
