import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/knowledge-graph - Returns nodes and edges for graph visualization
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || '';
    const maxNodes = parseInt(searchParams.get('maxNodes') || '100', 10);

    // Build where clause for materials (nodes)
    const materialWhere = category ? { category } : {};

    // Fetch materials (nodes)
    const materials = await db.material.findMany({
      where: materialWhere,
      take: maxNodes,
      include: {
        properties: true,
      },
      orderBy: { confidence: 'desc' },
    });

    const materialIds = new Set(materials.map((m) => m.id));

    // Fetch knowledge edges (only between materials in our set)
    const edges = await db.knowledgeEdge.findMany({
      where: {
        sourceEntityId: { in: Array.from(materialIds) },
        targetEntityId: { in: Array.from(materialIds) },
      },
      include: {
        sourceEntity: {
          select: { id: true, name: true, formula: true, category: true },
        },
        targetEntity: {
          select: { id: true, name: true, formula: true, category: true },
        },
      },
    });

    // Format nodes for visualization
    const nodes = materials.map((mat) => ({
      id: mat.id,
      label: mat.formula,
      name: mat.name,
      category: mat.category,
      confidence: mat.confidence,
      source: mat.source,
      properties: mat.properties.map((p) => ({
        name: p.propertyName,
        value: p.propertyValue,
        unit: p.unit,
      })),
      // Position will be computed client-side by force layout
    }));

    // Format edges for visualization
    const formattedEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceEntityId,
      target: edge.targetEntityId,
      type: edge.relationType,
      confidence: edge.confidence,
      sourceLabel: edge.sourceEntity.formula,
      targetLabel: edge.targetEntity.formula,
    }));

    // Category color mapping for visualization
    const categoryColors: Record<string, string> = {
      battery: '#ef4444',
      semiconductor: '#f59e0b',
      solar: '#22c55e',
      catalyst: '#06b6d4',
      alloy: '#8b5cf6',
      polymer: '#ec4899',
      ceramic: '#f97316',
      biomedical: '#14b8a6',
    };

    // Category counts for legend
    const categoryCounts: Record<string, number> = {};
    for (const mat of materials) {
      categoryCounts[mat.category] = (categoryCounts[mat.category] || 0) + 1;
    }

    return NextResponse.json({
      nodes,
      edges: formattedEdges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: formattedEdges.length,
        categoryColors,
        categoryCounts,
        categories: Object.keys(categoryCounts),
      },
    });
  } catch (error) {
    console.error('Knowledge graph API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge graph' },
      { status: 500 }
    );
  }
}
