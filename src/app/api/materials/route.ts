import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/materials - List materials with search, filter, and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.MaterialWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { formula: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Get total count for pagination
    const total = await db.material.count({ where });

    // Get materials with properties and relations
    const materials = await db.material.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
      include: {
        properties: {
          orderBy: { propertyName: 'asc' },
        },
        sourceEdges: {
          include: {
            targetEntity: {
              select: { id: true, name: true, formula: true, category: true },
            },
          },
        },
        targetEdges: {
          include: {
            sourceEntity: {
              select: { id: true, name: true, formula: true, category: true },
            },
          },
        },
      },
    });

    // Format relations
    const formattedMaterials = materials.map((mat) => ({
      ...mat,
      relations: [
        ...mat.sourceEdges.map((e) => ({
          id: e.id,
          type: e.relationType,
          direction: 'outgoing',
          relatedMaterial: e.targetEntity,
          confidence: e.confidence,
        })),
        ...mat.targetEdges.map((e) => ({
          id: e.id,
          type: e.relationType,
          direction: 'incoming',
          relatedMaterial: e.sourceEntity,
          confidence: e.confidence,
        })),
      ],
      sourceEdges: undefined,
      targetEdges: undefined,
    }));

    return NextResponse.json({
      materials: formattedMaterials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Materials GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST /api/materials - Create a new material with properties
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      formula,
      category,
      description,
      source,
      confidence,
      properties,
    } = body as {
      name: string;
      formula: string;
      category: string;
      description?: string;
      source?: string;
      confidence?: number;
      properties?: Array<{
        propertyName: string;
        propertyValue: string;
        unit: string;
        temperature?: string;
        pressure?: string;
        source?: string;
        confidence?: number;
      }>;
    };

    // Validate required fields
    if (!name || !formula || !category) {
      return NextResponse.json(
        { error: 'Name, formula, and category are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.material.findFirst({
      where: { formula },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Material with formula ${formula} already exists` },
        { status: 409 }
      );
    }

    // Create material with properties
    const material = await db.material.create({
      data: {
        name,
        formula,
        category,
        description: description || '',
        source: source || 'manual',
        confidence: confidence ?? 1.0,
        properties: {
          create: (properties || []).map((p) => ({
            propertyName: p.propertyName,
            propertyValue: p.propertyValue,
            unit: p.unit,
            temperature: p.temperature,
            pressure: p.pressure,
            source: p.source || 'manual',
            confidence: p.confidence ?? 1.0,
          })),
        },
      },
      include: {
        properties: true,
      },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('Materials POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}
