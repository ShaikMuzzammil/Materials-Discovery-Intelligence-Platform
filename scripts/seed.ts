import { db } from '../src/lib/db';

async function main() {
  console.log('Seeding database...\n');

  // Clean existing data
  await db.knowledgeEdge.deleteMany();
  await db.extractedEntity.deleteMany();
  await db.materialProperty.deleteMany();
  await db.material.deleteMany();
  await db.researchPaper.deleteMany();
  await db.chatMessage.deleteMany();
  await db.extractionJob.deleteMany();

  // ============================================================
  // MATERIALS
  // ============================================================
  console.log('Creating materials...');

  const materialsData = [
    // Battery materials
    {
      name: 'Lithium Iron Phosphate',
      formula: 'LiFePO4',
      category: 'battery',
      description: 'Olivine-structured cathode material known for excellent safety, long cycle life, and flat voltage profile. Widely used in electric vehicles and energy storage systems.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'energy_density', propertyValue: '170', unit: 'mAh/g', source: 'literature', confidence: 0.95 },
        { propertyName: 'cycle_life', propertyValue: '2000', unit: 'cycles', source: 'literature', confidence: 0.95 },
        { propertyName: 'voltage', propertyValue: '3.2', unit: 'V', source: 'literature', confidence: 0.98 },
        { propertyName: 'density', propertyValue: '3.6', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
      ],
    },
    {
      name: 'Lithium Cobalt Oxide',
      formula: 'LiCoO2',
      category: 'battery',
      description: 'Layered cathode material with high energy density, commonly used in consumer electronics. Limited by cobalt cost and cycle life.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'energy_density', propertyValue: '150', unit: 'mAh/g', source: 'literature', confidence: 0.95 },
        { propertyName: 'cycle_life', propertyValue: '1000', unit: 'cycles', source: 'literature', confidence: 0.9 },
        { propertyName: 'voltage', propertyValue: '3.7', unit: 'V', source: 'literature', confidence: 0.98 },
        { propertyName: 'density', propertyValue: '5.05', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
      ],
    },
    {
      name: 'NMC 811',
      formula: 'LiNi0.8Mn0.1Co0.1O2',
      category: 'battery',
      description: 'Nickel-rich layered cathode offering high energy density for next-generation EV batteries. Trade-offs include thermal stability and cycle life.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'energy_density', propertyValue: '200', unit: 'mAh/g', source: 'literature', confidence: 0.93 },
        { propertyName: 'cycle_life', propertyValue: '1500', unit: 'cycles', source: 'literature', confidence: 0.88 },
        { propertyName: 'voltage', propertyValue: '3.65', unit: 'V', source: 'literature', confidence: 0.95 },
        { propertyName: 'density', propertyValue: '4.85', unit: 'g/cm³', source: 'literature', confidence: 0.94 },
      ],
    },
    {
      name: 'Lithium Lanthanum Zirconium Oxide',
      formula: 'Li7La3Zr2O12',
      category: 'battery',
      description: 'Garnet-type solid-state electrolyte with high ionic conductivity and stability against lithium metal. Enables solid-state battery architectures.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'conductivity', propertyValue: '0.1', unit: 'mS/cm', source: 'literature', confidence: 0.92 },
        { propertyName: 'density', propertyValue: '5.1', unit: 'g/cm³', source: 'literature', confidence: 0.95 },
        { propertyName: 'voltage', propertyValue: '6', unit: 'V', source: 'literature', confidence: 0.85 },
      ],
    },
    {
      name: 'Sodium Vanadium Phosphate',
      formula: 'Na3V2(PO4)3',
      category: 'battery',
      description: 'NASICON-structured cathode for sodium-ion batteries. Offers cost advantages over lithium-ion counterparts with good rate capability.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'capacity', propertyValue: '117', unit: 'mAh/g', source: 'literature', confidence: 0.91 },
        { propertyName: 'voltage', propertyValue: '3.4', unit: 'V', source: 'literature', confidence: 0.93 },
        { propertyName: 'cycle_life', propertyValue: '3000', unit: 'cycles', source: 'literature', confidence: 0.85 },
      ],
    },
    {
      name: 'Lithium Titanate',
      formula: 'Li4Ti5O12',
      category: 'battery',
      description: 'Spinel-structured anode material with exceptional cycle life and safety. Zero-strain material ideal for high-power applications and grid storage.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'capacity', propertyValue: '175', unit: 'mAh/g', source: 'literature', confidence: 0.95 },
        { propertyName: 'cycle_life', propertyValue: '10000', unit: 'cycles', source: 'literature', confidence: 0.97 },
        { propertyName: 'voltage', propertyValue: '1.55', unit: 'V', source: 'literature', confidence: 0.98 },
      ],
    },

    // Semiconductor materials
    {
      name: 'Silicon Carbide',
      formula: 'SiC',
      category: 'semiconductor',
      description: 'Wide-bandgap semiconductor enabling high-efficiency power electronics. Revolutionizing EV inverters, RF devices, and high-temperature applications.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'band_gap', propertyValue: '3.26', unit: 'eV', source: 'literature', confidence: 0.99 },
        { propertyName: 'thermal_conductivity', propertyValue: '490', unit: 'W/mK', source: 'literature', confidence: 0.96 },
        { propertyName: 'melting_point', propertyValue: '2730', unit: '°C', source: 'literature', confidence: 0.97 },
        { propertyName: 'hardness', propertyValue: '2800', unit: 'HV', source: 'literature', confidence: 0.95 },
      ],
    },
    {
      name: 'Gallium Arsenide',
      formula: 'GaAs',
      category: 'semiconductor',
      description: 'III-V compound semiconductor with superior electron mobility. Essential for high-frequency RF, optoelectronics, and space-grade solar cells.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'band_gap', propertyValue: '1.42', unit: 'eV', source: 'literature', confidence: 0.99 },
        { propertyName: 'conductivity', propertyValue: '1000', unit: 'S/cm', source: 'literature', confidence: 0.9 },
        { propertyName: 'density', propertyValue: '5.32', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
      ],
    },
    {
      name: 'Graphene',
      formula: 'C',
      category: 'semiconductor',
      description: 'Single-layer carbon lattice with extraordinary electrical, thermal, and mechanical properties. Zero-bandgap semimetal with applications in electronics, composites, and energy storage.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'conductivity', propertyValue: '100000000', unit: 'S/m', source: 'literature', confidence: 0.93 },
        { propertyName: 'surface_area', propertyValue: '2630', unit: 'm²/g', source: 'literature', confidence: 0.96 },
        { propertyName: 'thermal_conductivity', propertyValue: '5000', unit: 'W/mK', source: 'literature', confidence: 0.92 },
        { propertyName: 'tensile_strength', propertyValue: '130000', unit: 'MPa', source: 'literature', confidence: 0.9 },
      ],
    },
    {
      name: 'Zinc Oxide',
      formula: 'ZnO',
      category: 'semiconductor',
      description: 'Wide-bandgap II-VI semiconductor with strong piezoelectric properties. Used in UV optoelectronics, sensors, piezoelectric generators, and transparent conductors.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'band_gap', propertyValue: '3.37', unit: 'eV', source: 'literature', confidence: 0.99 },
        { propertyName: 'density', propertyValue: '5.61', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
      ],
    },
    {
      name: 'Graphene Oxide',
      formula: 'CxOyHz',
      category: 'semiconductor',
      description: 'Oxidized form of graphene with tunable bandgap. Water-dispersible derivative enabling solution processing for flexible electronics and membrane applications.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'band_gap', propertyValue: '2.1', unit: 'eV', source: 'literature', confidence: 0.88 },
        { propertyName: 'surface_area', propertyValue: '800', unit: 'm²/g', source: 'literature', confidence: 0.85 },
      ],
    },
    {
      name: 'MXene Ti3C2Tx',
      formula: 'Ti3C2Tx',
      category: 'semiconductor',
      description: 'Two-dimensional transition metal carbide with metallic conductivity and hydrophilic surface. Promising for EMI shielding, energy storage, and sensors.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'conductivity', propertyValue: '4600', unit: 'S/cm', source: 'literature', confidence: 0.92 },
        { propertyName: 'surface_area', propertyValue: '280', unit: 'm²/g', source: 'literature', confidence: 0.88 },
      ],
    },

    // Solar materials
    {
      name: 'Methylammonium Lead Iodide',
      formula: 'CH3NH3PbI3',
      category: 'solar',
      description: 'Lead halide perovskite with exceptional photovoltaic performance. Achieved >25% PCE in lab settings, rivaling crystalline silicon.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'power_conversion_efficiency', propertyValue: '25.5', unit: '%', source: 'literature', confidence: 0.95 },
        { propertyName: 'band_gap', propertyValue: '1.55', unit: 'eV', source: 'literature', confidence: 0.97 },
        { propertyName: 'diffusion_coefficient', propertyValue: '1.5e-4', unit: 'cm²/s', source: 'literature', confidence: 0.82 },
      ],
    },
    {
      name: 'Copper Indium Gallium Selenide',
      formula: 'CuInGaSe2',
      category: 'solar',
      description: 'Thin-film photovoltaic material with high absorption coefficient and tunable bandgap. Offers flexibility and stable performance for building-integrated PV.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'power_conversion_efficiency', propertyValue: '23.35', unit: '%', source: 'literature', confidence: 0.94 },
        { propertyName: 'band_gap', propertyValue: '1.04', unit: 'eV', source: 'literature', confidence: 0.96 },
        { propertyName: 'density', propertyValue: '5.75', unit: 'g/cm³', source: 'literature', confidence: 0.93 },
      ],
    },

    // Catalyst materials
    {
      name: 'Titanium Dioxide',
      formula: 'TiO2',
      category: 'catalyst',
      description: 'Versatile photocatalyst and white pigment. Anatase form widely used in DSSCs, water splitting, self-cleaning surfaces, and air purification.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'surface_area', propertyValue: '50', unit: 'm²/g', source: 'literature', confidence: 0.9 },
        { propertyName: 'band_gap', propertyValue: '3.2', unit: 'eV', source: 'literature', confidence: 0.98 },
        { propertyName: 'density', propertyValue: '4.23', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
      ],
    },
    {
      name: 'Cobalt Oxide',
      formula: 'Co3O4',
      category: 'catalyst',
      description: 'Spin-structured transition metal oxide showing excellent OER activity. Non-precious metal catalyst alternative for water splitting and CO oxidation.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'surface_area', propertyValue: '45', unit: 'm²/g', source: 'literature', confidence: 0.88 },
        { propertyName: 'band_gap', propertyValue: '2.1', unit: 'eV', source: 'literature', confidence: 0.9 },
        { propertyName: 'density', propertyValue: '6.11', unit: 'g/cm³', source: 'literature', confidence: 0.95 },
      ],
    },
    {
      name: 'MOF-5',
      formula: 'Zn4O(BDC)3',
      category: 'catalyst',
      description: 'Iconic metal-organic framework with exceptional porosity and surface area. Pioneering material for gas storage, separation, and heterogeneous catalysis.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'surface_area', propertyValue: '3800', unit: 'm²/g', source: 'literature', confidence: 0.93 },
        { propertyName: 'density', propertyValue: '0.59', unit: 'g/cm³', source: 'literature', confidence: 0.9 },
      ],
    },
    {
      name: 'Platinum',
      formula: 'Pt',
      category: 'catalyst',
      description: 'Premier electrocatalyst for fuel cells and electrolysis. Gold standard for HER and ORR activity, though cost drives research for alternatives.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'conductivity', propertyValue: '9400000', unit: 'S/m', source: 'literature', confidence: 0.99 },
        { propertyName: 'density', propertyValue: '21.45', unit: 'g/cm³', source: 'literature', confidence: 0.99 },
        { propertyName: 'melting_point', propertyValue: '1768', unit: '°C', source: 'literature', confidence: 0.99 },
      ],
    },
    {
      name: 'Palladium',
      formula: 'Pd',
      category: 'catalyst',
      description: 'Key catalyst for cross-coupling reactions in organic synthesis. Essential for hydrogenation, C-C bond formation, and automotive catalytic converters.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'surface_area', propertyValue: '60', unit: 'm²/g', source: 'literature', confidence: 0.87 },
        { propertyName: 'density', propertyValue: '12.02', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
        { propertyName: 'melting_point', propertyValue: '1555', unit: '°C', source: 'literature', confidence: 0.98 },
      ],
    },

    // Ceramic materials
    {
      name: 'Alumina',
      formula: 'Al2O3',
      category: 'ceramic',
      description: 'Most widely used technical ceramic with excellent electrical insulation, wear resistance, and chemical stability. Found in electronics, cutting tools, and biomedical implants.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'melting_point', propertyValue: '2072', unit: '°C', source: 'literature', confidence: 0.99 },
        { propertyName: 'hardness', propertyValue: '2000', unit: 'HV', source: 'literature', confidence: 0.96 },
        { propertyName: 'density', propertyValue: '3.98', unit: 'g/cm³', source: 'literature', confidence: 0.98 },
        { propertyName: 'thermal_conductivity', propertyValue: '30', unit: 'W/mK', source: 'literature', confidence: 0.93 },
      ],
    },
    {
      name: 'Zirconia',
      formula: 'ZrO2',
      category: 'ceramic',
      description: 'Transformation-toughened ceramic with highest fracture toughness among ceramics. Ideal for dental crowns, joint replacements, and thermal barrier coatings.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'melting_point', propertyValue: '2715', unit: '°C', source: 'literature', confidence: 0.98 },
        { propertyName: 'hardness', propertyValue: '1200', unit: 'HV', source: 'literature', confidence: 0.94 },
        { propertyName: 'density', propertyValue: '5.68', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
        { propertyName: 'thermal_conductivity', propertyValue: '2.5', unit: 'W/mK', source: 'literature', confidence: 0.92 },
      ],
    },

    // Biomedical materials
    {
      name: 'Titanium Alloy Ti6Al4V',
      formula: 'Ti6Al4V',
      category: 'biomedical',
      description: 'Workhorse titanium alloy for aerospace and biomedical implants. Excellent biocompatibility, osseointegration, and corrosion resistance in physiological environments.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'tensile_strength', propertyValue: '950', unit: 'MPa', source: 'literature', confidence: 0.97 },
        { propertyName: 'density', propertyValue: '4.43', unit: 'g/cm³', source: 'literature', confidence: 0.98 },
        { propertyName: 'melting_point', propertyValue: '1660', unit: '°C', source: 'literature', confidence: 0.97 },
      ],
    },
    {
      name: 'Hydroxyapatite',
      formula: 'Ca5(PO4)3OH',
      category: 'biomedical',
      description: 'Naturally occurring mineral form of calcium apatite. Mimics bone mineral for implant coatings, bone grafts, and dental applications.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'density', propertyValue: '3.16', unit: 'g/cm³', source: 'literature', confidence: 0.96 },
        { propertyName: 'hardness', propertyValue: '500', unit: 'HV', source: 'literature', confidence: 0.9 },
        { propertyName: 'melting_point', propertyValue: '1650', unit: '°C', source: 'literature', confidence: 0.93 },
      ],
    },

    // Alloy materials
    {
      name: 'Inconel 718',
      formula: 'NiCrFeNbMo',
      category: 'alloy',
      description: 'Nickel-based superalloy maintaining strength at temperatures above 700°C. Critical for jet engines, gas turbines, and nuclear applications.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'tensile_strength', propertyValue: '1240', unit: 'MPa', source: 'literature', confidence: 0.96 },
        { propertyName: 'melting_point', propertyValue: '1336', unit: '°C', source: 'literature', confidence: 0.97 },
        { propertyName: 'density', propertyValue: '8.19', unit: 'g/cm³', source: 'literature', confidence: 0.98 },
      ],
    },
    {
      name: 'Stainless Steel 316',
      formula: 'FeCrNiMo',
      category: 'alloy',
      description: 'Austenitic stainless steel with superior corrosion resistance. Standard for marine, chemical processing, food equipment, and biomedical devices.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'tensile_strength', propertyValue: '580', unit: 'MPa', source: 'literature', confidence: 0.97 },
        { propertyName: 'density', propertyValue: '8.0', unit: 'g/cm³', source: 'literature', confidence: 0.98 },
        { propertyName: 'melting_point', propertyValue: '1400', unit: '°C', source: 'literature', confidence: 0.96 },
      ],
    },
    {
      name: 'Lanthanum Nickel',
      formula: 'LaNi5',
      category: 'alloy',
      description: 'Intermetallic compound for hydrogen storage applications. AB5-type alloy capable of reversible hydrogen absorption at near-ambient conditions.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'capacity', propertyValue: '370', unit: 'mAh/g', source: 'literature', confidence: 0.9 },
        { propertyName: 'density', propertyValue: '7.95', unit: 'g/cm³', source: 'literature', confidence: 0.93 },
      ],
    },

    // Polymer materials
    {
      name: 'PEEK',
      formula: '(C19H12O3)n',
      category: 'polymer',
      description: 'Semi-crystalline thermoplastic with exceptional thermal and chemical resistance. Used in aerospace, medical implants, and high-performance engineering.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'melting_point', propertyValue: '343', unit: '°C', source: 'literature', confidence: 0.98 },
        { propertyName: 'tensile_strength', propertyValue: '100', unit: 'MPa', source: 'literature', confidence: 0.95 },
        { propertyName: 'density', propertyValue: '1.32', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
      ],
    },
    {
      name: 'PET',
      formula: '(C10H8O4)n',
      category: 'polymer',
      description: 'Widely-used thermoplastic polyester for packaging, fibers, and engineering applications. Good mechanical properties and recyclability.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'melting_point', propertyValue: '260', unit: '°C', source: 'literature', confidence: 0.98 },
        { propertyName: 'density', propertyValue: '1.38', unit: 'g/cm³', source: 'literature', confidence: 0.98 },
        { propertyName: 'tensile_strength', propertyValue: '55', unit: 'MPa', source: 'literature', confidence: 0.93 },
      ],
    },

    // Additional materials for 30+
    {
      name: 'Gallium Nitride',
      formula: 'GaN',
      category: 'semiconductor',
      description: 'Wide-bandgap III-V semiconductor for high-electron-mobility transistors (HEMTs). Enabling 5G infrastructure, fast chargers, and RF power amplifiers.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'band_gap', propertyValue: '3.4', unit: 'eV', source: 'literature', confidence: 0.99 },
        { propertyName: 'thermal_conductivity', propertyValue: '130', unit: 'W/mK', source: 'literature', confidence: 0.93 },
        { propertyName: 'melting_point', propertyValue: '2500', unit: '°C', source: 'literature', confidence: 0.92 },
      ],
    },
    {
      name: 'Silicon',
      formula: 'Si',
      category: 'semiconductor',
      description: 'Foundation of the semiconductor industry. Dominant material for integrated circuits, solar cells, and MEMS devices.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'band_gap', propertyValue: '1.12', unit: 'eV', source: 'literature', confidence: 0.99 },
        { propertyName: 'thermal_conductivity', propertyValue: '149', unit: 'W/mK', source: 'literature', confidence: 0.97 },
        { propertyName: 'melting_point', propertyValue: '1414', unit: '°C', source: 'literature', confidence: 0.99 },
        { propertyName: 'density', propertyValue: '2.33', unit: 'g/cm³', source: 'literature', confidence: 0.99 },
      ],
    },
    {
      name: 'Polyaniline',
      formula: '(C6H4NH)n',
      category: 'polymer',
      description: 'Conducting polymer with tunable conductivity via protonation. Applications in corrosion protection, sensors, supercapacitors, and antistatic coatings.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'conductivity', propertyValue: '10', unit: 'S/cm', source: 'literature', confidence: 0.85 },
        { propertyName: 'density', propertyValue: '1.33', unit: 'g/cm³', source: 'literature', confidence: 0.9 },
      ],
    },
    {
      name: 'Silicon Nitride',
      formula: 'Si3N4',
      category: 'ceramic',
      description: 'High-performance ceramic with excellent fracture toughness and thermal shock resistance. Used in bearings, cutting tools, and engine components.',
      source: 'manual',
      confidence: 1.0,
      properties: [
        { propertyName: 'melting_point', propertyValue: '1900', unit: '°C', source: 'literature', confidence: 0.96 },
        { propertyName: 'hardness', propertyValue: '1400', unit: 'HV', source: 'literature', confidence: 0.93 },
        { propertyName: 'density', propertyValue: '3.19', unit: 'g/cm³', source: 'literature', confidence: 0.97 },
        { propertyName: 'thermal_conductivity', propertyValue: '28', unit: 'W/mK', source: 'literature', confidence: 0.9 },
      ],
    },
    {
      name: 'Cobalt Nanoparticles',
      formula: 'Co',
      category: 'catalyst',
      description: 'Fischer-Tropsch catalyst converting syngas to hydrocarbons. Also used in magnetic recording, biomedical imaging, and environmental remediation.',
      source: 'manual',
      confidence: 0.95,
      properties: [
        { propertyName: 'surface_area', propertyValue: '35', unit: 'm²/g', source: 'literature', confidence: 0.82 },
        { propertyName: 'density', propertyValue: '8.9', unit: 'g/cm³', source: 'literature', confidence: 0.96 },
        { propertyName: 'melting_point', propertyValue: '1495', unit: '°C', source: 'literature', confidence: 0.97 },
      ],
    },
  ];

  // Create materials with their properties
  const materialIds: Record<string, string> = {};
  let totalProperties = 0;

  for (const matData of materialsData) {
    const { properties, ...matFields } = matData;
    const material = await db.material.create({
      data: {
        ...matFields,
        properties: {
          create: properties,
        },
      },
    });
    materialIds[matData.formula] = material.id;
    totalProperties += properties.length;
    console.log(`  Created: ${matData.name} (${matData.formula}) - ${matData.category}`);
  }

  console.log(`\nCreated ${materialsData.length} materials with ${totalProperties} properties.\n`);

  // ============================================================
  // RESEARCH PAPERS
  // ============================================================
  console.log('Creating research papers...');

  const papersData = [
    {
      title: 'Applications of Natural Language Processing and Large Language Models in Materials Discovery',
      authors: 'Jiang, Y.; Yang, M.; Wang, S.',
      abstract: 'This review comprehensively surveys the application of NLP and LLMs in materials science, covering named entity recognition for material-property extraction, relation extraction for knowledge graph construction, and generative models for hypothesis generation. We discuss challenges including domain-specific terminology, data scarcity, and model hallucination, and propose future directions for retrieval-augmented generation and autonomous materials discovery agents.',
      year: 2025,
      doi: '10.1038/s41524-025-01234-5',
      journal: 'npj Computational Materials',
      keywords: 'NLP, LLM, materials discovery, knowledge extraction, NER',
      status: 'extracted',
    },
    {
      title: 'Machine Learning Assisted Battery Material Discovery',
      authors: 'Chen, L.; Zhang, X.; Li, W.; Liu, Y.',
      abstract: 'We present a machine learning framework for accelerating the discovery of novel battery materials. Using a combination of density functional theory calculations and gradient boosting regression, we predict cathode material properties including voltage, capacity, and stability. Our model identifies 12 promising candidates from a search space of over 10,000 compositions, with 8 subsequently validated experimentally.',
      year: 2024,
      doi: '10.1016/j.jpowsour.2024.234567',
      journal: 'Journal of Power Sources',
      keywords: 'machine learning, battery materials, DFT, cathode discovery',
      status: 'extracted',
    },
    {
      title: 'SciBERT: Pretrained Language Model for Scientific Text',
      authors: 'Beltagy, I.; Lo, K.; Cohan, A.',
      abstract: 'We introduce SciBERT, a BERT model trained on scientific text from Semantic Scholar. SciBERT shows significant improvements over BERT on a range of scientific NLP tasks including named entity recognition, relation extraction, and document classification. Our analysis shows that domain-specific pretraining is critical for scientific text understanding.',
      year: 2019,
      doi: '10.18653/v1/D19-1371',
      journal: 'EMNLP 2019',
      keywords: 'SciBERT, pretrained model, scientific text, NER',
      status: 'extracted',
    },
    {
      title: 'MatSciBERT: Materials Science Language Model',
      authors: 'Gupta, T.; Zaki, M.; Krishnan, N.M.A.',
      abstract: 'MatSciBERT is a domain-specific BERT model fine-tuned on a large corpus of materials science literature. We demonstrate state-of-the-art performance on materials NER, relation extraction, and abstract classification tasks. The model captures materials-specific syntactic and semantic patterns that general-purpose models miss.',
      year: 2022,
      doi: '10.1038/s41524-022-00791-w',
      journal: 'npj Computational Materials',
      keywords: 'MatSciBERT, materials science, language model, NER',
      status: 'extracted',
    },
    {
      title: 'Graph Neural Networks for Molecular Property Prediction',
      authors: 'Gilmer, J.; Schoenholz, S.S.; Riley, P.F.; Vinyals, O.; Dahl, G.E.',
      abstract: 'We present a unified framework for molecular property prediction using message-passing neural networks (MPNNs). Our approach operates directly on molecular graphs and achieves competitive results on quantum chemistry benchmarks including QM9 and MD17. We analyze the effect of different message-passing schemes on prediction accuracy.',
      year: 2020,
      doi: '10.48550/arXiv.1704.01212',
      journal: 'ICML 2017',
      keywords: 'graph neural networks, molecular property prediction, MPNN',
      status: 'extracted',
    },
    {
      title: 'Deep Learning for Perovskite Solar Cell Optimization',
      authors: 'Sun, Q.; Wang, T.; Zhang, H.; Liu, J.',
      abstract: 'We apply deep learning to optimize perovskite solar cell compositions and processing conditions. Using a variational autoencoder combined with Bayesian optimization, we explore the composition space of mixed-halide perovskites and predict power conversion efficiency with R² = 0.94. Our framework identifies compositions achieving >26% predicted PCE.',
      year: 2023,
      doi: '10.1021/acs.energyfuels.3c01234',
      journal: 'Energy & Fuels',
      keywords: 'deep learning, perovskite, solar cell, optimization',
      status: 'extracted',
    },
    {
      title: 'Automated Knowledge Graph Construction from Materials Literature',
      authors: 'Weston, L.; Tshitoyan, V.; Dagdelen, J.; Kononova, O.; Jain, A.; Persson, K.; Ceder, G.',
      abstract: 'We present an automated pipeline for constructing materials science knowledge graphs from scientific literature. Using NER and relation extraction models, we process over 3 million materials science abstracts to extract material-property-method relationships. The resulting knowledge graph enables material recommendation and property prediction.',
      year: 2023,
      doi: '10.1038/s41586-023-05678-9',
      journal: 'Nature',
      keywords: 'knowledge graph, NER, relation extraction, materials literature',
      status: 'extracted',
    },
    {
      title: 'Transformer-Based Prediction of Material Properties',
      authors: 'Merchant, A.; Batzner, S.; Schoenholz, S.S.; Aykol, M.; Cheon, G.; Cubuk, E.D.',
      abstract: 'We demonstrate that transformer architectures can learn accurate models of material properties from crystal structure representations alone. Our model, trained on Materials Project data, achieves state-of-the-art accuracy for formation energy, bandgap, and bulk modulus prediction without explicit feature engineering.',
      year: 2023,
      doi: '10.1126/science.ade1234',
      journal: 'Science',
      keywords: 'transformer, material properties, crystal structure, prediction',
      status: 'extracted',
    },
    {
      title: 'RAG-Enhanced LLM for Scientific Knowledge Discovery',
      authors: 'Lewis, P.; Perez, E.; Piktus, A.; Petroni, F.; Karpukhin, V.; Goyal, N.; Kiela, D.',
      abstract: 'We present Retrieval-Augmented Generation (RAG) models that combine pre-trained parametric memory with non-parametric memory for knowledge-intensive NLP tasks. Applied to scientific literature, RAG models reduce hallucination and provide verifiable citations, enabling more reliable scientific question answering and knowledge extraction.',
      year: 2021,
      doi: '10.5555/3495724.3496524',
      journal: 'NeurIPS 2020',
      keywords: 'RAG, retrieval-augmented, LLM, knowledge discovery',
      status: 'extracted',
    },
    {
      title: 'Solid-State Electrolyte Discovery Using Machine Learning',
      authors: 'Sendek, A.D.; Yang, K.; Nazar, L.F.; Reed, E.J.',
      abstract: 'We apply machine learning to accelerate the discovery of solid-state electrolytes for lithium batteries. Training on computed ionic conductivities from DFT molecular dynamics, our model screens over 12,000 candidate materials and identifies 21 promising solid electrolytes, including 10 with conductivities exceeding 1 mS/cm.',
      year: 2020,
      doi: '10.1021/acs.chemmater.0b01234',
      journal: 'Chemistry of Materials',
      keywords: 'solid-state electrolyte, machine learning, ionic conductivity, battery',
      status: 'extracted',
    },
  ];

  const paperIds: Record<string, string> = {};

  for (const paperData of papersData) {
    const paper = await db.researchPaper.create({
      data: paperData,
    });
    paperIds[paperData.title.substring(0, 30)] = paper.id;
    console.log(`  Created: "${paperData.title.substring(0, 60)}..." (${paperData.year})`);
  }

  console.log(`\nCreated ${papersData.length} research papers.\n`);

  // ============================================================
  // KNOWLEDGE EDGES
  // ============================================================
  console.log('Creating knowledge edges...');

  const edgesData = [
    // Battery material alternatives
    { sourceFormula: 'LiFePO4', targetFormula: 'LiCoO2', relationType: 'alternative_to', confidence: 0.92 },
    { sourceFormula: 'LiFePO4', targetFormula: 'LiNi0.8Mn0.1Co0.1O2', relationType: 'alternative_to', confidence: 0.88 },
    { sourceFormula: 'LiCoO2', targetFormula: 'LiNi0.8Mn0.1Co0.1O2', relationType: 'alternative_to', confidence: 0.9 },

    // Battery improvement relationships
    { sourceFormula: 'LiFePO4', targetFormula: 'Li4Ti5O12', relationType: 'improves', confidence: 0.85 },
    { sourceFormula: 'Li7La3Zr2O12', targetFormula: 'LiFePO4', relationType: 'improves', confidence: 0.87 },

    // Solid-state battery chain
    { sourceFormula: 'Li7La3Zr2O12', targetFormula: 'LiCoO2', relationType: 'improves', confidence: 0.85 },
    { sourceFormula: 'Na3V2(PO4)3', targetFormula: 'LiFePO4', relationType: 'alternative_to', confidence: 0.82 },

    // Graphene family
    { sourceFormula: 'C', targetFormula: 'CxOyHz', relationType: 'related_to', confidence: 0.95 },
    { sourceFormula: 'C', targetFormula: 'Ti3C2Tx', relationType: 'related_to', confidence: 0.78 },

    // Semiconductor relations
    { sourceFormula: 'SiC', targetFormula: 'GaN', relationType: 'alternative_to', confidence: 0.9 },
    { sourceFormula: 'Si', targetFormula: 'SiC', relationType: 'improves', confidence: 0.88 },
    { sourceFormula: 'Si', targetFormula: 'GaAs', relationType: 'alternative_to', confidence: 0.85 },
    { sourceFormula: 'SiC', targetFormula: 'ZnO', relationType: 'related_to', confidence: 0.75 },

    // Solar material relations
    { sourceFormula: 'CH3NH3PbI3', targetFormula: 'CuInGaSe2', relationType: 'alternative_to', confidence: 0.87 },
    { sourceFormula: 'TiO2', targetFormula: 'CH3NH3PbI3', relationType: 'used_in', confidence: 0.9 },

    // Catalyst relations
    { sourceFormula: 'Pt', targetFormula: 'Pd', relationType: 'alternative_to', confidence: 0.88 },
    { sourceFormula: 'Co3O4', targetFormula: 'Pt', relationType: 'alternative_to', confidence: 0.72 },
    { sourceFormula: 'Zn4O(BDC)3', targetFormula: 'Co3O4', relationType: 'related_to', confidence: 0.65 },

    // Ceramic relations
    { sourceFormula: 'Al2O3', targetFormula: 'ZrO2', relationType: 'alternative_to', confidence: 0.83 },
    { sourceFormula: 'Si3N4', targetFormula: 'Al2O3', relationType: 'alternative_to', confidence: 0.8 },

    // Biomedical relations
    { sourceFormula: 'Ti6Al4V', targetFormula: 'Ca5(PO4)3OH', relationType: 'related_to', confidence: 0.9 },

    // Alloy relations
    { sourceFormula: 'NiCrFeNbMo', targetFormula: 'FeCrNiMo', relationType: 'alternative_to', confidence: 0.82 },
    { sourceFormula: 'LaNi5', targetFormula: 'LiFePO4', relationType: 'related_to', confidence: 0.68 },

    // Cross-category: SiC is both semiconductor and ceramic
    { sourceFormula: 'SiC', targetFormula: 'Al2O3', relationType: 'related_to', confidence: 0.8 },

    // Graphene-battery connection
    { sourceFormula: 'C', targetFormula: 'LiFePO4', relationType: 'improves', confidence: 0.82 },

    // Polymer-biomedical
    { sourceFormula: '(C19H12O3)n', targetFormula: 'Ti6Al4V', relationType: 'alternative_to', confidence: 0.65 },
  ];

  let edgesCreated = 0;
  for (const edgeData of edgesData) {
    const sourceId = materialIds[edgeData.sourceFormula];
    const targetId = materialIds[edgeData.targetFormula];
    if (sourceId && targetId) {
      await db.knowledgeEdge.create({
        data: {
          sourceEntityId: sourceId,
          targetEntityId: targetId,
          relationType: edgeData.relationType,
          confidence: edgeData.confidence,
        },
      });
      edgesCreated++;
      console.log(`  Edge: ${edgeData.sourceFormula} --[${edgeData.relationType}]--> ${edgeData.targetFormula}`);
    } else {
      console.log(`  SKIPPED: ${edgeData.sourceFormula} -> ${edgeData.targetFormula} (missing material)`);
    }
  }

  console.log(`\nCreated ${edgesCreated} knowledge edges.\n`);

  // ============================================================
  // EXTRACTED ENTITIES (link papers to materials)
  // ============================================================
  console.log('Creating extracted entities...');

  const paperList = await db.researchPaper.findMany();
  const materialList = await db.material.findMany();

  // Create some entities linking papers to materials
  const entityCreations = [
    { paperIdx: 0, materialIdx: 0, entityType: 'material', entityText: 'LiFePO4', confidence: 0.95, context: 'LiFePO4 is discussed as a key cathode material in NLP-extracted knowledge bases.' },
    { paperIdx: 0, materialIdx: 6, entityType: 'material', entityText: 'Graphene', confidence: 0.9, context: 'Graphene properties are commonly extracted from materials literature using NER.' },
    { paperIdx: 1, materialIdx: 0, entityType: 'material', entityText: 'LiFePO4', confidence: 0.96, context: 'ML-assisted discovery of LiFePO4 cathode improvements.' },
    { paperIdx: 1, materialIdx: 3, entityType: 'material', entityText: 'LLZO', confidence: 0.92, context: 'Solid-state electrolyte LLZO predicted by ML models.' },
    { paperIdx: 5, materialIdx: 12, entityType: 'material', entityText: 'CH3NH3PbI3', confidence: 0.98, context: 'Perovskite solar cell optimization using deep learning.' },
    { paperIdx: 6, materialIdx: 14, entityType: 'method', entityText: 'NER', confidence: 0.93, context: 'Named Entity Recognition for automated knowledge graph construction.' },
    { paperIdx: 9, materialIdx: 3, entityType: 'material', entityText: 'LLZO', confidence: 0.97, context: 'LLZO identified as promising solid-state electrolyte via ML screening.' },
    { paperIdx: 2, materialIdx: 6, entityType: 'method', entityText: 'SciBERT', confidence: 0.99, context: 'SciBERT pretrained on scientific text for NER tasks.' },
    { paperIdx: 3, materialIdx: 6, entityType: 'method', entityText: 'MatSciBERT', confidence: 0.99, context: 'MatSciBERT fine-tuned for materials science NER.' },
    { paperIdx: 7, materialIdx: 7, entityType: 'method', entityText: 'Transformer', confidence: 0.95, context: 'Transformer architecture for predicting material properties from crystal structures.' },
  ];

  let entitiesCreated = 0;
  for (const ec of entityCreations) {
    if (paperList[ec.paperIdx] && materialList[ec.materialIdx]) {
      await db.extractedEntity.create({
        data: {
          paperId: paperList[ec.paperIdx].id,
          materialId: materialList[ec.materialIdx].id,
          entityType: ec.entityType,
          entityText: ec.entityText,
          confidence: ec.confidence,
          context: ec.context,
        },
      });
      entitiesCreated++;
    }
  }

  console.log(`Created ${entitiesCreated} extracted entities.\n`);

  // ============================================================
  // SUMMARY
  // ============================================================
  const finalCounts = {
    materials: await db.material.count(),
    properties: await db.materialProperty.count(),
    papers: await db.researchPaper.count(),
    entities: await db.extractedEntity.count(),
    edges: await db.knowledgeEdge.count(),
  };

  console.log('='.repeat(50));
  console.log('SEED COMPLETE - Database Summary');
  console.log('='.repeat(50));
  console.log(`Materials:        ${finalCounts.materials}`);
  console.log(`Properties:       ${finalCounts.properties}`);
  console.log(`Research Papers:  ${finalCounts.papers}`);
  console.log(`Extracted Entities: ${finalCounts.entities}`);
  console.log(`Knowledge Edges:  ${finalCounts.edges}`);
  console.log('='.repeat(50));

  await db.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
