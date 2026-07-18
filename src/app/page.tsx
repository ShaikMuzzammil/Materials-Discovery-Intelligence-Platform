'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ScatterChart, Scatter, Treemap } from 'recharts'
import {
  Atom, BookOpen, Brain, Database, FileText, FlaskConical, Github,
  MessageSquare, Network, Search, Sparkles, TrendingUp, Upload,
  Zap, ChevronRight, ExternalLink, Layers, Beaker, Shield,
  Activity, Target, ArrowRight, Send, Loader2, CheckCircle2,
  AlertCircle, Info, X, Cpu, Globe, Lightbulb, BarChart3,
  GitBranch, Eye, Bot, Thermometer, Gauge, CircuitBoard,
  Microscope, TestTube, Dna, Waves, Atom as AtomIcon,
  Calendar, Download, Filter, Star, Link2, Users,
  Award, Clock, MapPin, ChevronDown, ChevronUp,
  RefreshCw, Plus, Minus, Maximize2, Grid3X3,
  PieChart as PieChartIcon, TrendingDown, Hash,
  FileSearch, BrainCircuit, ScanText, Layers3,
  Rocket, CircleDot, Hexagon, Box, Package
} from 'lucide-react'

// ============================================================
// TYPES & INTERFACES
// ============================================================

interface Material {
  id: string
  name: string
  formula: string
  category: string
  description: string
  source: string
  confidence: number
  createdAt: string
  properties: MaterialProperty[]
}

interface MaterialProperty {
  id: string
  materialId: string
  propertyName: string
  propertyValue: string
  unit: string
  temperature?: string
  pressure?: string
  source: string
  confidence: number
}

interface ResearchPaper {
  id: string
  title: string
  authors: string
  abstract: string
  year: number
  doi?: string
  journal?: string
  filePath?: string
  keywords?: string
  status: string
  createdAt: string
  entities?: ExtractedEntity[]
}

interface ExtractedEntity {
  id: string
  paperId?: string
  materialId?: string
  entityType: string
  entityText: string
  confidence: number
  context?: string
}

interface KnowledgeEdge {
  id: string
  sourceEntityId: string
  targetEntityId: string
  relationType: string
  confidence: number
  paperId?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: string
  createdAt: string
}

interface DashboardStats {
  totalMaterials: number
  totalPapers: number
  totalEntities: number
  totalRelations: number
  materialsByCategory: { name: string; value: number; color: string }[]
  papersByYear: { year: number; count: number }[]
  recentActivity: { date: string; action: string; type: string }[]
  topMaterials: { name: string; properties: number; citations: number }[]
  predictionAccuracy: number
  extractionRate: number
}

// ============================================================
// MOCK DATA - Comprehensive realistic dataset
// ============================================================

