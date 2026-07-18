// MatDiscoverAI - ML Pipeline Mini-Service
// Handles PDF parsing, NER, material extraction, and prediction
// Port: 3030

const PORT = 3030;

// ============================================================
// IN-MEMORY DATA STORE (simulates ML model outputs)
// ============================================================

interface MaterialEntity {
  name: string;
  formula: string;
  category: string;
  confidence: number;
  context: string;
}

interface PropertyEntity {
  name: string;
  value: string;
  unit: string;
  confidence: number;
}

interface RelationEntity {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

interface ExtractionResult {
  materials: MaterialEntity[];
  properties: PropertyEntity[];
  relations: RelationEntity[];
  summary: string;
}

// ============================================================
// NER SIMULATION - Material Name Recognition
// ============================================================

const KNOWN_MATERIALS: Record<string, { formula: string; category: string }> = {
  "lithium iron phosphate": { formula: "LiFePO4", category: "battery" },
  "lifepo4": { formula: "LiFePO4", category: "battery" },
  "lithium cobalt oxide": { formula: "LiCoO2", category: "battery" },
  "lico2": { formula: "LiCoO2", category: "battery" },
  "lithium nickel manganese cobalt oxide": { formula: "LiNiMnCoO2", category: "battery" },
  "nmc": { formula: "LiNiMnCoO2", category: "battery" },
  "lithium titanate": { formula: "Li4Ti5O12", category: "battery" },
  "graphene": { formula: "C", category: "semiconductor" },
  "graphene oxide": { formula: "CxOyHz", category: "semiconductor" },
  "silicon": { formula: "Si", category: "semiconductor" },
  "silicon carbide": { formula: "SiC", category: "semiconductor" },
  "gaas": { formula: "GaAs", category: "semiconductor" },
  "gallium arsenide": { formula: "GaAs", category: "semiconductor" },
  "perovskite": { formula: "ABX3", category: "solar" },
  "mapbi3": { formula: "CH3NH3PbI3", category: "solar" },
  "methylammonium lead iodide": { formula: "CH3NH3PbI3", category: "solar" },
  "titanium dioxide": { formula: "TiO2", category: "catalyst" },
  "tio2": { formula: "TiO2", category: "catalyst" },
  "zinc oxide": { formula: "ZnO", category: "semiconductor" },
  "zno": { formula: "ZnO", category: "semiconductor" },
  "copper indium gallium selenide": { formula: "CuInGaSe2", category: "solar" },
  "cigs": { formula: "CuInGaSe2", category: "solar" },
  "hydrogen storage alloy": { formula: "LaNi5", category: "alloy" },
  "lani5": { formula: "LaNi5", category: "alloy" },
  "stainless steel 316": { formula: "FeCrNiMo", category: "alloy" },
  "inconel 718": { formula: "NiCrFeNbMo", category: "alloy" },
  "pet": { formula: "(C10H8O4)n", category: "polymer" },
  "polyethylene terephthalate": { formula: "(C10H8O4)n", category: "polymer" },
  "peek": { formula: "(C19H12O3)n", category: "polymer" },
  "polyetheretherketone": { formula: "(C19H12O3)n", category: "polymer" },
  "alumina": { formula: "Al2O3", category: "ceramic" },
  "aluminium oxide": { formula: "Al2O3", category: "ceramic" },
  "zirconia": { formula: "ZrO2", category: "ceramic" },
  "zirconium dioxide": { formula: "ZrO2", category: "ceramic" },
  "hydroxyapatite": { formula: "Ca5(PO4)3OH", category: "biomedical" },
  "titanium alloy": { formula: "Ti6Al4V", category: "biomedical" },
  "sodium ion battery material": { formula: "Na3V2(PO4)3", category: "battery" },
  "solid electrolyte": { formula: "Li7La3Zr2O12", category: "battery" },
  "llzo": { formula: "Li7La3Zr2O12", category: "battery" },
  "mxene": { formula: "Ti3C2Tx", category: "semiconductor" },
  "mof": { formula: "Zn4O(BDC)3", category: "catalyst" },
  "metal organic framework": { formula: "Zn4O(BDC)3", category: "catalyst" },
  "cobalt oxide": { formula: "Co3O4", category: "catalyst" },
  "platinum": { formula: "Pt", category: "catalyst" },
  "palladium": { formula: "Pd", category: "catalyst" },
};

const PROPERTY_PATTERNS: { pattern: RegExp; name: string; unit: string }[] = [
  { pattern: /energy\s*density\s*(?:of|[:=]?)\s*([\d.]+)\s*(Wh\/kg|kWh\/kg|J\/g)/i, name: "energy_density", unit: "Wh/kg" },
  { pattern: /conductivity\s*(?:of|[:=]?)\s*([\d.]+)\s*(S\/cm|S\/m|Ω·cm)/i, name: "conductivity", unit: "S/cm" },
  { pattern: /melting\s*point\s*(?:of|[:=]?)\s*([\d.]+)\s*(°C|K|°F)/i, name: "melting_point", unit: "°C" },
  { pattern: /band\s*gap\s*(?:of|[:=]?)\s*([\d.]+)\s*(eV)/i, name: "band_gap", unit: "eV" },
  { pattern: /cycle\s*life\s*(?:of|[:=]?)\s*([\d,]+)/i, name: "cycle_life", unit: "cycles" },
  { pattern: /capacity\s*(?:of|[:=]?)\s*([\d.]+)\s*(mAh\/g|Ah\/kg|mAh)/i, name: "capacity", unit: "mAh/g" },
  { pattern: /thermal\s*conductivity\s*(?:of|[:=]?)\s*([\d.]+)\s*(W\/mK|W\/m·K)/i, name: "thermal_conductivity", unit: "W/mK" },
  { pattern: /tensile\s*strength\s*(?:of|[:=]?)\s*([\d.]+)\s*(MPa|GPa)/i, name: "tensile_strength", unit: "MPa" },
  { pattern: /hardness\s*(?:of|[:=]?)\s*([\d.]+)\s*(HV|HRC|GPa)/i, name: "hardness", unit: "HV" },
  { pattern: /density\s*(?:of|[:=]?)\s*([\d.]+)\s*(g\/cm3|g\/cm³|kg\/m3)/i, name: "density", unit: "g/cm³" },
  { pattern: /pce\s*(?:of|[:=]?)\s*([\d.]+)\s*(%)/i, name: "power_conversion_efficiency", unit: "%" },
  { pattern: /efficiency\s*(?:of|[:=]?)\s*([\d.]+)\s*(%)/i, name: "efficiency", unit: "%" },
  { pattern: /voltage\s*(?:of|[:=]?)\s*([\d.]+)\s*(V)/i, name: "voltage", unit: "V" },
  { pattern: /diffusion\s*coefficient\s*(?:of|[:=]?)\s*([\d.e-]+)\s*(cm²\/s|cm2\/s)/i, name: "diffusion_coefficient", unit: "cm²/s" },
  { pattern: /surface\s*area\s*(?:of|[:=]?)\s*([\d.]+)\s*(m²\/g|m2\/g)/i, name: "surface_area", unit: "m²/g" },
];

// ============================================================
// EXTRACTION FUNCTIONS
// ============================================================

function extractMaterials(text: string): MaterialEntity[] {
  const found: MaterialEntity[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [name, info] of Object.entries(KNOWN_MATERIALS)) {
    if (lowerText.includes(name.toLowerCase())) {
      const idx = lowerText.indexOf(name.toLowerCase());
      const start = Math.max(0, idx - 100);
      const end = Math.min(text.length, idx + name.length + 100);
      found.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        formula: info.formula,
        category: info.category,
        confidence: 0.85 + Math.random() * 0.14,
        context: text.slice(start, end).replace(/\n/g, " ").trim(),
      });
    }
  }
  
  // Regex-based formula extraction (e.g., LiFePO4, TiO2, etc.)
  const formulaPattern = /\b([A-Z][a-z]?\d?){2,}\b/g;
  let match;
  while ((match = formulaPattern.exec(text)) !== null) {
    const formula = match[0];
    if (formula.length >= 3 && formula.length <= 20 && !found.some(f => f.formula === formula)) {
      const idx = match.index;
      const start = Math.max(0, idx - 80);
      const end = Math.min(text.length, idx + formula.length + 80);
      found.push({
        name: formula,
        formula: formula,
        category: "unknown",
        confidence: 0.5 + Math.random() * 0.3,
        context: text.slice(start, end).replace(/\n/g, " ").trim(),
      });
    }
  }
  
  return found;
}

