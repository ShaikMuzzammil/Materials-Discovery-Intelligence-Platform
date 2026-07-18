import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/papers - List all papers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ResearchPaperWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { authors: { contains: search } },
        { abstract: { contains: search } },
        { keywords: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const total = await db.researchPaper.count({ where });

    const papers = await db.researchPaper.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        entities: {
          take: 20,
          orderBy: { confidence: 'desc' },
        },
      },
    });

    // Add entity count
    const papersWithCount = papers.map((paper) => ({
      ...paper,
      entityCount: paper.entities.length,
    }));

    return NextResponse.json({
      papers: papersWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Papers GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}

// POST /api/papers - Register a new paper
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      authors,
      abstract,
      year,
      doi,
      journal,
      filePath,
      keywords,
    } = body as {
      title: string;
      authors: string;
      abstract?: string;
      year: number;
      doi?: string;
      journal?: string;
      filePath?: string;
      keywords?: string;
    };

    // Validate required fields
    if (!title || !authors || !year) {
      return NextResponse.json(
        { error: 'Title, authors, and year are required' },
        { status: 400 }
      );
    }

    // Check for duplicate by DOI or title
    if (doi) {
      const existing = await db.researchPaper.findFirst({
        where: { doi },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Paper with DOI ${doi} already exists` },
          { status: 409 }
        );
      }
    }

    const paper = await db.researchPaper.create({
      data: {
        title,
        authors,
        abstract: abstract || '',
        year,
        doi,
        journal,
        filePath,
        keywords,
        status: 'uploaded',
      },
      include: {
        entities: true,
      },
    });

    return NextResponse.json({ paper }, { status: 201 });
  } catch (error) {
    console.error('Papers POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to create paper' },
      { status: 500 }
    );
  }
}
