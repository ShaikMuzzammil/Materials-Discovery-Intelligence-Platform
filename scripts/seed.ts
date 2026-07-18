import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding MatDiscoverAI database...')

  // Clear existing data
  await prisma.chatMessage.deleteMany()
  await prisma.extractionJob.deleteMany()
  await prisma.knowledgeEdge.deleteMany()
  await prisma.extractedEntity.deleteMany()
  await prisma.materialProperty.deleteMany()
  await prisma.researchPaper.deleteMany()
  await prisma.material.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create Materials
  const materials = [
    {
      id: 'mat-001',
      name: 'Lithium Iron Phosphate',
      formula: 'LiFePO4',
      category: 'battery',
      description: 'High-performance cathode material for lithium-ion batteries with excellent thermal stability and safety characteristics. Widely used in electric vehicles and grid storage systems.',
      source: 'literature',
      confidence: 0.98,
      properties: {
        create: [
          { propertyName: 'energy_density', propertyValue: '170', unit: 'Wh/kg', source: 'experimental', confidence: 0.97 },
          { propertyName: 'conductivity', propertyValue: '1e-9', unit: 'S/cm', source: 'experimental', confidence: 0.95 },
          { propertyName: 'melting_point', propertyValue: '1080', unit: '°C', source: 'literature', confidence: 0.99 },
          { propertyName: 'band_gap', propertyValue: '3.8', unit: 'eV', source: 'calculated', confidence: 0.92 },
          { propertyName: 'theoretical_capacity', propertyValue: '170', unit: 'mAh/g', source: 'literature', confidence: 0.98 }
        ]
      }
    },
    {
      id: 'mat-002',
      name: 'Graphene Oxide',
      formula: 'C10O(OH)1',
      category: 'semiconductor',
      description: 'Two-dimensional carbon material with exceptional electronic properties. Used in flexible electronics, sensors, and energy storage applications.',
      source: 'extracted',
      confidence: 0.94,
      properties: {
        create: [
          { propertyName: 'conductivity', propertyValue: '1000', unit: 'S/m', source: 'experimental', confidence: 0.91 },
          { propertyName: 'surface_area', propertyValue: '2630', unit: 'm²/g', source: 'experimental', confidence: 0.96 },
          { propertyName: 'band_gap', propertyValue: '2.1-4.0', unit: 'eV', source: 'variable', confidence: 0.88 }
        ]
      }
    },
    {
      id: 'mat-003',
      name: 'Perovskite Solar Cell (MAPbI3)',
      formula: 'CH3NH3PbI3',
      category: 'solar',
      description: 'Hybrid organic-inorganic perovskite with remarkable photovoltaic efficiency exceeding 25%. Revolutionizing solar energy technology with low-cost fabrication.',
      source: 'literature',
      confidence: 0.96,
      properties: {
        create: [
          { propertyName: 'efficiency', propertyValue: '25.7', unit: '%', source: 'experimental', confidence: 0.95 },
          { propertyName: 'band_gap', propertyValue: '1.55', unit: 'eV', source: 'experimental', confidence: 0.97 },
          { propertyName: 'stability_t80', propertyValue: '>1000', unit: 'hours', source: 'accelerated', confidence: 0.85 }
        ]
      }
    },
    {
      id: 'mat-004',
      name: 'High-Entropy Alloy (CoCrFeMnNi)',
      formula: 'Co20Cr20Fe20Mn20Ni20',
      category: 'alloy',
      description: 'Cantor alloy with five principal elements in near-equiatomic proportions. Exceptional mechanical properties including high strength and ductility at cryogenic temperatures.',
      source: 'ml_predicted',
      confidence: 0.89,
      properties: {
        create: [
          { propertyName: 'yield_strength', propertyValue: '560', unit: 'MPa', source: 'experimental', confidence: 0.93 },
          { propertyName: 'ultimate_tensile_strength', propertyValue: '750', unit: 'MPa', source: 'experimental', confidence: 0.92 },
          { propertyName: 'elongation', propertyValue: '65', unit: '%', source: 'experimental', confidence: 0.94 }
        ]
      }
    },
    {
      id: 'mat-005',
      name: 'Metal-Organic Framework (MOF-5)',
      formula: 'Zn4O(BDC)3',
      category: 'catalyst',
      description: 'Porous material with extremely high surface area for gas storage and separation. Applications in hydrogen storage, carbon capture, and drug delivery.',
      source: 'literature',
      confidence: 0.97,
      properties: {
        create: [
          { propertyName: 'surface_area', propertyValue: '3800', unit: 'm²/g', source: 'BET', confidence: 0.96 },
          { propertyName: 'pore_volume', propertyValue: '1.2', unit: 'cm³/g', source: 'BET', confidence: 0.95 },
          { propertyName: 'hydrogen_uptake', propertyValue: '5.1', unit: 'wt%', source: 'experimental', confidence: 0.90 }
        ]
      }
    },
    {
      id: 'mat-006',
      name: 'Polyethylene Terephthalate (PET)',
      formula: '(C10H8O4)n',
      category: 'polymer',
      description: 'Thermoplastic polyester widely used in packaging, textiles, and engineering plastics. Recyclable and biocompatible variants available.',
      source: 'manual',
      confidence: 0.99,
      properties: {
        create: [
          { propertyName: 'glass_transition_temp', propertyValue: '75', unit: '°C', source: 'DSC', confidence: 0.99 },
          { propertyName: 'tensile_strength', propertyValue: '55', unit: 'MPa', source: 'ASTM', confidence: 0.98 },
          { propertyName: 'density', propertyValue: '1.38', unit: 'g/cm³', source: 'ASTM', confidence: 0.99 }
        ]
      }
    },
    {
      id: 'mat-007',
      name: 'Yttria-Stabilized Zirconia (YSZ)',
      formula: 'Zr0.92Y0.08O1.96',
      category: 'ceramic',
      description: 'Ionic conductor used in solid oxide fuel cells (SOFCs) and oxygen sensors. High oxygen ion conductivity at elevated temperatures.',
      source: 'literature',
      confidence: 0.95,
      properties: {
        create: [
          { propertyName: 'ionic_conductivity', propertyValue: '0.1', unit: 'S/cm', source: 'EIS', confidence: 0.93 },
          { propertyName: 'operating_temperature', propertyValue: '800-1000', unit: '°C', source: 'specification', confidence: 0.99 },
          { propertyName: 'fracture_toughness', propertyValue: '6', unit: 'MPa·m¹/²', source: 'experimental', confidence: 0.90 }
        ]
      }
    },
    {
      id: 'mat-008',
      name: 'Titanium Alloy (Ti-6Al-4V)',
      formula: 'Ti90Al6V4',
      category: 'biomedical',
      description: 'Biocompatible titanium alloy extensively used in orthopedic and dental implants. Excellent strength-to-weight ratio and corrosion resistance.',
      source: 'literature',
      confidence: 0.98,
      properties: {
        create: [
          { propertyName: 'yield_strength', propertyValue: '880', unit: 'MPa', source: 'ASTM', confidence: 0.97 },
          { propertyName: 'elastic_modulus', propertyValue: '114', unit: 'GPa', source: 'ASTM', confidence: 0.98 },
          { propertyName: 'biocompatibility', propertyValue: 'excellent', unit: '-', source: 'ISO 10993', confidence: 0.99 }
        ]
      }
    },
    {
      id: 'mat-009',
      name: 'Nickel-Manganese-Cobalt (NMC 811)',
      formula: 'LiNi0.8Mn0.1Co0.1O2',
      category: 'battery',
      description: 'Next-generation cathode material with high nickel content for increased energy density. Leading candidate for premium EV batteries.',
      source: 'ml_predicted',
      confidence: 0.91,
      properties: {
        create: [
          { propertyName: 'energy_density', propertyValue: '260', unit: 'Wh/kg', source: 'projected', confidence: 0.87 },
          { propertyName: 'cycle_life', propertyValue: '>1500', unit: 'cycles', source: 'testing', confidence: 0.85 },
          { propertyName: 'cobalt_content', propertyValue: '10', unit: '%', source: 'composition', confidence: 0.99 }
        ]
      }
    },
    {
      id: 'mat-010',
      name: 'Quantum Dot (CdSe/ZnS)',
      formula: 'CdSe/ZnS core-shell',
      category: 'semiconductor',
      description: 'Semiconductor nanocrystals with size-tunable optical properties. Applications in displays, bioimaging, and quantum computing.',
      source: 'extracted',
      confidence: 0.88,
      properties: {
        create: [
          { propertyName: 'quantum_yield', propertyValue: '85', unit: '%', source: 'PL', confidence: 0.89 },
          { propertyName: 'emission_wavelength', propertyValue: '520-650', unit: 'nm', source: 'tunable', confidence: 0.92 },
          { propertyName: 'size', propertyValue: '2-8', unit: 'nm', source: 'TEM', confidence: 0.94 }
        ]
      }
    }
  ]

  console.log('📦 Creating materials...')
  for (const mat of materials) {
    await prisma.material.create({ data: mat })
  }

  // Create Research Papers
  const papers = [
    {
      id: 'paper-001',
      title: 'Machine Learning Accelerated Discovery of High-Entropy Alloys with Optimal Mechanical Properties',
      authors: 'Zhang Y., Wang L., Chen M., Thompson G.B., Liu Z.',
      abstract: 'We present a machine learning framework combining Gaussian process regression with genetic algorithms to discover novel high-entropy alloys (HEAs). Our approach identified a new Co-Cr-Fe-Mn-Ni composition with unprecedented combination of yield strength (680 MPa) and ductility (70%) at room temperature.',
      year: 2024,
      doi: '10.1038/s41586-024-12345-6',
      journal: 'Nature',
      keywords: 'high-entropy alloys, machine learning, mechanical properties, materials discovery',
      status: 'extracted' as const,
      entities: {
        create: [
          { entityType: 'material', entityText: 'High-Entropy Alloy CoCrFeMnNi', confidence: 0.95, context: 'Main subject of study' },
          { entityType: 'property', entityText: 'yield_strength: 680 MPa', confidence: 0.92, context: 'Measured mechanical property' },
          { entityType: 'method', entityText: 'Gaussian Process Regression', confidence: 0.88, context: 'ML methodology used' }
        ]
      }
    },
    {
      id: 'paper-002',
      title: 'Breakthrough Efficiency in Perovskite Solar Cells Through Interface Engineering',
      authors: 'Kim S.H., Park J., Lee H., Green M.A., Snaith H.J.',
      abstract: 'A novel interface passivation strategy using 2D perovskite capping layers achieved certified power conversion efficiency of 26.1% for single-junction perovskite solar cells. The approach significantly improves operational stability under continuous illumination.',
      year: 2024,
      doi: '10.1126/science.abd5678',
      journal: 'Science',
      keywords: 'perovskite, solar cell, interface engineering, efficiency, stability',
      status: 'extracted' as const,
      entities: {
        create: [
          { entityType: 'material', entityText: 'Perovskite MAPbI3', confidence: 0.97, context: 'Primary photovoltaic material' },
          { entityType: 'property', entityText: 'efficiency: 26.1%', confidence: 0.96, context: 'Certified PCE result' },
          { entityType: 'method', entityText: 'Interface Passivation', confidence: 0.91, context: 'Key innovation technique' }
        ]
      }
    },
    {
      id: 'paper-003',
      title: 'Natural Language Processing for Automated Extraction of Materials Properties from Scientific Literature',
      authors: 'Tada K., Ishikawa R., Matsumoto S., Tanaka Y.',
      abstract: 'We developed an NLP pipeline using transformer-based models to automatically extract materials properties, synthesis conditions, and characterization data from over 500,000 scientific articles. The system achieves 94% accuracy in property-value extraction.',
      year: 2024,
      doi: '10.1016/j.commatsci.2024.111234',
      journal: 'Computational Materials Science',
      keywords: 'NLP, information extraction, materials science, text mining, transformers',
      status: 'extracted' as const,
      entities: {
        create: [
          { entityType: 'method', entityText: 'Transformer-based NLP', confidence: 0.93, context: 'Core technology' },
          { entityType: 'application', entityText: 'Property Extraction System', confidence: 0.90, context: 'System output' }
        ]
      }
    },
    {
      id: 'paper-004',
      title: 'Solid-State Electrolytes for Next-Generation Lithium Batteries: A Comprehensive Review',
      authors: 'Janek J., Zeier W.G.',
      abstract: 'This comprehensive review covers recent advances in solid-state electrolytes including garnets, sulfides, polymers, and composite systems. We analyze ionic conductivity, electrochemical stability window, and interfacial compatibility with electrode materials.',
      year: 2024,
      doi: '10.1021/acs.chemrev.4c00012',
      journal: 'Chemical Reviews',
      keywords: 'solid electrolyte, lithium battery, ionic conductivity, review',
      status: 'uploaded' as const
    },
    {
      id: 'paper-005',
      title: 'AI-Guided Discovery of Novel MOF Structures for Carbon Capture Applications',
      authors: 'Anderson R., Biong A., Gómez-Gualdrón P.E., Snurr R.Q.',
      abstract: 'Using generative AI models trained on existing MOF databases, we predicted 50 new metal-organic framework structures with superior CO2/N2 selectivity. Experimental validation confirmed three candidates with uptake capacities exceeding 4 mmol/g at 0.15 bar.',
      year: 2024,
      doi: '10.1038/s41467-024-45678-9',
      journal: 'Nature Communications',
      keywords: 'MOF, carbon capture, generative AI, molecular simulation',
      status: 'processing' as const,
      entities: {
        create: [
          { entityType: 'material', entityText: 'MOF-5 variant', confidence: 0.87, context: 'Predicted structure' },
          { entityType: 'property', entityText: 'CO2 uptake: >4 mmol/g', confidence: 0.84, context: 'Measured performance' }
        ]
      }
    },
    {
      id: 'paper-006',
      title: 'Large Language Models for Materials Science: Capabilities and Limitations',
      authors: 'Merchant A., Batzner S., Schoenholz S.S., Aykol M., Cheon G., Jain A.',
      abstract: 'We evaluate state-of-the-art LLMs on materials science tasks including property prediction, literature analysis, hypothesis generation, and experimental design. While showing promise, current models require domain-specific fine-tuning for reliable performance.',
      year: 2024,
      doi: '10.1021/acs.jpclett.4c00890',
      journal: 'J. Phys. Chem. Lett.',
      keywords: 'LLM, materials science, AI, large language model, benchmark',
      status: 'uploaded' as const
    }
  ]

  console.log('📄 Creating research papers...')
  for (const paper of papers) {
    await prisma.researchPaper.create({ data: paper })
  }

  // Create Knowledge Edges - Get actual material IDs first
  console.log('🔗 Creating knowledge edges...')
  
  const createdMaterials = await prisma.material.findMany({
    select: { id: true, name: true }
  })
  
  // Find materials by name pattern
  const getMaterialId = (namePattern: string): string => {
    const mat = createdMaterials.find(m => m.name.toLowerCase().includes(namePattern.toLowerCase()))
    return mat?.id || ''
  }
  
  const lfpId = getMaterialId('Lithium Iron')
  const perovskiteId = getMaterialId('Perovskite')
  const grapheneId = getMaterialId('Graphene')
  const heaId = getMaterialId('High-Entropy')
  const mofId = getMaterialId('MOF')

  if (lfpId && heaId) {
    await prisma.knowledgeEdge.create({ 
      data: { sourceEntityId: lfpId, targetEntityId: heaId, relationType: 'used_in', confidence: 0.85 } 
    })
  }
  if (perovskiteId && grapheneId) {
    await prisma.knowledgeEdge.create({ 
      data: { sourceEntityId: perovskiteId, targetEntityId: grapheneId, relationType: 'alternative_to', confidence: 0.78 } 
    })
  }
  if (heaId) {
    await prisma.knowledgeEdge.create({ 
      data: { sourceEntityId: heaId, targetEntityId: heaId, relationType: 'studied_in', confidence: 0.95 } 
    })
  }
  if (mofId) {
    await prisma.knowledgeEdge.create({ 
      data: { sourceEntityId: mofId, targetEntityId: mofId, relationType: 'related_to', confidence: 0.88 } 
    })
  }

  // Create Sample Chat Messages
  console.log('💬 Creating sample chat messages...')
  const chatMessages = [
    {
      role: 'system' as const,
      content: 'Welcome to MatDiscoverAI! I am your intelligent materials science assistant. How can I help you today?'
    },
    {
      role: 'user' as const,
      content: 'What are the best battery materials currently available?'
    },
    {
      role: 'assistant' as const,
      content: 'Based on our database, here are the top battery materials:\n\n1. **Lithium Iron Phosphate (LiFePO₄)** - Energy density: 170 Wh/kg, excellent thermal stability\n2. **NMC 811** - Next-gen cathode with 260 Wh/kg projected density\n3. **Solid-State Electrolytes** - Emerging technology for safer batteries\n\nWould you like detailed property comparisons or synthesis methods?',
      sources: JSON.stringify(['mat-001', 'mat-009'])
    }
  ]

  for (const msg of chatMessages) {
    await prisma.chatMessage.create({ data: msg })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`   📦 ${materials.length} materials created`)
  console.log(`   📄 ${papers.length} research papers created`)
  console.log(`   🔗 Knowledge edges created`)
  console.log(`   💬 ${chatMessages.length} chat messages created`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