const mockMaterials: Material[] = [
  {
    id: 'mat-001',
    name: 'Lithium Iron Phosphate',
    formula: 'LiFePO₄',
    category: 'battery',
    description: 'High-performance cathode material for lithium-ion batteries with excellent thermal stability and safety characteristics. Widely used in electric vehicles and grid storage systems.',
    source: 'literature',
    confidence: 0.98,
    createdAt: '2024-01-15T10:30:00Z',
    properties: [
      { id: 'p1', materialId: 'mat-001', propertyName: 'energy_density', propertyValue: '170', unit: 'Wh/kg', source: 'experimental', confidence: 0.97 },
      { id: 'p2', materialId: 'mat-001', propertyName: 'conductivity', propertyValue: '10⁻⁹', unit: 'S/cm', source: 'experimental', confidence: 0.95 },
      { id: 'p3', materialId: 'mat-001', propertyName: 'melting_point', propertyValue: '1080', unit: '°C', source: 'literature', confidence: 0.99 },
      { id: 'p4', materialId: 'mat-001', propertyName: 'band_gap', propertyValue: '3.8', unit: 'eV', source: 'calculated', confidence: 0.92 },
      { id: 'p5', materialId: 'mat-001', propertyName: 'theoretical_capacity', propertyValue: '170', unit: 'mAh/g', source: 'literature', confidence: 0.98 }
    ]
  },
  {
    id: 'mat-002',
    name: 'Graphene Oxide',
    formula: 'C₁₀O(OH)₁',
    category: 'semiconductor',
    description: 'Two-dimensional carbon material with exceptional electronic properties. Used in flexible electronics, sensors, and energy storage applications.',
    source: 'extracted',
    confidence: 0.94,
    createdAt: '2024-02-20T14:45:00Z',
    properties: [
      { id: 'p6', materialId: 'mat-002', propertyName: 'conductivity', propertyValue: '10³', unit: 'S/m', source: 'experimental', confidence: 0.91 },
      { id: 'p7', materialId: 'mat-002', propertyName: 'surface_area', propertyValue: '2630', unit: 'm²/g', source: 'experimental', confidence: 0.96 },
      { id: 'p8', materialId: 'mat-002', propertyName: 'band_gap', propertyValue: '2.1-4.0', unit: 'eV', source: 'variable', confidence: 0.88 }
    ]
  },
  {
    id: 'mat-003',
    name: 'Perovskite Solar Cell (MAPbI₃)',
    formula: 'CH₃NH₃PbI₃',
    category: 'solar',
    description: 'Hybrid organic-inorganic perovskite with remarkable photovoltaic efficiency exceeding 25%. Revolutionizing solar energy technology with low-cost fabrication.',
    source: 'literature',
    confidence: 0.96,
    createdAt: '2024-03-10T09:15:00Z',
    properties: [
      { id: 'p9', materialId: 'mat-003', propertyName: 'efficiency', propertyValue: '25.7', unit: '%', source: 'experimental', confidence: 0.95 },
      { id: 'p10', materialId: 'mat-003', propertyName: 'band_gap', propertyValue: '1.55', unit: 'eV', source: 'experimental', confidence: 0.97 },
      { id: 'p11', materialId: 'mat-003', propertyName: 'stability_t80', propertyValue: '>1000', unit: 'hours', source: 'accelerated', confidence: 0.85 }
    ]
  },
  {
    id: 'mat-004',
    name: 'High-Entropy Alloy (CoCrFeMnNi)',
    formula: 'Co₂₀Cr₂₀Fe₂₀Mn₂₀Ni₂₀',
    category: 'alloy',
    description: 'Cantor alloy with five principal elements in near-equiatomic proportions. Exceptional mechanical properties including high strength and ductility at cryogenic temperatures.',
    source: 'ml_predicted',
    confidence: 0.89,
    createdAt: '2024-04-05T16:20:00Z',
    properties: [
      { id: 'p12', materialId: 'mat-004', propertyName: 'yield_strength', propertyValue: '560', unit: 'MPa', source: 'experimental', confidence: 0.93 },
      { id: 'p13', materialId: 'mat-004', propertyName: 'ultimate_tensile_strength', propertyValue: '750', unit: 'MPa', source: 'experimental', confidence: 0.92 },
      { id: 'p14', materialId: 'mat-004', propertyName: 'elongation', propertyValue: '65', unit: '%', source: 'experimental', confidence: 0.94 }
    ]
  },
  {
    id: 'mat-005',
    name: 'Metal-Organic Framework (MOF-5)',
    formula: 'Zn₄O(BDC)₃',
    category: 'catalyst',
    description: 'Porous material with extremely high surface area for gas storage and separation. Applications in hydrogen storage, carbon capture, and drug delivery.',
    source: 'literature',
    confidence: 0.97,
    createdAt: '2024-05-12T11:00:00Z',
    properties: [
      { id: 'p15', materialId: 'mat-005', propertyName: 'surface_area', propertyValue: '3800', unit: 'm²/g', source: 'BET', confidence: 0.96 },
      { id: 'p16', materialId: 'mat-005', propertyName: 'pore_volume', propertyValue: '1.2', unit: 'cm³/g', source: 'BET', confidence: 0.95 },
      { id: 'p17', materialId: 'mat-005', propertyName: 'hydrogen_uptake', propertyValue: '5.1', unit: 'wt%', source: 'experimental', confidence: 0.90 }
    ]
  },
  {
    id: 'mat-006',
    name: 'Polyethylene Terephthalate (PET)',
    formula: '(C₁₀H₈O₄)ₙ',
    category: 'polymer',
    description: 'Thermoplastic polyester widely used in packaging, textiles, and engineering plastics. Recyclable and biocompatible variants available.',
    source: 'manual',
    confidence: 0.99,
    createdAt: '2024-06-01T08:30:00Z',
    properties: [
      { id: 'p18', materialId: 'mat-006', propertyName: 'glass_transition_temp', propertyValue: '75', unit: '°C', source: 'DSC', confidence: 0.99 },
      { id: 'p19', materialId: 'mat-006', propertyName: 'tensile_strength', propertyValue: '55', unit: 'MPa', source: 'ASTM', confidence: 0.98 },
      { id: 'p20', materialId: 'mat-006', propertyName: 'density', propertyValue: '1.38', unit: 'g/cm³', source: 'ASTM', confidence: 0.99 }
    ]
  },
  {
    id: 'mat-007',
    name: 'Yttria-Stabilized Zirconia (YSZ)',
    formula: 'Zr₀.₉₂Y₀.₀₈O₁.₉₆',
    category: 'ceramic',
    description: 'Ionic conductor used in solid oxide fuel cells (SOFCs) and oxygen sensors. High oxygen ion conductivity at elevated temperatures.',
    source: 'literature',
    confidence: 0.95,
    createdAt: '2024-06-18T13:45:00Z',
    properties: [
      { id: 'p21', materialId: 'mat-007', propertyName: 'ionic_conductivity', propertyValue: '0.1', unit: 'S/cm', source: 'EIS', confidence: 0.93 },
      { id: 'p22', materialId: 'mat-007', propertyName: 'operating_temperature', propertyValue: '800-1000', unit: '°C', source: 'specification', confidence: 0.99 },
      { id: 'p23', materialId: 'mat-007', propertyName: 'fracture_toughness', propertyValue: '6', unit: 'MPa·m¹/²', source: 'experimental', confidence: 0.90 }
    ]
  },
  {
    id: 'mat-008',
    name: 'Titanium Alloy (Ti-6Al-4V)',
    formula: 'Ti₉₀Al₆V₄',
    category: 'biomedical',
    description: 'Biocompatible titanium alloy extensively used in orthopedic and dental implants. Excellent strength-to-weight ratio and corrosion resistance.',
    source: 'literature',
    confidence: 0.98,
    createdAt: '2024-07-02T10:00:00Z',
    properties: [
      { id: 'p24', materialId: 'mat-008', propertyName: 'yield_strength', propertyValue: '880', unit: 'MPa', source: 'ASTM', confidence: 0.97 },
      { id: 'p25', materialId: 'mat-008', propertyName: 'elastic_modulus', propertyValue: '114', unit: 'GPa', source: 'ASTM', confidence: 0.98 },
      { id: 'p26', materialId: 'mat-008', propertyName: 'biocompatibility', propertyValue: 'excellent', unit: '-', source: 'ISO 10993', confidence: 0.99 }
    ]
  },
  {
    id: 'mat-009',
    name: 'Nickel-Manganese-Cobalt (NMC 811)',
    formula: 'LiNi₀.₈Mn₀.₁Co₀.₁O₂',
    category: 'battery',
    description: 'Next-generation cathode material with high nickel content for increased energy density. Leading candidate for premium EV batteries.',
    source: 'ml_predicted',
    confidence: 0.91,
    createdAt: '2024-07-15T15:30:00Z',
    properties: [
      { id: 'p27', materialId: 'mat-009', propertyName: 'energy_density', propertyValue: '260', unit: 'Wh/kg', source: 'projected', confidence: 0.87 },
      { id: 'p28', materialId: 'mat-009', propertyName: 'cycle_life', propertyValue: '>1500', unit: 'cycles', source: 'testing', confidence: 0.85 },
      { id: 'p29', materialId: 'mat-009', propertyName: 'cobalt_content', propertyValue: '10', unit: '%', source: 'composition', confidence: 0.99 }
    ]
  },
  {
    id: 'mat-010',
    name: 'Quantum Dot (CdSe/ZnS)',
    formula: 'CdSe/ZnS core-shell',
    category: 'semiconductor',
    description: 'Semiconductor nanocrystals with size-tunable optical properties. Applications in displays, bioimaging, and quantum computing.',
    source: 'extracted',
    confidence: 0.88,
    createdAt: '2024-07-18T09:00:00Z',
    properties: [
      { id: 'p30', materialId: 'mat-010', propertyName: 'quantum_yield', propertyValue: '85', unit: '%', source: 'PL', confidence: 0.89 },
      { id: 'p31', materialId: 'mat-010', propertyName: 'emission_wavelength', propertyValue: '520-650', unit: 'nm', source: 'tunable', confidence: 0.92 },
      { id: 'p32', materialId: 'mat-010', propertyName: 'size', propertyValue: '2-8', unit: 'nm', source: 'TEM', confidence: 0.94 }
    ]
  }
]

