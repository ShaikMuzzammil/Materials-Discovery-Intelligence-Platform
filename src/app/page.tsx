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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import {
  Atom, BookOpen, Brain, Database, FileText, FlaskConical, Github,
  MessageSquare, Network, Search, Sparkles, TrendingUp, Upload,
  Zap, ChevronRight, ExternalLink, Layers, Beaker, Shield,
  Activity, Target, ArrowRight, Send, Loader2, CheckCircle2,
  AlertCircle, Info, X, Cpu, Globe, Lightbulb, BarChart3,
  GitBranch, Eye, Bot, Thermometer, Gauge, CircuitBoard
} from 'lucide-react'

// ============================================================
// TYPES
// ============================================================
interface Material {
  id: string
  name: string
  formula: string
  category: string
  description: string
  confidence: number
  properties: MaterialProperty[]
  sourceEdges?: KnowledgeEdge[]
  targetEdges?: KnowledgeEdge[]
}

interface MaterialProperty {
  id: string
  propertyName: string
  propertyValue: string
  unit: string
  confidence: number
}

interface ResearchPaper {
  id: string
  title: string
  authors: string
  abstract: string
  year: number
  doi: string | null
  journal: string | null
  status: string
  keywords: string | null
}

interface KnowledgeEdge {
  id: string
  sourceEntityId: string
  targetEntityId: string
  relationType: string
  confidence: number
}

interface ExtractionResult {
  materials: { name: string; formula: string; category: string; confidence: number; context: string }[]
  properties: { name: string; value: string; unit: string; confidence: number }[]
  relations: { source: string; target: string; type: string; confidence: number }[]
  summary: string
  stats: { textLength: number; materialsFound: number; propertiesFound: number; relationsFound: number; avgConfidence: number }
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: string[]
}

interface PredictionResult {
  recommendations: { name: string; formula: string; score: number; reason: string }[]
  methodology: string
}

interface DashboardStats {
  totalMaterials: number
  totalPapers: number
  totalProperties: number
  totalEdges: number
  categoryDistribution: { category: string; count: number }[]
  recentMaterials: Material[]
}

// ============================================================
// CONSTANTS
// ============================================================
const CATEGORY_COLORS: Record<string, string> = {
  battery: '#f59e0b',
  semiconductor: '#8b5cf6',
  solar: '#f97316',
  catalyst: '#10b981',
  alloy: '#6366f1',
  polymer: '#ec4899',
  ceramic: '#14b8a6',
  biomedical: '#ef4444',
  unknown: '#94a3b8',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  battery: <Zap className="h-4 w-4" />,
  semiconductor: <CircuitBoard className="h-4 w-4" />,
  solar: <Sun className="h-4 w-4" />,
  catalyst: <Beaker className="h-4 w-4" />,
  alloy: <Shield className="h-4 w-4" />,
  polymer: <Layers className="h-4 w-4" />,
  ceramic: <FlaskConical className="h-4 w-4" />,
  biomedical: <Activity className="h-4 w-4" />,
}

const CHART_COLORS = ['#f59e0b', '#8b5cf6', '#f97316', '#10b981', '#6366f1', '#ec4899', '#14b8a6', '#ef4444']