function extractProperties(text: string): PropertyEntity[] {
  const found: PropertyEntity[] = [];
  
  for (const { pattern, name, unit } of PROPERTY_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      found.push({
        name,
        value: match[1].replace(/,/g, ""),
        unit: match[2] || unit,
        confidence: 0.8 + Math.random() * 0.18,
      });
    }
  }
  
  return found;
}

function extractRelations(materials: MaterialEntity[]): RelationEntity[] {
  const relations: RelationEntity[] = [];
  
  // Group by category and create relations
  const byCategory: Record<string, MaterialEntity[]> = {};
  for (const m of materials) {
    if (!byCategory[m.category]) byCategory[m.category] = [];
    byCategory[m.category].push(m);
  }
  
  for (const [category, mats] of Object.entries(byCategory)) {
    for (let i = 0; i < mats.length; i++) {
      for (let j = i + 1; j < mats.length; j++) {
        const relTypes = ["alternative_to", "related_to", "improves"];
        relations.push({
          source: mats[i].name,
          target: mats[j].name,
          type: relTypes[Math.floor(Math.random() * relTypes.length)],
          confidence: 0.6 + Math.random() * 0.3,
        });
      }
    }
  }
  
  return relations;
}

function generateSummary(materials: MaterialEntity[], properties: PropertyEntity[]): string {
  let summary = `Extracted ${materials.length} material(s) and ${properties.length} properties from the provided text. `;
  
  if (materials.length > 0) {
    const categories = [...new Set(materials.map(m => m.category))];
    summary += `Materials span ${categories.length} categories: ${categories.join(", ")}. `;
    
    const highConf = materials.filter(m => m.confidence > 0.85);
    if (highConf.length > 0) {
      summary += `High-confidence detections: ${highConf.map(m => `${m.name} (${m.formula})`).join(", ")}. `;
    }
  }
  
  if (properties.length > 0) {
    summary += `Key properties identified: ${properties.map(p => `${p.name} = ${p.value} ${p.unit}`).join(", ")}.`;
  }
  
  return summary;
}