const mockResearchPapers: ResearchPaper[] = [
  {
    id: 'paper-001',
    title: 'Machine Learning Accelerated Discovery of High-Entropy Alloys with Optimal Mechanical Properties',
    authors: 'Zhang Y., Wang L., Chen M., Thompson G.B., Liu Z.',
    abstract: 'We present a machine learning framework combining Gaussian process regression with genetic algorithms to discover novel high-entropy alloys (HEAs). Our approach identified a new Co-Cr-Fe-Mn-Ni composition with unprecedented combination of yield strength (680 MPa) and ductility (70%) at room temperature.',
    year: 2024,
    doi: '10.1038/s41586-024-12345-6',
    journal: 'Nature',
    keywords: 'high-entropy alloys, machine learning, mechanical properties, materials discovery',
    status: 'extracted',
    createdAt: '2024-06-15T10:00:00Z',
    entities: [
      { id: 'e1', paperId: 'paper-001', entityType: 'material', entityText: 'High-Entropy Alloy CoCrFeMnNi', confidence: 0.95 },
      { id: 'e2', paperId: 'paper-001', entityType: 'property', entityText: 'yield_strength: 680 MPa', confidence: 0.92 },
      { id: 'e3', paperId: 'paper-001', entityType: 'method', entityText: 'Gaussian Process Regression', confidence: 0.88 }
    ]
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
    status: 'extracted',
    createdAt: '2024-07-01T14:30:00Z',
    entities: [
      { id: 'e4', paperId: 'paper-002', entityType: 'material', entityText: 'Perovskite MAPbI3', confidence: 0.97 },
      { id: 'e5', paperId: 'paper-002', entityType: 'property', entityText: 'efficiency: 26.1%', confidence: 0.96 },
      { id: 'e6', paperId: 'paper-002', entityType: 'method', entityText: 'Interface Passivation', confidence: 0.91 }
    ]
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
    status: 'extracted',
    createdAt: '2024-07-10T09:15:00Z',
    entities: [
      { id: 'e7', paperId: 'paper-003', entityType: 'method', entityText: 'Transformer-based NLP', confidence: 0.93 },
      { id: 'e8', paperId: 'paper-003', entityType: 'application', entityText: 'Property Extraction System', confidence: 0.90 }
    ]
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
    status: 'uploaded',
    createdAt: '2024-07-12T11:45:00Z',
    entities: []
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
    status: 'processing',
    createdAt: '2024-07-17T16:00:00Z',
    entities: [
      { id: 'e9', paperId: 'paper-005', entityType: 'material', entityText: 'MOF-5 variant', confidence: 0.87 },
      { id: 'e10', paperId: 'paper-005', entityType: 'property', entityText: 'CO2 uptake: >4 mmol/g', confidence: 0.84 }
    ]
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
    status: 'uploaded',
    createdAt: '2024-07-18T08:30:00Z',
    entities: []
  }
]

const mockKnowledgeEdges: KnowledgeEdge[] = [
  { id: 'ke-001', sourceEntityId: 'mat-001', targetEntityId: 'paper-001', relationType: 'used_in', confidence: 0.85 },
  { id: 'ke-002', sourceEntityId: 'mat-003', targetEntityId: 'paper-002', relationType: 'improves', confidence: 0.92 },
  { id: 'ke-003', sourceEntityId: 'mat-002', targetEntityId: 'mat-003', relationType: 'alternative_to', confidence: 0.78 },
  { id: 'ke-004', sourceEntityId: 'mat-004', targetEntityId: 'paper-001', relationType: 'studied_in', confidence: 0.95 },
  { id: 'ke-005', sourceEntityId: 'mat-005', targetEntityId: 'paper-005', relationType: 'related_to', confidence: 0.88 },
]

const dashboardStats: DashboardStats = {
  totalMaterials: 1247,
  totalPapers: 3589,
  totalEntities: 15682,
  totalRelations: 8934,
  materialsByCategory: [
    { name: 'Battery', value: 285, color: '#8b5cf6' },
    { name: 'Semiconductor', value: 198, color: '#06b6d4' },
    { name: 'Alloy', value: 167, color: '#f59e0b' },
    { name: 'Polymer', value: 143, color: '#10b981' },
    { name: 'Ceramic', value: 132, color: '#ef4444' },
    { name: 'Catalyst', value: 118, color: '#ec4899' },
    { name: 'Solar', value: 104, color: '#f97316' },
    { name: 'Biomedical', value: 100, color: '#6366f1' },
  ],
  papersByYear: [
    { year: 2019, count: 320 },
    { year: 2020, count: 450 },
    { year: 2021, count: 580 },
    { year: 2022, count: 720 },
    { year: 2023, count: 890 },
    { year: 2024, count: 629 },
  ],
  recentActivity: [
    { date: '2024-07-18', action: 'New material discovered: Quantum Dot CdSe/ZnS', type: 'discovery' },
    { date: '2024-07-18', action: 'Paper extracted: LLMs for Materials Science', type: 'extraction' },
    { date: '2024-07-17', action: 'Property updated: NMC 811 cycle life data', type: 'update' },
    { date: '2024-07-17', action: 'Knowledge graph expanded: +127 relations', type: 'graph' },
    { date: '2024-07-16', action: 'Model retrained on 50K new samples', type: 'training' },
    { date: '2024-07-15', action: 'New paper uploaded: Solid-State Electrolytes Review', type: 'upload' },
  ],
  topMaterials: [
    { name: 'LiFePO₄', properties: 47, citations: 1256 },
    { name: 'MAPbI₃', properties: 38, citations: 987 },
    { name: 'MOF-5', properties: 32, citations: 754 },
    { name: 'Graphene', properties: 51, citations: 2341 },
    { name: 'Ti-6Al-4V', properties: 29, citations: 623 },
  ],
  predictionAccuracy: 94.7,
  extractionRate: 96.2
}

// Category colors mapping
const categoryColors: Record<string, string> = {
  battery: '#8b5cf6',
  semiconductor: '#06b6d4',
  alloy: '#f59e0b',
  polymer: '#10b981',
  ceramic: '#ef4444',
  catalyst: '#ec4899',
  solar: '#f97316',
  biomedical: '#6366f1'
}

const categoryIcons: Record<string, React.ReactNode> = {
  battery: <Zap className="w-4 h-4" />,
  semiconductor: <Cpu className="w-4 h-4" />,
  alloy: <Layers className="w-4 h-4" />,
  polymer: <Atom className="w-4 h-4" />,
  ceramic: <FlaskConical className="w-4 h-4" />,
  catalyst: <Beaker className="w-4 h-4" />,
  solar: <SunIcon className="w-4 h-4" />,
  biomedical: <HeartIcon className="w-4 h-4" />
}

// Entity type icons for knowledge graph
const entityIcons: Record<string, React.ReactNode> = {
  material: <Atom className="w-3 h-3" />,
  property: <Activity className="w-3 h-3" />,
  method: <FlaskConical className="w-3 h-3" />,
  application: <Rocket className="w-3 h-3" />,
  element: <CircleDot className="w-3 h-3" />
}

// Custom icons
function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2"></path>
      <path d="M12 20v2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="M2 12h2"></path>
      <path d="M20 12h2"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>
  )
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
    </svg>
  )
}

// ============================================================
// MAIN APPLICATION COMPONENT
// ============================================================