// Sun icon component
function Sun(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

// ============================================================
// MAIN APP COMPONENT
// ============================================================
export default function MatDiscoverAI() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [statsRes, matsRes, papersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/materials?limit=100'),
        fetch('/api/papers'),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (matsRes.ok) { const d = await matsRes.json(); setMaterials(d.materials || d) }
      if (papersRes.ok) { const d = await papersRes.json(); setPapers(d.papers || d) }
    } catch (e) { console.error('Failed to load data', e) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Atom className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">MatDiscoverAI</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">LLM-Based Materials Discovery</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
                <Database className="h-3 w-3" />
                {stats ? `${stats.totalMaterials} Materials` : 'Loading...'}
              </Badge>
              <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
                <BookOpen className="h-3 w-3" />
                {stats ? `${stats.totalPapers} Papers` : 'Loading...'}
              </Badge>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Github className="h-4 w-4" /></Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <Atom className="h-4 w-4" /> Materials
            </TabsTrigger>
            <TabsTrigger value="extract" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <FileText className="h-4 w-4" /> Extract
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <Network className="h-4 w-4" /> Knowledge Graph
            </TabsTrigger>
            <TabsTrigger value="predict" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <Target className="h-4 w-4" /> Predict
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <Bot className="h-4 w-4" /> AI Chat
            </TabsTrigger>
            <TabsTrigger value="papers" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <BookOpen className="h-4 w-4" /> Papers
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
              <Info className="h-4 w-4" /> About
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <DashboardView stats={stats} materials={materials} loading={loading} />
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <MaterialsView materials={materials} loading={loading} onRefresh={loadInitialData} />
          </TabsContent>

          {/* Extract Tab */}
          <TabsContent value="extract">
            <ExtractView onExtracted={loadInitialData} />
          </TabsContent>

          {/* Knowledge Graph Tab */}
          <TabsContent value="knowledge">
            <KnowledgeGraphView materials={materials} />
          </TabsContent>

          {/* Predict Tab */}
          <TabsContent value="predict">
            <PredictView />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <ChatView />
          </TabsContent>

          {/* Papers Tab */}
          <TabsContent value="papers">
            <PapersView papers={papers} loading={loading} />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <AboutView />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>MatDiscoverAI - ML Capstone Project 2026</span>
          <span>Built with Next.js, Prisma, Recharts & LLM</span>
        </div>
      </footer>
    </div>
  )
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ stats, materials, loading }: { stats: DashboardStats | null; materials: Material[]; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  const pieData = stats.categoryDistribution.map(d => ({ ...d, fill: CATEGORY_COLORS[d.category] || '#94a3b8' }))
  const barData = stats.categoryDistribution.map(d => ({ name: d.category.charAt(0).toUpperCase() + d.category.slice(1), count: d.count, fill: CATEGORY_COLORS[d.category] || '#94a3b8' }))
  
  // Property radar data
  const radarData = [
    { subject: 'Energy Density', battery: 85, semiconductor: 30, solar: 70, catalyst: 20 },
    { subject: 'Conductivity', battery: 60, semiconductor: 95, solar: 50, catalyst: 40 },
    { subject: 'Stability', battery: 80, semiconductor: 70, solar: 55, catalyst: 75 },
    { subject: 'Cost Efficiency', battery: 60, semiconductor: 40, solar: 65, catalyst: 50 },
    { subject: 'Safety', battery: 75, semiconductor: 85, solar: 80, catalyst: 70 },
    { subject: 'Scalability', battery: 70, semiconductor: 60, solar: 55, catalyst: 65 },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Atom className="h-5 w-5" />} title="Materials" value={stats.totalMaterials} subtitle="Across all categories" color="from-amber-500 to-orange-600" />
        <StatCard icon={<BookOpen className="h-5 w-5" />} title="Research Papers" value={stats.totalPapers} subtitle="Analyzed & indexed" color="from-violet-500 to-purple-600" />
        <StatCard icon={<Gauge className="h-5 w-5" />} title="Properties" value={stats.totalProperties} subtitle="Extracted from literature" color="from-emerald-500 to-teal-600" />
        <StatCard icon={<GitBranch className="h-5 w-5" />} title="Knowledge Edges" value={stats.totalEdges} subtitle="Material relationships" color="from-rose-500 to-pink-600" />
      </div>

      {/* Pipeline Overview */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-amber-400" /> AI-Powered Materials Discovery Pipeline
          </CardTitle>
          <CardDescription className="text-slate-300">
            From scientific literature to material recommendations using NLP and Large Language Models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-4">
            {[
              { icon: <FileText className="h-5 w-5" />, label: 'Research Papers', sub: 'PDF/XML input' },
              { icon: <ArrowRight className="h-4 w-4 text-amber-400" />, label: '', sub: '' },
              { icon: <Search className="h-5 w-5" />, label: 'PDF Parser', sub: 'Text extraction' },
              { icon: <ArrowRight className="h-4 w-4 text-amber-400" />, label: '', sub: '' },
              { icon: <Brain className="h-5 w-5" />, label: 'LLM + NER', sub: 'MatSciBERT/SciBERT' },
              { icon: <ArrowRight className="h-4 w-4 text-amber-400" />, label: '', sub: '' },
              { icon: <Network className="h-5 w-5" />, label: 'Knowledge Graph', sub: 'Relations extraction' },
              { icon: <ArrowRight className="h-4 w-4 text-amber-400" />, label: '', sub: '' },
              { icon: <Target className="h-5 w-5" />, label: 'Prediction', sub: 'Material ranking' },
              { icon: <ArrowRight className="h-4 w-4 text-amber-400" />, label: '', sub: '' },
              { icon: <Lightbulb className="h-5 w-5" />, label: 'Recommendation', sub: 'New materials' },
            ].map((step, i) => step.label ? (
              <div key={i} className="flex flex-col items-center gap-1 rounded-lg bg-white/10 px-3 py-2 sm:px-4 sm:py-3 backdrop-blur min-w-[70px]">
                <div className="text-amber-400">{step.icon}</div>
                <span className="text-xs font-medium text-center">{step.label}</span>
                <span className="text-[10px] text-slate-400 text-center">{step.sub}</span>
              </div>
            ) : (
              <div key={i} className="text-amber-400">{step.icon}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Materials by Category</CardTitle>
            <CardDescription>Distribution across research domains</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
            <CardDescription>Proportion of materials by domain</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, count }) => `${category}: ${count}`}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart + Recent Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Category Performance Comparison</CardTitle>
            <CardDescription>Multi-dimensional property assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Battery" dataKey="battery" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Radar name="Semiconductor" dataKey="semiconductor" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                <Radar name="Solar" dataKey="solar" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
                <Radar name="Catalyst" dataKey="catalyst" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Recent Materials</CardTitle>
            <CardDescription>Latest additions to the knowledge base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentMaterials.slice(0, 6).map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white text-xs font-bold" style={{ backgroundColor: CATEGORY_COLORS[m.category] || '#94a3b8' }}>
                    {m.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.formula} &middot; {m.category}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {Math.round(m.confidence * 100)}% conf
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ML Techniques Overview */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" /> ML Techniques Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'SciBERT', desc: 'Scientific text understanding', icon: <Brain className="h-4 w-4" /> },
              { name: 'MatSciBERT', desc: 'Materials domain model', icon: <Atom className="h-4 w-4" /> },
              { name: 'NER', desc: 'Named Entity Recognition', icon: <Search className="h-4 w-4" /> },
              { name: 'RAG', desc: 'Retrieval-Augmented Gen', icon: <Database className="h-4 w-4" /> },
              { name: 'GNN', desc: 'Graph Neural Networks', icon: <Network className="h-4 w-4" /> },
              { name: 'XGBoost', desc: 'Ensemble prediction', icon: <TrendingUp className="h-4 w-4" /> },
            ].map((tech, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition text-center">
                <div className="text-violet-500">{tech.icon}</div>
                <span className="font-semibold text-sm">{tech.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{tech.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, title, value, subtitle, color }: { icon: React.ReactNode; title: string; value: number; subtitle: string; color: string }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// MATERIALS VIEW
// ============================================================
function MaterialsView({ materials, loading, onRefresh }: { materials: Material[]; loading: boolean; onRefresh: () => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  const filtered = materials.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.formula.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'all' || m.category === category
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search materials by name or formula..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="battery">Battery</SelectItem>
                <SelectItem value="semiconductor">Semiconductor</SelectItem>
                <SelectItem value="solar">Solar</SelectItem>
                <SelectItem value="catalyst">Catalyst</SelectItem>
                <SelectItem value="alloy">Alloy</SelectItem>
                <SelectItem value="polymer">Polymer</SelectItem>
                <SelectItem value="ceramic">Ceramic</SelectItem>
                <SelectItem value="biomedical">Biomedical</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="h-10 flex items-center px-3">
              {filtered.length} materials
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <Card key={m.id} className="shadow-md hover:shadow-xl transition-all cursor-pointer group" onClick={() => setSelectedMaterial(m)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: CATEGORY_COLORS[m.category] || '#94a3b8' }}>
                      {CATEGORY_ICONS[m.category] || <Atom className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm group-hover:text-amber-600 transition">{m.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{m.formula}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]" style={{ borderColor: CATEGORY_COLORS[m.category], color: CATEGORY_COLORS[m.category] }}>
                    {m.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{m.description}</p>
                <div className="space-y-1">
                  {m.properties?.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{formatPropertyName(p.propertyName)}</span>
                      <span className="font-medium">{p.propertyValue} {p.unit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${m.confidence * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{Math.round(m.confidence * 100)}%</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Details <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Material Detail Dialog */}
      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMaterial && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: CATEGORY_COLORS[selectedMaterial.category] || '#94a3b8' }}>
                    {CATEGORY_ICONS[selectedMaterial.category] || <Atom className="h-4 w-4" />}
                  </div>
                  {selectedMaterial.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedMaterial.formula} &middot; {selectedMaterial.category} &middot; Confidence: {Math.round(selectedMaterial.confidence * 100)}%
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedMaterial.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Properties</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMaterial.properties?.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium text-sm">{formatPropertyName(p.propertyName)}</TableCell>
                          <TableCell className="text-sm">{p.propertyValue} {p.unit}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Progress value={p.confidence * 100} className="h-1.5 w-12" />
                              <span className="text-xs text-muted-foreground">{Math.round(p.confidence * 100)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// EXTRACT VIEW
// ============================================================
function ExtractView({ onExtracted }: { onExtracted: () => void }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [extracting, setExtracting] = useState(false)

  const sampleText = `Recent advances in lithium iron phosphate (LiFePO4) batteries show energy density of 170 Wh/kg with cycle life exceeding 2000 cycles. Researchers at MIT found that lithium nickel manganese cobalt oxide (NMC) cathodes can achieve energy density of 200 Wh/kg with improved thermal stability. Meanwhile, perovskite solar cells using methylammonium lead iodide (CH3NH3PbI3) have reached power conversion efficiency of 25.5%. Silicon carbide (SiC) wide-bandgap semiconductors demonstrate thermal conductivity of 490 W/mK and band gap of 3.26 eV. Graphene oxide synthesized at 700°C shows band gap of 2.1 eV. Titanium dioxide (TiO2) photocatalysts achieve surface area of 50 m²/g with band gap of 3.2 eV.`

  const handleExtract = async () => {
    if (!text.trim()) return
    setExtracting(true)
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        onExtracted()
      }
    } catch (e) { console.error(e) }
    finally { setExtracting(false) }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> NLP-Powered Material Extraction
          </CardTitle>
          <CardDescription>
            Paste scientific text and our NER pipeline will extract materials, properties, and relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste scientific paper text here..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExtract} disabled={extracting || !text.trim()} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
              {extracting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting...</> : <><Sparkles className="h-4 w-4 mr-2" /> Extract Materials</>}
            </Button>
            <Button variant="outline" onClick={() => setText(sampleText)}>
              <FileText className="h-4 w-4 mr-2" /> Load Sample Text
            </Button>
            <Button variant="ghost" onClick={() => { setText(''); setResult(null) }}>
              <X className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Results */}
      {result && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Materials Found', value: result.stats.materialsFound, icon: <Atom className="h-4 w-4" />, color: 'text-amber-500' },
              { label: 'Properties', value: result.stats.propertiesFound, icon: <Gauge className="h-4 w-4" />, color: 'text-emerald-500' },
              { label: 'Relations', value: result.stats.relationsFound, icon: <GitBranch className="h-4 w-4" />, color: 'text-violet-500' },
              { label: 'Avg Confidence', value: `${Math.round(result.stats.avgConfidence * 100)}%`, icon: <Target className="h-4 w-4" />, color: 'text-rose-500' },
              { label: 'Text Length', value: result.stats.textLength, icon: <FileText className="h-4 w-4" />, color: 'text-sky-500' },
            ].map((s, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-2">
                  <span className={s.color}>{s.icon}</span>
                  <div>
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <Card className="shadow-md border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-1"><Brain className="h-4 w-4 text-amber-500" /> AI Summary</h4>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          {/* Extracted Materials */}
          {result.materials.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Extracted Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.materials.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold" style={{ backgroundColor: CATEGORY_COLORS[m.category] || '#94a3b8' }}>
                        {m.category.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{m.name} <span className="text-muted-foreground font-mono">({m.formula})</span></p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{m.context}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{Math.round(m.confidence * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Properties */}
          {result.properties.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Extracted Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.properties.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{formatPropertyName(p.name)}</TableCell>
                        <TableCell className="text-sm font-mono">{p.value}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.unit}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{Math.round(p.confidence * 100)}%</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Relations */}
          {result.relations.length > 0 && (
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Extracted Relations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.relations.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                      <Badge variant="outline">{r.source}</Badge>
                      <ArrowRight className="h-3 w-3 text-amber-500" />
                      <Badge variant="secondary" className="text-[10px]">{r.type.replace(/_/g, ' ')}</Badge>
                      <ArrowRight className="h-3 w-3 text-amber-500" />
                      <Badge variant="outline">{r.target}</Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto">{Math.round(r.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// KNOWLEDGE GRAPH VIEW
// ============================================================
function KnowledgeGraphView({ materials }: { materials: Material[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] } | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    fetch('/api/knowledge-graph')
      .then(r => r.json())
      .then(data => setGraphData(data))
      .catch(console.error)
  }, [])

  const filteredNodes = graphData?.nodes.filter(n => filterCategory === 'all' || n.category === filterCategory) || []
  const nodeIds = new Set(filteredNodes.map(n => n.id))
  const filteredEdges = graphData?.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)) || []

  // Canvas-based graph rendering
  useEffect(() => {
    if (!canvasRef.current || filteredNodes.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.parentElement?.getBoundingClientRect()
    canvas.width = (rect?.width || 800) * 2
    canvas.height = 600 * 2
    canvas.style.width = `${rect?.width || 800}px`
    canvas.style.height = '600px'
    ctx.scale(2, 2)

    const w = rect?.width || 800
    const h = 600

    ctx.clearRect(0, 0, w, h)

    // Position nodes in a circular layout grouped by category
    const catGroups: Record<string, typeof filteredNodes> = {}
    filteredNodes.forEach(n => {
      if (!catGroups[n.category]) catGroups[n.category] = []
      catGroups[n.category].push(n)
    })

    const categories = Object.keys(catGroups)
    const positions: Record<string, { x: number; y: number }> = {}

    categories.forEach((cat, ci) => {
      const angle = (ci / categories.length) * Math.PI * 2 - Math.PI / 2
      const cx = w / 2 + Math.cos(angle) * (Math.min(w, h) * 0.3)
      const cy = h / 2 + Math.sin(angle) * (Math.min(w, h) * 0.3)
      
      catGroups[cat].forEach((node, ni) => {
        const subAngle = (ni / catGroups[cat].length) * Math.PI * 2
        const subRadius = Math.min(80, catGroups[cat].length * 12)
        positions[node.id] = {
          x: cx + Math.cos(subAngle) * subRadius,
          y: cy + Math.sin(subAngle) * subRadius,
        }
      })
    })

    // Draw edges
    filteredEdges.forEach(edge => {
      const src = positions[edge.source]
      const tgt = positions[edge.target]
      if (!src || !tgt) return

      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      ctx.strokeStyle = hoveredNode === edge.source || hoveredNode === edge.target ? 'rgba(245, 158, 11, 0.6)' : 'rgba(148, 163, 184, 0.2)'
      ctx.lineWidth = hoveredNode === edge.source || hoveredNode === edge.target ? 2 : 1
      ctx.stroke()

      // Edge label
      const mx = (src.x + tgt.x) / 2
      const my = (src.y + tgt.y) / 2
      if (hoveredNode === edge.source || hoveredNode === edge.target) {
        ctx.fillStyle = '#64748b'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(edge.relationType.replace(/_/g, ' '), mx, my - 4)
      }
    })

    // Draw nodes
    filteredNodes.forEach(node => {
      const pos = positions[node.id]
      if (!pos) return

      const isHovered = hoveredNode === node.id
      const radius = isHovered ? 18 : 14

      // Node circle
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = CATEGORY_COLORS[node.category] || '#94a3b8'
      ctx.fill()
      ctx.strokeStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.5)'
      ctx.lineWidth = isHovered ? 3 : 1.5
      ctx.stroke()

      // Node label
      ctx.fillStyle = '#1e293b'
      ctx.font = `${isHovered ? 'bold ' : ''}10px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(node.name.length > 12 ? node.name.slice(0, 10) + '...' : node.name, pos.x, pos.y + radius + 14)
    })

    // Category legend
    let ly = 20
    categories.forEach(cat => {
      ctx.beginPath()
      ctx.arc(15, ly, 5, 0, Math.PI * 2)
      ctx.fillStyle = CATEGORY_COLORS[cat] || '#94a3b8'
      ctx.fill()
      ctx.fillStyle = '#475569'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(cat.charAt(0).toUpperCase() + cat.slice(1), 25, ly + 3)
      ly += 18
    })

  }, [filteredNodes, filteredEdges, hoveredNode])

  // Mouse hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const catGroups: Record<string, typeof filteredNodes> = {}
    filteredNodes.forEach(n => {
      if (!catGroups[n.category]) catGroups[n.category] = []
      catGroups[n.category].push(n)
    })

    const categories = Object.keys(catGroups)
    const w = rect.width
    const h = rect.height
    let found: string | null = null

    categories.forEach((cat, ci) => {
      const angle = (ci / categories.length) * Math.PI * 2 - Math.PI / 2
      const cx = w / 2 + Math.cos(angle) * (Math.min(w, h) * 0.3)
      const cy = h / 2 + Math.sin(angle) * (Math.min(w, h) * 0.3)
      
      catGroups[cat].forEach((node, ni) => {
        const subAngle = (ni / catGroups[cat].length) * Math.PI * 2
        const subRadius = Math.min(80, catGroups[cat].length * 12)
        const nx = cx + Math.cos(subAngle) * subRadius
        const ny = cy + Math.sin(subAngle) * subRadius
        
        if (Math.hypot(x - nx, y - ny) < 18) found = node.id
      })
    })

    setHoveredNode(found)
  }, [filteredNodes])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Network className="h-5 w-5 text-violet-500" /> Materials Knowledge Graph</h3>
          <p className="text-sm text-muted-foreground">Interactive visualization of material relationships and connections</p>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="battery">Battery</SelectItem>
            <SelectItem value="semiconductor">Semiconductor</SelectItem>
            <SelectItem value="solar">Solar</SelectItem>
            <SelectItem value="catalyst">Catalyst</SelectItem>
            <SelectItem value="alloy">Alloy</SelectItem>
            <SelectItem value="polymer">Polymer</SelectItem>
            <SelectItem value="ceramic">Ceramic</SelectItem>
            <SelectItem value="biomedical">Biomedical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-md overflow-hidden">
        <div className="relative">
          <canvas ref={canvasRef} onMouseMove={handleMouseMove} className="w-full cursor-crosshair bg-gradient-to-br from-slate-50 to-white" />
          {hoveredNode && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg border text-xs max-w-[250px]">
              <p className="font-semibold">{filteredNodes.find(n => n.id === hoveredNode)?.name}</p>
              <p className="text-muted-foreground">{filteredNodes.find(n => n.id === hoveredNode)?.formula}</p>
              <p className="text-muted-foreground mt-1">Properties: {filteredNodes.find(n => n.id === hoveredNode)?.propertyCount || 0}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Edge summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['alternative_to', 'improves', 'related_to', 'used_in'].map(type => {
          const count = filteredEdges.filter(e => e.relationType === type).length
          return (
            <Card key={type} className="shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-violet-500">{count}</p>
                <p className="text-[10px] text-muted-foreground">{type.replace(/_/g, ' ')}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// PREDICT VIEW
// ============================================================
function PredictView() {
  const [category, setCategory] = useState('battery')
  const [predicting, setPredicting] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)

  const handlePredict = async () => {
    setPredicting(true)
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      if (res.ok) setResult(await res.json())
    } catch (e) { console.error(e) }
    finally { setPredicting(false) }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-rose-500" /> Material Recommendation Engine
          </CardTitle>
          <CardDescription>
            AI-powered material discovery using knowledge-graph-enhanced prediction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Material Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="battery">Battery Materials</SelectItem>
                  <SelectItem value="semiconductor">Semiconductors</SelectItem>
                  <SelectItem value="solar">Solar Materials</SelectItem>
                  <SelectItem value="catalyst">Catalysts</SelectItem>
                  <SelectItem value="alloy">Alloys</SelectItem>
                  <SelectItem value="polymer">Polymers</SelectItem>
                  <SelectItem value="ceramic">Ceramics</SelectItem>
                  <SelectItem value="biomedical">Biomedical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handlePredict} disabled={predicting} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                {predicting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Predicting...</> : <><Sparkles className="h-4 w-4 mr-2" /> Get Recommendations</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Methodology */}
          <Card className="shadow-md border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-1"><Cpu className="h-4 w-4 text-violet-500" /> Methodology</h4>
              <p className="text-xs text-muted-foreground">{result.methodology}</p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Recommended Materials</CardTitle>
              <CardDescription>Ranked by predicted performance score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-lg">
                      #{i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{rec.name}</h4>
                        <Badge variant="outline" className="font-mono text-xs">{rec.formula}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-rose-500">{(rec.score * 100).toFixed(0)}%</div>
                      <p className="text-[10px] text-muted-foreground">Match Score</p>
                    </div>
                    <div className="w-24">
                      <Progress value={rec.score * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Score Chart */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Recommendation Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={result.recommendations.map(r => ({ name: r.name, score: Math.round(r.score * 100), fill: CATEGORY_COLORS[category] || '#94a3b8' }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {result.recommendations.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// ============================================================
// CHAT VIEW
// ============================================================
function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Welcome to MatDiscoverAI Chat! I can help you with questions about materials science, NLP techniques for materials discovery, and our knowledge base. Ask me about battery materials, semiconductors, solar cells, catalysts, or any other material domain.', sources: ['System Knowledge Base'] }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources }])
      }
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const suggestions = [
    'What are the best battery materials?',
    'Explain perovskite solar cells',
    'How does NLP help materials discovery?',
    'Compare LiFePO4 vs NMC batteries',
    'What are wide-bandgap semiconductors?',
    'Tell me about solid electrolytes',
  ]

  return (
    <div className="space-y-4 h-[calc(100vh-12rem)] flex flex-col">
      <Card className="shadow-md flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-amber-500" /> AI Materials Assistant
            <Badge variant="secondary" className="text-[10px]">RAG-Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full max-h-[calc(100vh-20rem)] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1">
                        {msg.sources.map((s, si) => (
                          <Badge key={si} variant="outline" className="text-[9px]">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <Button key={i} variant="outline" size="sm" className="text-xs h-8" onClick={() => { setInput(s); }}>
              {s}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Ask about materials, properties, or NLP techniques..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()} className="bg-gradient-to-r from-amber-500 to-orange-600">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// PAPERS VIEW
// ============================================================
function PapersView({ papers, loading }: { papers: ResearchPaper[]; loading: boolean }) {
  const [search, setSearch] = useState('')

  const filtered = papers.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.authors.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5 text-amber-500" /> Research Papers</h3>
          <p className="text-sm text-muted-foreground">Analyzed scientific literature in the knowledge base</p>
        </div>
        <Badge variant="secondary">{filtered.length} papers</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search papers by title or author..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <Card key={p.id} className="shadow-md hover:shadow-lg transition">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{p.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{p.authors} &middot; {p.year}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.abstract}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.journal && <Badge variant="outline" className="text-[10px]">{p.journal}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                      {p.keywords?.split(',').map((k, ki) => (
                        <Badge key={ki} variant="outline" className="text-[10px]">{k.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                  {p.doi && (
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// ABOUT VIEW
// ============================================================
function AboutView() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Atom className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">MatDiscoverAI</h2>
              <p className="text-slate-300">LLM-Based Scientific Knowledge Extraction and Materials Discovery Framework</p>
            </div>
          </div>
          <p className="text-slate-300 leading-relaxed">
            MatDiscoverAI is an AI-powered research platform that automatically extracts material knowledge from scientific literature using Large Language Models and Natural Language Processing. It builds structured knowledge bases and provides intelligent material recommendations to accelerate materials discovery across battery, semiconductor, solar, catalyst, alloy, polymer, ceramic, and biomedical domains.
          </p>
        </CardContent>
      </Card>

      {/* Architecture */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-5 w-5 text-violet-500" /> System Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Frontend Layer', desc: 'Next.js 16 + React + TypeScript + Tailwind CSS + shadcn/ui + Recharts', icon: <Globe className="h-5 w-5" />, color: 'text-sky-500' },
              { title: 'API & ML Layer', desc: 'Next.js API Routes + ML Pipeline Service (NER, RAG, Prediction) + Knowledge Graph', icon: <Brain className="h-5 w-5" />, color: 'text-violet-500' },
              { title: 'Data Layer', desc: 'Prisma ORM + SQLite + Material Database + Paper Repository + Chat History', icon: <Database className="h-5 w-5" />, color: 'text-emerald-500' },
            ].map((layer, i) => (
              <div key={i} className="p-4 rounded-xl border bg-gradient-to-br from-white to-slate-50">
                <div className={`mb-2 ${layer.color}`}>{layer.icon}</div>
                <h4 className="font-semibold text-sm">{layer.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{layer.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ML Techniques Detail */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Brain className="h-5 w-5 text-amber-500" /> ML Techniques & Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'SciBERT', desc: 'Pre-trained BERT model on 1.14M scientific papers from Semantic Scholar. Understands scientific language context for NER and relation extraction.', use: 'Paper understanding, entity recognition' },
              { name: 'MatSciBERT', desc: 'Domain-specific BERT fine-tuned on 3.27M materials science abstracts. Outperforms SciBERT on materials NER tasks by 8-12%.', use: 'Material entity extraction, property identification' },
              { name: 'Named Entity Recognition (NER)', desc: 'Identifies material names, properties, synthesis methods, and applications from unstructured text using token classification.', use: 'Extracting structured data from papers' },
              { name: 'Relation Extraction', desc: 'Identifies relationships between extracted entities (e.g., material-has_property, material-used_in-application) using dependency parsing.', use: 'Building knowledge graphs' },
              { name: 'RAG (Retrieval-Augmented Generation)', desc: 'Combines LLM generation with knowledge base retrieval for accurate, cited responses. Reduces hallucination by grounding outputs in extracted data.', use: 'Chat Q&A, material recommendations' },
              { name: 'Graph Neural Networks', desc: 'Learns from knowledge graph structure to predict material properties and discover new material candidates through link prediction.', use: 'Property prediction, material discovery' },
              { name: 'XGBoost Ensemble', desc: 'Gradient boosting framework used for material property prediction and ranking. Handles mixed feature types from both NLP and numerical sources.', use: 'Performance prediction, material ranking' },
              { name: 'LangChain / LLM Agents', desc: 'Orchestrates the extraction pipeline with tool-use capabilities. Enables autonomous literature search, data extraction, and hypothesis generation.', use: 'Pipeline orchestration, autonomous research' },
            ].map((tech, i) => (
              <div key={i} className="p-4 rounded-lg border hover:shadow-md transition">
                <h4 className="font-semibold text-sm flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-amber-500" /> {tech.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">{tech.desc}</p>
                <Badge variant="secondary" className="mt-2 text-[9px]">{tech.use}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Datasets */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Database className="h-5 w-5 text-emerald-500" /> Datasets & Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dataset</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['Materials Project', 'materialsproject.org', 'Computational materials database with 150K+ materials and calculated properties'],
                ['arXiv', 'arxiv.org', 'Open-access repository of 2M+ scientific papers including materials science'],
                ['Semantic Scholar', 'semanticscholar.org', 'Academic search with 200M+ papers and structured metadata'],
                ['OpenAlex', 'openalex.org', 'Open catalog of 250M+ scholarly works with citation data'],
                ['Springer Nature', 'springernature.com', 'Scientific publisher with 13M+ documents (API access required)'],
                ['Elsevier', 'dev.elsevier.com', 'ScienceDirect API for full-text access (subscription required)'],
              ].map(([name, source, desc], i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{source}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Capstone Alignment */}
      <Card className="shadow-md border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-5 w-5 text-amber-500" /> ML Capstone Alignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Phase 1: Problem Statement (30+30+30+10)</h4>
            <div className="mt-2 space-y-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium">Selection of Problem (30 marks)</p>
                <p className="text-xs text-muted-foreground">Materials knowledge is scattered across millions of research papers. Manual extraction is slow, expensive, and error-prone. Our AI system automates this using NLP and LLMs.</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium">Understanding of Problem (30 marks)</p>
                <p className="text-xs text-muted-foreground">Scientific Papers → PDF Parser → Text Cleaning → LLM Understanding → Material/Property Extraction → Knowledge Graph → Material Recommendation</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium">Dataset & ML Technique (30 marks)</p>
                <p className="text-xs text-muted-foreground">Datasets: Materials Project, arXiv, Semantic Scholar, OpenAlex. ML: MatSciBERT, SciBERT, NER, RAG, GNN, XGBoost, LangChain</p>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm">Phase 2: Features & Learning Techniques</h4>
            <p className="text-xs text-muted-foreground mt-1">Feature extraction from text (TF-IDF, BERT embeddings), categorical features (material type, domain), numerical features (property values). Learning: Supervised NER, unsupervised clustering, graph-based prediction.</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm">Phase 3: End Sem Evaluation</h4>
            <p className="text-xs text-muted-foreground mt-1">Complete pipeline with dataset handling, preprocessing, algorithmic design, and convincing results for material extraction and prediction tasks.</p>
          </div>
        </CardContent>
      </Card>

      {/* Deployment */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-5 w-5 text-sky-500" /> Deployment Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { platform: 'Vercel (Recommended)', desc: 'Zero-config deployment for Next.js. Push to GitHub → Auto-deploy. Free tier supports hobby projects.', cmd: 'npx vercel' },
              { platform: 'Docker + AWS/GCP', desc: 'Containerized deployment for production. Use Dockerfile for reproducible builds.', cmd: 'docker build -t matdiscover . && docker run -p 3000:3000 matdiscover' },
              { platform: 'Railway / Render', desc: 'PaaS with built-in CI/CD. Connect GitHub repo for auto-deployment. Supports Node.js and Python services.', cmd: 'railway up' },
              { platform: 'Local Development', desc: 'Run locally with Bun runtime for development and testing.', cmd: 'bun install && bun run db:push && bun run dev' },
            ].map((dep, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <h4 className="font-semibold text-sm">{dep.platform}</h4>
                <p className="text-xs text-muted-foreground mt-1">{dep.desc}</p>
                <code className="mt-2 block rounded bg-slate-100 px-3 py-1.5 text-xs font-mono">{dep.cmd}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              'Next.js 16', 'React 19', 'TypeScript 5', 'Tailwind CSS 4',
              'shadcn/ui', 'Prisma ORM', 'SQLite', 'Recharts',
              'Bun Runtime', 'Framer Motion', 'Zustand', 'Zod',
            ].map((tech, i) => (
              <div key={i} className="p-2 rounded-lg border text-center text-xs font-medium hover:shadow-sm transition">{tech}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// HELPERS
// ============================================================
function formatPropertyName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  )
}