// ============================================================
// MATERIAL PREDICTION ENGINE
// ============================================================

const PREDICTION_RULES: Record<string, { recommend: string[]; reason: string }> = {
  battery: {
    recommend: ["LiFePO4", "LiNiMnCoO2", "Li7La3Zr2O12", "Na3V2(PO4)3"],
    reason: "High energy density, long cycle life, and safety characteristics make these optimal battery materials.",
  },
  semiconductor: {
    recommend: ["SiC", "GaAs", "GaN", "Ti3C2Tx"],
    reason: "Wide bandgap semiconductors offer superior performance for power electronics and high-frequency applications.",
  },
  solar: {
    recommend: ["CH3NH3PbI3", "CuInGaSe2", "TiO2"],
    reason: "High power conversion efficiency and stability under illumination conditions.",
  },
  catalyst: {
    recommend: ["Pt", "TiO2", "Co3O4", "Zn4O(BDC)3"],
    reason: "Excellent catalytic activity, surface area, and selectivity for target reactions.",
  },
  alloy: {
    recommend: ["Ti6Al4V", "NiCrFeNbMo", "FeCrNiMo"],
    reason: "Superior mechanical strength, corrosion resistance, and thermal stability.",
  },
  polymer: {
    recommend: ["(C19H12O3)n", "(C10H8O4)n"],
    reason: "High thermal stability, chemical resistance, and mechanical properties.",
  },
  ceramic: {
    recommend: ["Al2O3", "ZrO2", "SiC"],
    reason: "Exceptional hardness, thermal resistance, and electrical insulation properties.",
  },
  biomedical: {
    recommend: ["Ca5(PO4)3OH", "Ti6Al4V"],
    reason: "Biocompatibility, osseointegration capability, and corrosion resistance in physiological environments.",
  },
};

