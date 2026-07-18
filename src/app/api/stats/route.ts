import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    // Total counts
    const totalMaterials = await db.material.count();
    const totalPapers = await db.researchPaper.count();
    const totalProperties = await db.materialProperty.count();
    const totalEdges = await db.knowledgeEdge.count();
    const totalEntities = await db.extractedEntity.count();

    // Materials by category
    const materialsByCategoryRaw = await db.material.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    const materialsByCategory = materialsByCategoryRaw.map((item) => ({
      category: item.category,
      count: item._count.category,
    }));

    // Category distribution for charts
    const categoryDistribution = materialsByCategoryRaw.map((item) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      value: item._count.category,
      category: item.category,
    }));

    // Recent materials (last 5)
    const recentMaterials = await db.material.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        properties: true,
      },
    });

    // Edge type distribution
    const edgesByTypeRaw = await db.knowledgeEdge.groupBy({
      by: ['relationType'],
      _count: { relationType: true },
      orderBy: { _count: { relationType: 'desc' } },
    });

    const edgesByType = edgesByTypeRaw.map((item) => ({
      type: item.relationType,
      count: item._count.relationType,
    }));

    // Paper status distribution
    const papersByStatusRaw = await db.researchPaper.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const papersByStatus = papersByStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Average confidence
    const avgConfidenceResult = await db.material.aggregate({
      _avg: { confidence: true },
    });

    return NextResponse.json({
      totalMaterials,
      totalPapers,
      totalProperties,
      totalEdges,
      totalEntities,
      materialsByCategory,
      categoryDistribution,
      recentMaterials,
      edgesByType,
      papersByStatus,
      averageConfidence: avgConfidenceResult._avg.confidence ?? 0,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