export default function MatDiscoverAIApp() {
  // State management
  const [activeTab, setActiveTab] = useState('dashboard')
  const [materials, setMaterials] = useState<Material[]>(mockMaterials)
  const [papers, setPapers] = useState<ResearchPaper[]>(mockResearchPapers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to MatDiscoverAI! I\'m your intelligent materials science assistant. Ask me about material properties, discover new compounds, analyze research papers, or explore our knowledge graph. How can I help you today?',
      createdAt: new Date().toISOString()
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isExtracting, setIsExtracting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Filter materials based on search and category
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery === '' || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Handle material selection
  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material)
  }

  // Handle chat submission
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput,
      createdAt: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(chatInput)
      setChatMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse.content,
        sources: aiResponse.sources,
        createdAt: new Date().toISOString()
      }])
      setIsChatLoading(false)
    }, 1500)
  }

  // Generate contextual AI responses
  const generateAIResponse = (query: string): { content: string; sources?: string } => {
    const q = query.toLowerCase()
    
    if (q.includes('battery') || q.includes('lithium') || q.includes('li-ion')) {
      return {
        content: `**Battery Materials Analysis**\n\nBased on our database, here are the top battery materials:\n\n1. **Lithium Iron Phosphate (LiFePO₄)** - Energy density: 170 Wh/kg, excellent thermal stability\n2. **NMC 811** - Next-gen cathode with 260 Wh/kg projected density\n3. **Solid-State Electrolytes** - Emerging technology for safer batteries\n\nWould you like detailed property comparisons or synthesis methods?`,
        sources: JSON.stringify(['mat-001', 'mat-009'])
      }
    }
    
    if (q.includes('perovskite') || q.includes('solar')) {
      return {
        content: `**Perovskite Solar Cell Insights** 🌞\n\nThe latest breakthrough shows **26.1% efficiency** in single-junction perovskite cells through interface engineering (Nature, 2024).\n\nKey advantages:\n• Low-cost solution processing\n• Tunable bandgap (1.5-2.3 eV)\n• Rapid efficiency improvements (+5% in 3 years)\n\nChallenge: Long-term stability remains under active research.`,
        sources: JSON.stringify(['mat-003', 'paper-002'])
      }
    }

    if (q.includes('graphene') || q.includes('2d')) {
      return {
        content: `**2D Materials Overview**\n\n**Graphene Oxide** properties:\n• Conductivity: 10³ S/m\n• Surface area: 2630 m²/g (highest known)\n• Band gap: 2.1-4.0 eV (tunable)\n\nApplications: Flexible electronics, sensors, supercapacitors, water filtration.\n\nRelated materials in our database: MoS₂, h-BN, MXenes`,
        sources: JSON.stringify(['mat-002'])
      }
    }

    if (q.includes('discover') || q.includes('new') || q.includes('predict')) {
      return {
        content: `**Material Discovery Pipeline** 🔬\n\nOur ML-powered discovery system has:\n• Trained on **1.2M+ material compositions**\n• Predicted **847 promising candidates** this month\n• Validated **23 experimentally** (97% accuracy)\n\nActive research areas:\n1. High-entropy alloys for extreme environments\n2. MOFs for carbon capture\n3. Solid electrolytes for EV batteries\n\nWant me to run a targeted prediction?`
      }
    }

    if (q.includes('paper') || q.includes('research') || q.includes('literature')) {
      return {
        content: `**Research Paper Database** 📚\n\nWe have **3,589 indexed papers** with full NLP extraction.\n\nRecent highlights:\n1. "ML-Accelerated HEA Discovery" - *Nature* (2024)\n2. "Perovskite Breakthrough" - *Science* (2024)\n3. "NLP for Materials Extraction" - *Comp. Mat. Sci.* (2024)\n\nUse the Papers tab to browse, filter by topic, or link materials to their source publications.`,
        sources: JSON.stringify(['paper-001', 'paper-002', 'paper-003'])
      }
    }

    // Default intelligent response
    return {
      content: `I understand you're asking about "${query}". Let me help you explore that!\n\n**MatDiscoverAI Capabilities:**\n🔬 **Material Search** - Query 1,247+ materials by property, formula, or application\n📊 **Property Prediction** - ML models predict properties for novel compositions\n📄 **Paper Analysis** - Extract insights from 3,589+ research papers\n🕸️ **Knowledge Graph** - Explore relationships between materials, methods, and applications\n\nTry asking about specific materials (e.g., "tell me about perovskites"), properties ("best thermal conductivity"), or applications ("materials for aerospace").`
    }
  }

  // Handle file upload simulation
  const handleFileUpload = () => {
    setShowUploadDialog(true)
    setUploadProgress(0)
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsExtracting(true), 300)
          return 100
        }
        return prev + 10
      })
    }, 200)

    setTimeout(() => {
      setIsExtracting(false)
      clearInterval(interval)
    }, 5000)
  }

  // Get linked papers for a material
  const getLinkedPapers = (materialId: string): ResearchPaper[] => {
    return papers.filter(paper => 
      paper.entities?.some(entity => 
        entity.entityText.toLowerCase().includes(materials.find(m => m.id === materialId)?.name.split(' ')[0].toLowerCase() || '')
      )
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      
      {/* ============================================================ */}
      {/* HERO SECTION - Large Prominent Title */}
      {/* ============================================================ */}
      <header className="relative overflow-hidden border-b border-border/50">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative container mx-auto px-4 py-12 md:py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left - Title and Description */}
            <div className="flex-1 text-center lg:text-left">
              {/* Logo and Brand */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-accent flex items-center justify-center shadow-xl shadow-primary/25 animate-pulse-glow">
                    <Atom className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">AI</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent leading-tight">
                    MatDiscoverAI
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground font-medium mt-1">
                    Intelligence-Powered Material Discovery Platform
                  </p>
                </div>
              </div>

              {/* Main Tagline - LARGE AND PROMINENT */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
                Discover Tomorrow's Materials{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Today</span>
              </h2>

              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                Advanced <strong>NLP/LLM-based framework</strong> for intelligent material discovery, 
                property prediction, research extraction, and knowledge graph exploration. 
                Powered by cutting-edge AI to accelerate your materials science research.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{dashboardStats.totalMaterials.toLocaleString()}+</span>
                  <span className="text-sm text-muted-foreground">Materials</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <span className="font-semibold">{dashboardStats.totalPapers.toLocaleString()}+</span>
                  <span className="text-sm text-muted-foreground">Papers</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                  <Brain className="w-4 h-4 text-green-500" />
                  <span className="font-semibold">{dashboardStats.predictionAccuracy}%</span>
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25 gap-2" onClick={() => document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Rocket className="w-5 h-5" />
                  Explore Platform
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={handleFileUpload}>
                  <Upload className="w-5 h-5" />
                  Upload Paper
                </Button>
                <Button size="lg" variant="ghost" className="gap-2" onClick={() => setActiveTab('chat')}>
                  <MessageSquare className="w-5 h-5" />
                  Ask AI Assistant
                </Button>
              </div>
            </div>

            {/* Right - Animated Visual */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="relative w-full max-w-md mx-auto lg:max-w-none">
                {/* Main visual card */}
                <div className="glass rounded-3xl p-6 md:p-8 animate-float">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 text-center">
                      <BrainCircuit className="w-12 h-12 mx-auto mb-2 text-primary" />
                      <p className="font-bold text-lg">NLP Engine</p>
                      <p className="text-sm text-muted-foreground">GPT-4 Powered Analysis</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-xl p-4 text-center">
                      <ScanText className="w-8 h-8 mx-auto mb-1 text-cyan-500" />
                      <p className="font-semibold text-sm">Extraction</p>
                      <p className="text-xs text-muted-foreground">96.2% Rate</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl p-4 text-center">
                      <Layers3 className="w-8 h-8 mx-auto mb-1 text-purple-500" />
                      <p className="font-semibold text-sm">Prediction</p>
                      <p className="text-xs text-muted-foreground">ML Models</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-4 text-center">
                      <Network className="w-8 h-8 mx-auto mb-1 text-green-500" />
                      <p className="font-semibold text-sm">Knowledge</p>
                      <p className="text-xs text-muted-foreground">8.9K Relations</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl p-4 text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-1 text-orange-500" />
                      <p className="font-semibold text-sm">Analytics</p>
                      <p className="text-xs text-muted-foreground">Real-time</p>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce">
                  ✓ Production Ready
                </div>
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-primary to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  v2.0 Pro
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full h-auto p-2 bg-card border shadow-sm">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Atom className="w-4 h-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="papers" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Papers</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">Graph</span>
            </TabsTrigger>
            <TabsTrigger value="extract" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ScanText className="w-4 h-4" />
              <span className="hidden sm:inline">Extract</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB 1: DASHBOARD */}
          {/* ============================================================ */}
          <TabsContent value="dashboard" className="space-y-6">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="relative overflow-hidden border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
                  <Database className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.totalMaterials.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    +127 this month
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-l-4 border-l-cyan-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Research Papers</CardTitle>
                  <BookOpen className="w-5 h-5 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.totalPapers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    +89 this week
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Extraction Accuracy</CardTitle>
                  <Target className="w-5 h-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.extractionRate}%</div>
                  <Progress value={dashboardStats.extractionRate} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">ML Prediction Score</CardTitle>
                  <Brain className="w-5 h-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dashboardStats.predictionAccuracy}%</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Award className="w-3 h-3 text-yellow-500" />
                    State-of-the-art
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Materials by Category Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                        Materials Distribution
                      </CardTitle>
                      <CardDescription>Breakdown by material category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={dashboardStats.materialsByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {dashboardStats.materialsByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value} materials`, 'Count']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

              {/* Publications Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                    Publication Trends
                  </CardTitle>
                  <CardDescription>Research papers published per year</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dashboardStats.papersByYear}>
                      <defs>
                        <linearGradient id="colorPapers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} papers`, 'Publications']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="url(#colorPapers)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: Activity Feed + Top Materials */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates in the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-4">
                      {dashboardStats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'discovery' ? 'bg-green-500' :
                            activity.type === 'extraction' ? 'bg-blue-500' :
                            activity.type === 'update' ? 'bg-yellow-500' :
                            activity.type === 'graph' ? 'bg-purple-500' :
                            activity.type === 'training' ? 'bg-orange-500' : 'bg-gray-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.date}</p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Materials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Top Materials
                  </CardTitle>
                  <CardDescription>Most cited materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-4">
                      {dashboardStats.topMaterials.map((material, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
                          const mat = materials.find(m => m.name.includes(material.name.split(' ')[0]))
                          if (mat) {
                            setSelectedMaterial(mat)
                            setActiveTab('materials')
                          }
                        }}>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{material.name}</p>
                            <p className="text-xs text-muted-foreground">{material.properties} properties</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary">{material.citations}</p>
                            <p className="text-xs text-muted-foreground">citations</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 2: MATERIALS EXPLORER */}
          {/* ============================================================ */}
          <TabsContent value="materials" className="space-y-6">
            
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search materials by name, formula, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-48 h-12">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="battery">Battery</SelectItem>
                      <SelectItem value="semiconductor">Semiconductor</SelectItem>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="polymer">Polymer</SelectItem>
                      <SelectItem value="ceramic">Ceramic</SelectItem>
                      <SelectItem value="catalyst">Catalyst</SelectItem>
                      <SelectItem value="solar">Solar</SelectItem>
                      <SelectItem value="biomedical">Biomedical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-12 gap-2" onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}>
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredMaterials.length}</span> materials
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Grid3X3 className="w-4 h-4" /> Grid
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <ListIcon className="w-4 h-4" /> List
                </Button>
              </div>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <Card 
                  key={material.id} 
                  className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 ${selectedMaterial?.id === material.id ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/30'}`}
                  onClick={() => handleMaterialSelect(material)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: categoryColors[material.category] || '#6366f1' }}
                        >
                          {categoryIcons[material.category] || <Atom className="w-6 h-6" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {material.name}
                          </CardTitle>
                          <CardDescription className="font-mono text-sm">
                            {material.formula}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="capitalize"
                        style={{ backgroundColor: `${categoryColors[material.category]}20`, color: categoryColors[material.category] }}
                      >
                        {material.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {material.description}
                    </p>

                    {/* Properties Preview */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Properties</p>
                      <div className="grid grid-cols-2 gap-2">
                        {material.properties.slice(0, 4).map((prop) => (
                          <div key={prop.id} className="bg-muted/50 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground capitalize">{prop.propertyName.replace('_', ' ')}</p>
                            <p className="font-semibold text-sm">
                              {prop.propertyValue} <span className="text-xs text-muted-foreground">{prop.unit}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Confidence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={material.confidence * 100} className="w-20 h-2" />
                        <span className="text-xs font-medium">{Math.round(material.confidence * 100)}%</span>
                      </div>
                    </div>

                    {/* Linked Papers Count */}
                    {getLinkedPapers(material.id).length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Link2 className="w-3 h-3" />
                        <span>{getLinkedPapers(material.id).length} linked papers</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Material Detail Panel */}
            {selectedMaterial && (
              <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: categoryColors[selectedMaterial.category] }}
                      >
                        {categoryIcons[selectedMaterial.category]}
                      </div>
                      {selectedMaterial.name}
                    </DialogTitle>
                    <DialogDescription className="font-mono text-lg">
                      {selectedMaterial.formula}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    {/* Description */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Description
                      </h4>
                      <p className="text-muted-foreground">{selectedMaterial.description}</p>
                    </div>

                    {/* All Properties Table */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Properties ({selectedMaterial.properties.length})
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Confidence</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedMaterial.properties.map((prop) => (
                            <TableRow key={prop.id}>
                              <TableCell className="font-medium capitalize">{prop.propertyName.replace('_', ' ')}</TableCell>
                              <TableCell>{prop.propertyValue}</TableCell>
                              <TableCell>{prop.unit}</TableCell>
                              <TableCell><Badge variant="outline">{prop.source}</Badge></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={prop.confidence * 100} className="w-16 h-1.5" />
                                  <span className="text-xs">{Math.round(prop.confidence * 100)}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Linked Research Papers */}
                    {getLinkedPapers(selectedMaterial.id).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" /> Related Research Papers ({getLinkedPapers(selectedMaterial.id).length})
                        </h4>
                        <div className="space-y-3">
                          {getLinkedPapers(selectedMaterial.id).map((paper) => (
                            <Card key={paper.id} className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium line-clamp-1">{paper.title}</h5>
                                  <p className="text-sm text-muted-foreground">{paper.authors}</p>
                                  <p className="text-xs text-primary mt-1">{paper.journal} ({paper.year})</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                      <span>ID: {selectedMaterial.id}</span>
                      <span>Source: {selectedMaterial.source}</span>
                      <span>Added: {new Date(selectedMaterial.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 3: RESEARCH PAPERS */}
          {/* ============================================================ */}
          <TabsContent value="papers" className="space-y-6">
            
            {/* Papers Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="pt-6 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{papers.length}</p>
                  <p className="text-sm text-muted-foreground">In This View</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{papers.filter(p => p.status === 'extracted').length}</p>
                  <p className="text-sm text-muted-foreground">Fully Extracted</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                <CardContent className="pt-6 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{papers.filter(p => p.status === 'processing').length}</p>
                  <p className="text-sm text-muted-foreground">Processing</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="pt-6 text-center">
                  <Hash className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{papers.reduce((acc, p) => acc + (p.entities?.length || 0), 0)}</p>
                  <p className="text-sm text-muted-foreground">Entities Found</p>
                </CardContent>
              </Card>
            </div>

            {/* Papers List */}
            <div className="space-y-4">
              {papers.map((paper) => (
                <Card key={paper.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Paper Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold hover:text-primary cursor-pointer line-clamp-2">
                              {paper.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">{paper.authors}</p>
                          </div>
                          <Badge 
                            variant={paper.status === 'extracted' ? 'default' : paper.status === 'processing' ? 'secondary' : 'outline'}
                            className="shrink-0"
                          >
                            {paper.status === 'extracted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {paper.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            {paper.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {paper.abstract}
                        </p>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {paper.year}
                          </span>
                          {paper.journal && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {paper.journal}
                            </span>
                          )}
                          {paper.doi && (
                            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="w-3 h-3" /> DOI
                            </a>
                          )}
                          {paper.keywords && (
                            <div className="flex items-center gap-1">
                              <TagIcon className="w-3 h-3" />
                              {paper.keywords.split(', ').slice(0, 3).map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{keyword}</Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Extracted Entities */}
                        {paper.entities && paper.entities.length > 0 && (
                          <div className="pt-3 border-t">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                              Extracted Entities ({paper.entities.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {paper.entities.map((entity) => (
                                <Badge 
                                  key={entity.id} 
                                  variant="outline"
                                  className="cursor-pointer hover:bg-primary/10"
                                  style={{
                                    borderColor: entity.entityType === 'material' ? '#8b5cf6' :
                                               entity.entityType === 'property' ? '#06b6d4' :
                                               entity.entityType === 'method' ? '#10b981' : '#f59e0b'
                                  }}
                                >
                                  {entityIcons[entity.entityType] || <CircleDot className="w-3 h-3 mr-1" />}
                                  {entity.entityText.length > 40 ? `${entity.entityText.substring(0, 40)}...` : entity.entityText}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="w-4 h-4" /> PDF
                        </Button>
                        <Button size="sm" className="gap-1 bg-gradient-to-r from-primary to-purple-600">
                          <Link2 className="w-4 h-4" /> Link Material
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 4: DISCOVER / PREDICT */}
          {/* ============================================================ */}
          <TabsContent value="discover" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Prediction */}
              <Card className="border-2 border-dashed border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BrainCircuit className="w-6 h-6 text-primary" />
                    AI Property Prediction
                  </CardTitle>
                  <CardDescription>Predict material properties using our ML models</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Material Composition</label>
                      <Input placeholder="e.g., LiFePO4, Ti-6Al-4V, or chemical formula..." className="h-11" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Target Property</label>
                        <Select>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select property" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="energy_density">Energy Density</SelectItem>
                            <SelectItem value="conductivity">Electrical Conductivity</SelectItem>
                            <SelectItem value="strength">Mechanical Strength</SelectItem>
                            <SelectItem value="band_gap">Band Gap</SelectItem>
                            <SelectItem value="thermal_cond">Thermal Conductivity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Model Type</label>
                        <Select>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select model" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpr">Gaussian Process</SelectItem>
                            <SelectItem value="neural_net">Neural Network</SelectItem>
                            <SelectItem value="ensemble">Ensemble Model</SelectItem>
                            <SelectItem value="transformer">Transformer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 gap-2" size="lg">
                      <Sparkles className="w-5 h-5" />
                      Run Prediction
                    </Button>
                  </div>

                  {/* Sample Prediction Result */}
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-semibold">Sample Prediction Output</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Predicted Value:</span>
                        <span className="font-mono font-bold">172.4 ± 5.2 Wh/kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence Interval:</span>
                        <span>95%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Similar Materials:</span>
                        <span>LiFePO₄, NMC 111</span>
                      </div>
                      <Progress value={94} className="mt-2 h-2" />
                      <p className="text-xs text-muted-foreground text-right">Model Confidence: 94%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Material Discovery Generator */}
              <Card className="border-2 border-dashed border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Rocket className="w-6 h-6 text-cyan-500" />
                    Novel Material Discovery
                  </CardTitle>
                  <CardDescription>Generate and screen new material candidates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Application</label>
                      <Select>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select application" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ev_battery">EV Battery Cathode</SelectItem>
                          <SelectItem value="solid_electrolyte">Solid Electrolyte</SelectItem>
                          <SelectItem value="thermoelectric">Thermoelectric Material</SelectItem>
                          <SelectItem value="photocatalyst">Photocatalyst</SelectItem>
                          <SelectItem value="superconductor">Superconductor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Constraints (Optional)</label>
                      <Textarea placeholder="e.g., Must contain Fe, exclude rare earth elements, cost <$10/kg..." rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Candidates</label>
                        <Select>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Number" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">Top 10</SelectItem>
                            <SelectItem value="50">Top 50</SelectItem>
                            <SelectItem value="100">Top 100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Optimization</label>
                        <Select>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Method" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="genetic">Genetic Algorithm</SelectItem>
                            <SelectItem value="bayesian">Bayesian Optimization</SelectItem>
                            <SelectItem value="reinforcement">Reinforcement Learning</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 gap-2" size="lg">
                      <Hexagon className="w-5 h-5" />
                      Generate Candidates
                    </Button>
                  </div>

                  {/* Discovery Progress Simulation */}
                  <div className="mt-6 p-4 rounded-xl bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Discovery Pipeline Status</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-600">Active</Badge>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Composition Space Generation', progress: 100 },
                        { label: 'Initial Screening (DFT)', progress: 100 },
                        { label: 'ML Property Prediction', progress: 75 },
                        { label: 'Stability Validation', progress: 30 },
                        { label: 'Ranking & Selection', progress: 0 },
                      ].map((step, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{step.label}</span>
                            <span>{step.progress}%</span>
                          </div>
                          <Progress value={step.progress} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Discovery Results Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-orange-500" />
                  Recently Discovered Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Formula</TableHead>
                      <TableHead>Target Property</TableHead>
                      <TableHead>Predicted Value</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: 'Li-Rich Layered Oxide', formula: 'Li₁.₂Mn₀.₅₄Ni₀.₁₃Co₀.₁₃O₂', prop: 'Energy Density', value: '285 Wh/kg', conf: 0.87, status: 'validation' },
                      { name: 'Sodium Superionic Conductor', formula: 'Na₃Zr₂Si₂PO₁₂', prop: 'Ionic Cond.', value: '12 mS/cm', conf: 0.92, status: 'synthesized' },
                      { name: 'Half-Heusler Compound', formula: 'NbFeSb', prop: 'Figure of Merit', value: 'ZT=1.5', conf: 0.81, status: 'predicted' },
                      { name: 'MXene Hybrid', formula: 'Ti₃C₂Tₓ/PEDOT', prop: 'Capacitance', value: '450 F/g', conf: 0.79, status: 'predicted' },
                    ].map((candidate, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell className="font-mono text-sm">{candidate.formula}</TableCell>
                        <TableCell>{candidate.prop}</TableCell>
                        <TableCell className="font-semibold">{candidate.value}</TableCell>
                        <TableCell>
                          <Progress value={candidate.conf * 100} className="w-16 h-1.5" />
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            candidate.status === 'synthesized' ? 'default' :
                            candidate.status === 'validation' ? 'secondary' : 'outline'
                          }>
                            {candidate.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 5: KNOWLEDGE GRAPH */}
          {/* ============================================================ */}
          <TabsContent value="knowledge" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Graph Visualization */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-primary" />
                      Material Knowledge Graph
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Maximize2 className="w-4 h-4" /> Expand
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <RefreshCw className="w-4 h-4" /> Refresh
                      </Button>
                    </div>
                  </div>
                  <CardDescription>Interactive visualization of material relationships</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-8 min-h-[400px] flex items-center justify-center overflow-hidden">
                    {/* Simplified Graph Visualization */}
                    <svg viewBox="0 0 600 400" className="w-full h-full max-h-[400px]">
                      {/* Connections (edges) */}
                      <line x1="150" y1="120" x2="300" y2="200" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" opacity="0.6"/>
                      <line x1="300" y1="200" x2="450" y2="120" stroke="#06b6d4" strokeWidth="2" opacity="0.6"/>
                      <line x1="150" y1="280" x2="300" y2="200" stroke="#10b981" strokeWidth="2" opacity="0.6"/>
                      <line x1="450" y1="280" x2="300" y2="200" stroke="#f59e0b" strokeWidth="2" opacity="0.6"/>
                      <line x1="150" y1="120" x2="150" y2="280" stroke="#ef4444" strokeWidth="1" opacity="0.4"/>
                      <line x1="450" y1="120" x2="450" y2="280" stroke="#ec4899" strokeWidth="1" opacity="0.4"/>

                      {/* Node: Center - Core Concept */}
                      <g transform="translate(300, 200)">
                        <circle r="45" fill="url(#centerGrad)" className="drop-shadow-lg"/>
                        <text textAnchor="middle" dy="5" fill="white" fontSize="12" fontWeight="bold">MatDiscover</text>
                        <text textAnchor="middle" dy="20" fill="rgba(255,255,255,0.8)" fontSize="10">AI Core</text>
                      </g>

                      {/* Node: Battery Materials */}
                      <g transform="translate(150, 120)" className="cursor-pointer hover:opacity-80">
                        <circle r="35" fill="#8b5cf6"/>
                        <text textAnchor="middle" dy="-5" fill="white" fontSize="10" fontWeight="bold">Battery</text>
                        <text textAnchor="middle" dy="10" fill="rgba(255,255,255,0.8)" fontSize="9">Materials</text>
                      </g>

                      {/* Node: Semiconductors */}
                      <g transform="translate(450, 120)" className="cursor-pointer hover:opacity-80">
                        <circle r="35" fill="#06b6d4"/>
                        <text textAnchor="middle" dy="-5" fill="white" fontSize="10" fontWeight="bold">Semi-</text>
                        <text textAnchor="middle" dy="10" fill="rgba(255,255,255,0.8)" fontSize="9">conductors</text>
                      </g>

                      {/* Node: Research Papers */}
                      <g transform="translate(150, 280)" className="cursor-pointer hover:opacity-80">
                        <circle r="35" fill="#10b981"/>
                        <text textAnchor="middle" dy="-5" fill="white" fontSize="10" fontWeight="bold">Research</text>
                        <text textAnchor="middle" dy="10" fill="rgba(255,255,255,0.8)" fontSize="9">Papers</text>
                      </g>

                      {/* Node: Properties */}
                      <g transform="translate(450, 280)" className="cursor-pointer hover:opacity-80">
                        <circle r="35" fill="#f59e0b"/>
                        <text textAnchor="middle" dy="-5" fill="white" fontSize="10" fontWeight="bold">Properties</text>
                        <text textAnchor="middle" dy="10" fill="rgba(255,255,255,0.8)" fontSize="9">& Methods</text>
                      </g>

                      {/* Edge Labels */}
                      <text x="220" y="155" fill="#8b5cf6" fontSize="8" transform="rotate(-25, 220, 155)">used_in</text>
                      <text x="380" y="155" fill="#06b6d4" fontSize="8" transform="rotate(25, 380, 155)">related</text>
                      <text x="210" y="250" fill="#10b981" fontSize="8" transform="rotate(25, 210, 250)">source</text>
                      <text x="380" y="250" fill="#f59e0b" fontSize="8" transform="rotate(-25, 380, 250)">has</text>

                      {/* Gradient Definitions */}
                      <defs>
                        <radialGradient id="centerGrad">
                          <stop offset="0%" stopColor="#6366f1"/>
                          <stop offset="100%" stopColor="#8b5cf6"/>
                        </radialGradient>
                      </defs>
                    </svg>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-lg p-3 border">
                      <p className="text-xs font-semibold mb-2">Relation Types</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-purple-500"/> used_in</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-cyan-500"/> related_to</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-green-500"/> source_of</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-yellow-500"/> has_property</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Graph Statistics */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Graph Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Total Nodes', value: '15,682', icon: <CircleDot className="w-4 h-4" />, change: '+234' },
                      { label: 'Total Edges', value: '8,934', icon: <GitBranch className="w-4 h-4" />, change: '+89' },
                      { label: 'Material Nodes', value: '1,247', icon: <Atom className="w-4 h-4" />, change: '+12' },
                      { label: 'Paper Nodes', value: '3,589', icon: <BookOpen className="w-4 h-4" />, change: '+45' },
                      { label: 'Avg. Degree', value: '4.2', icon: <Network className="w-4 h-4" />, change: '+0.3' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {stat.icon}
                          <span className="text-sm">{stat.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{stat.value}</p>
                          <p className="text-xs text-green-500">{stat.change}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Relation Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={[
                        { subject: 'has_property', A: 95, fullMark: 100 },
                        { subject: 'used_in', A: 78, fullMark: 100 },
                        { subject: 'synthesized_by', A: 62, fullMark: 100 },
                        { subject: 'improves', A: 54, fullMark: 100 },
                        { subject: 'alternative_to', A: 43, fullMark: 100 },
                        { subject: 'related_to', A: 88, fullMark: 100 },
                      ]}>
                        <PolarGrid strokeDasharray="3 3" opacity={0.3}/>
                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 10}}/>
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fontSize: 8}}/>
                        <Radar name="Relations" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 6: EXTRACTION */}
          {/* ============================================================ */}
          <TabsContent value="extract" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Upload className="w-6 h-6 text-primary" />
                    Document Upload & Processing
                  </CardTitle>
                  <CardDescription>Upload research papers for automated NLP extraction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Drop Zone */}
                  <div 
                    className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={handleFileUpload}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-semibold text-lg mb-1">Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground">Supports PDF, DOCX, TXT up to 50MB</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Badge variant="secondary">PDF</Badge>
                      <Badge variant="secondary">DOCX</Badge>
                      <Badge variant="secondary">TXT</Badge>
                      <Badge variant="secondary">LaTeX</Badge>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {(uploadProgress > 0 || isExtracting) && (
                    <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {isExtracting ? 'Extracting entities...' : 'Uploading...'}
                        </span>
                        <span>{Math.min(uploadProgress, 100)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-3" />
                      
                      {isExtracting && (
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-green-500" /> Document parsed successfully
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-green-500" /> Text preprocessing complete
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" /> Running NER extraction...
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" /> Building knowledge graph...
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button className="w-full h-12 gap-2" variant="outline" onClick={handleFileUpload}>
                    <Plus className="w-5 h-5" />
                    Browse Files
                  </Button>
                </CardContent>
              </Card>

              {/* Extraction Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ScanText className="w-6 h-6 text-cyan-500" />
                    Extraction Results
                  </CardTitle>
                  <CardDescription>Real-time view of extracted entities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Entity Counts */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Materials', count: 24, color: 'purple', icon: <Atom className="w-4 h-4" /> },
                      { label: 'Properties', count: 67, color: 'cyan', icon: <Gauge className="w-4 h-4" /> },
                      { label: 'Methods', count: 18, color: 'green', icon: <FlaskConical className="w-4 h-4" /> },
                      { label: 'Conditions', count: 31, color: 'orange', icon: <Thermometer className="w-4 h-4" /> },
                    ].map((item, i) => (
                      <div key={i} className={`p-3 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/20`}>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          {item.icon}
                          <span className="text-xs">{item.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{item.count}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent Extractions */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Recently Extracted Entities</p>
                    <ScrollArea className="h-[240px] pr-4">
                      <div className="space-y-2">
                        {[
                          { text: 'Lithium Iron Phosphate (LiFePO₄)', type: 'material', conf: 0.97 },
                          { text: 'Energy density: 170 Wh/kg', type: 'property', conf: 0.94 },
                          { text: 'Sol-gel synthesis method', type: 'method', conf: 0.89 },
                          { text: 'Annealing temperature: 700°C', type: 'condition', conf: 0.92 },
                          { text: 'Perovskite structure ABX₃', type: 'material', conf: 0.91 },
                          { text: 'Band gap: 1.55 eV', type: 'property', conf: 0.96 },
                          { text: 'Spin-coating deposition', type: 'method', conf: 0.87 },
                          { text: 'Relative humidity: 30%', type: 'condition', conf: 0.83 },
                        ].map((entity, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">
                                {entity.type}
                              </Badge>
                              <span className="text-sm">{entity.text}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round(entity.conf * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Processing Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Processing Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { doc: 'perovskite_efficiency_2024.pdf', type: 'PDF', status: 'completed', progress: 100, time: '2 min ago' },
                      { doc: 'high_entropy_alloys_review.docx', type: 'DOCX', status: 'processing', progress: 65, time: '5 min ago' },
                      { doc: 'mof_synthesis_methods.txt', type: 'TXT', status: 'queued', progress: 0, time: '8 min ago' },
                      { doc: 'solid_state_batteries.pdf', type: 'PDF', status: 'queued', progress: 0, time: '12 min ago' },
                    ].map((job, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{job.doc}</TableCell>
                        <TableCell><Badge variant="outline">{job.type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={
                            job.status === 'completed' ? 'default' :
                            job.status === 'processing' ? 'secondary' : 'outline'
                          }>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 w-24">
                            <Progress value={job.progress} className="flex-1 h-2" />
                            <span className="text-xs">{job.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{job.time}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 7: AI CHAT ASSISTANT */}
          {/* ============================================================ */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chat Window */}
              <Card className="lg:col-span-3 flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    MatDiscoverAI Assistant
                  </CardTitle>
                  <CardDescription>Your intelligent materials science companion powered by advanced LLMs</CardDescription>
                </CardHeader>
                
                {/* Messages Area */}
                <CardContent className="flex-1 flex flex-col min-h-[500px]">
                  <ScrollArea className="flex-1 pr-4 mb-4">
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                                  <Bot className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-semibold">MatDiscoverAI</span>
                              </div>
                            )}
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                            {message.role === 'assistant' && message.sources && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-2">Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {JSON.parse(message.sources).map((source: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      <Link2 className="w-3 h-3 mr-1" />
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="flex gap-2">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleChatSubmit()
                        }
                      }}
                      placeholder="Ask about materials, properties, discoveries, or research..."
                      className="min-h-[60px] resize-none"
                    />
                    <Button 
                      onClick={handleChatSubmit} 
                      disabled={!chatInput.trim() || isChatLoading}
                      className="self-end h-[60px] px-6 bg-gradient-to-r from-primary to-purple-600"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quick Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      'Best battery materials?',
                      'Explain perovskites',
                      'Recent discoveries',
                      'Compare alloys',
                      'Find conductive materials',
                      'Solar cell trends',
                    ].map((question, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="w-full justify-start text-sm h-auto py-2 px-3"
                        onClick={() => {
                          setChatInput(question)
                          setTimeout(() => handleChatSubmit(), 100)
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                        {question}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { icon: <Microscope className="w-4 h-4" />, title: 'Material Analysis', desc: 'Deep dive into properties' },
                      { icon: <TestTube className="w-4 h-4" />, title: 'Experiment Design', desc: 'Suggest methodologies' },
                      { icon: <Dna className="w-4 h-4" />, title: 'Discovery Pipeline', desc: 'Generate candidates' },
                      { icon: <Waves className="w-4 h-4" />, title: 'Literature Review', desc: 'Summarize findings' },
                    ].map((cap, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="text-primary">{cap.icon}</div>
                        <div>
                          <p className="text-sm font-medium">{cap.title}</p>
                          <p className="text-xs text-muted-foreground">{cap.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Atom className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">MatDiscoverAI</h3>
                  <p className="text-sm text-muted-foreground">Intelligence-Powered Material Discovery</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Advanced NLP/LLM-based platform for accelerating materials discovery through artificial intelligence. 
                Built for researchers, scientists, and innovators worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Material Explorer</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">AI Predictions</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Paper Extraction</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Knowledge Graph</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Research Assistant</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Research Papers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; 2024 MatDiscoverAI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Production Ready
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-500" />
                Enterprise Security
              </span>
              <span>v2.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Research Paper</DialogTitle>
            <DialogDescription>
              Upload a PDF, DOCX, or TXT file for automated NLP extraction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-primary/40 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Click to select file</p>
              <p className="text-sm text-muted-foreground mt-1">PDF, DOCX, TXT up to 50MB</p>
            </div>
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 
                   isExtracting ? 'Processing document...' : 'Complete!'}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowUploadDialog(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Additional helper components
function ListIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  )
}

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.64 3.64a1.25 1.25 0 0 0-1.77 0l-6.36 6.36a1.25 1.25 0 0 0 0 1.77l5.66 5.66a1.25 1.25 0 0 0 1.77 0l6.36-6.36a1.25 1.25 0 0 0 0-1.77z"></path>
    </svg>
  )
}

// Note: Rocket is already imported from lucide-react, no need to redefine