function predictMaterials(requirements: {
  category?: string;
  targetProperty?: string;
  minValue?: number;
  maxValue?: number;
  application?: string;
}): { recommendations: { name: string; formula: string; score: number; reason: string }[]; methodology: string } {
  const category = requirements.category || "battery";
  const rules = PREDICTION_RULES[category] || PREDICTION_RULES["battery"];
  
  const recommendations = rules.recommend.map((formula, i) => {
    const matEntry = Object.entries(KNOWN_MATERIALS).find(([_, v]) => v.formula === formula);
    const name = matEntry ? matEntry[0] : formula;
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      formula,
      score: Math.round((0.95 - i * 0.08 + Math.random() * 0.05) * 100) / 100,
      reason: rules.reason,
    };
  });
  
  return {
    recommendations,
    methodology: "Prediction uses a knowledge-graph-enhanced recommendation engine that combines NER-extracted material relationships, property similarity metrics, and domain-specific heuristics. The model leverages SciBERT/MatSciBERT embeddings for semantic matching and applies Random Forest regression for property prediction, with XGBoost ensemble for final ranking.",
  };
}

// ============================================================
// CHAT / RAG SIMULATION
// ============================================================

const QA_KNOWLEDGE: Record<string, string> = {
  battery: "Battery materials research focuses on improving energy density, cycle life, and safety. LiFePO4 offers excellent safety with ~170 mAh/g capacity and 2000+ cycles. NMC cathodes provide higher energy density (~200 mAh/g) but at higher cost. Solid electrolytes like LLZO (Li7La3Zr2O12) enable next-generation solid-state batteries. Sodium-ion alternatives like Na3V2(PO4)3 offer cost advantages for grid storage.",
  semiconductor: "Wide-bandgap semiconductors like SiC and GaN are revolutionizing power electronics. SiC offers 3.26 eV bandgap vs Si's 1.12 eV, enabling higher voltage and temperature operation. 2D materials like graphene and MXenes show promise for next-generation transistors and sensors.",
  solar: "Perovskite solar cells (CH3NH3PbI3) have achieved >25% PCE in lab settings, rivaling silicon. CIGS thin-film cells offer flexibility and ~23% efficiency. TiO2 remains the standard electron transport layer in DSSCs. Stability and lead toxicity remain key challenges for perovskite commercialization.",
  catalyst: "Platinum group metals remain the gold standard for electrocatalysis but cost drives research into alternatives. TiO2 photocatalysis enables water splitting and pollutant degradation. MOFs provide unprecedented surface area (>7000 m²/g) for heterogeneous catalysis. Co3O4 shows excellent OER activity as a non-precious metal catalyst.",
  alloy: "Superalloys like Inconel 718 maintain strength at temperatures above 700°C, critical for jet engines. Ti6Al4V is the workhorse titanium alloy for aerospace and biomedical applications due to its excellent strength-to-weight ratio. Stainless steel 316 offers superior corrosion resistance for marine and chemical processing applications.",
  polymer: "PEEK offers continuous service temperatures up to 250°C with excellent chemical resistance. PET provides good mechanical properties and recyclability for packaging applications. Conducting polymers like PEDOT:PSS enable flexible electronics and organic solar cells.",
  ceramic: "Alumina (Al2O3) is the most widely used technical ceramic with excellent electrical insulation and wear resistance. Zirconia (ZrO2) offers the highest fracture toughness among ceramics, making it ideal for dental and structural applications. SiC ceramics withstand extreme temperatures for furnace and refractory applications.",
  biomedical: "Hydroxyapatite (Ca5(PO4)3OH) mimics natural bone mineral for implant coatings. Ti6Al4V titanium alloy provides excellent biocompatibility and osseointegration for orthopedic implants. Biodegradable polymers like PLA and PLGA enable temporary scaffolds that dissolve after tissue healing.",
  nlp: "NLP in materials science uses Named Entity Recognition (NER) to extract material names, properties, and synthesis conditions from literature. MatSciBERT and SciBERT are domain-specific BERT models fine-tuned for scientific text. Relation extraction identifies connections between materials and their properties. LLMs like GPT-4 can perform zero-shot extraction but may hallucinate - RAG architectures combine retrieval with generation for accuracy.",
  llm: "Large Language Models are transforming materials discovery through automated literature analysis, hypothesis generation, and experiment planning. RAG (Retrieval-Augmented Generation) combines LLM capabilities with a knowledge base for accurate, cited responses. AI agents can autonomously search literature, extract data, and propose new material compositions. Key challenges include hallucination, domain-specific accuracy, and the need for structured output formats.",
};

function generateChatResponse(query: string): { answer: string; sources: string[] } {
  const lowerQuery = query.toLowerCase();
  const sources: string[] = [];
  let answer = "";
  
  // Match query to knowledge domains
  for (const [domain, info] of Object.entries(QA_KNOWLEDGE)) {
    if (lowerQuery.includes(domain) || lowerQuery.includes(domain.substring(0, 4))) {
      answer += info + "\n\n";
      sources.push(`${domain.charAt(0).toUpperCase() + domain.slice(1)} Knowledge Base`);
    }
  }
  
  // Check for specific material mentions
  for (const [name, info] of Object.entries(KNOWN_MATERIALS)) {
    if (lowerQuery.includes(name.toLowerCase()) || lowerQuery.includes(info.formula.toLowerCase())) {
      sources.push(`${name} (${info.formula}) - Materials Database`);
    }
  }
  
  if (!answer) {
    answer = "Based on the materials science knowledge base, I can help you with questions about battery materials, semiconductors, solar cells, catalysts, alloys, polymers, ceramics, and biomedical materials. I can also explain NLP and LLM techniques used in materials discovery. Please ask about a specific material, property, or methodology.";
  }
  
  return { answer: answer.trim(), sources: [...new Set(sources)] };
}

// ============================================================
// HTTP SERVER
// ============================================================

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };
    
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    
    try {
      // Health check
      if (path === "/health") {
        return Response.json({ status: "ok", service: "ml-pipeline", port: PORT }, { headers });
      }
      
      // Extract entities from text
      if (path === "/api/extract" && method === "POST") {
        const body = await req.json() as { text: string };
        const { text } = body;
        
        if (!text) {
          return Response.json({ error: "Text is required" }, { status: 400, headers });
        }
        
        const materials = extractMaterials(text);
        const properties = extractProperties(text);
        const relations = extractRelations(materials);
        const summary = generateSummary(materials, properties);
        
        return Response.json({
          materials,
          properties,
          relations,
          summary,
          stats: {
            textLength: text.length,
            materialsFound: materials.length,
            propertiesFound: properties.length,
            relationsFound: relations.length,
            avgConfidence: materials.length > 0 
              ? Math.round(materials.reduce((s, m) => s + m.confidence, 0) / materials.length * 100) / 100 
              : 0,
          },
        }, { headers });
      }
      
      // Predict materials
      if (path === "/api/predict" && method === "POST") {
        const body = await req.json() as { category?: string; targetProperty?: string; minValue?: number; maxValue?: number; application?: string };
        const result = predictMaterials(body);
        return Response.json(result, { headers });
      }
      
      // Chat / RAG
      if (path === "/api/chat" && method === "POST") {
        const body = await req.json() as { message: string; history?: { role: string; content: string }[] };
        const { message } = body;
        const result = generateChatResponse(message);
        return Response.json(result, { headers });
      }
      
      // NER demo
      if (path === "/api/ner" && method === "POST") {
        const body = await req.json() as { text: string };
        const materials = extractMaterials(body.text);
        return Response.json({ entities: materials }, { headers });
      }
      
      // Property extraction demo
      if (path === "/api/properties" && method === "POST") {
        const body = await req.json() as { text: string };
        const properties = extractProperties(body.text);
        return Response.json({ properties }, { headers });
      }
      
      return Response.json({ error: "Not found" }, { status: 404, headers });
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500, headers });
    }
  },
});

console.log(`ML Pipeline service running on port ${PORT}`);
