import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ChatMLResponse {
  answer: string;
  sources: string[];
}

// POST /api/chat - Chat with the RAG-enhanced assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body as { message: string };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Save user message to database
    const userMessage = await db.chatMessage.create({
      data: {
        role: 'user',
        content: message,
      },
    });

    // Call the ML pipeline chat endpoint
    let assistantContent: string;
    let sources: string[] = [];

    try {
      const mlResponse = await fetch('/api/chat?XTransformPort=3030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (mlResponse.ok) {
        const mlResult = (await mlResponse.json()) as ChatMLResponse;
        assistantContent = mlResult.answer;
        sources = mlResult.sources || [];
      } else {
        console.error('ML chat pipeline error:', mlResponse.status);
        assistantContent = generateFallbackResponse(message);
        sources = ['Local Knowledge Base'];
      }
    } catch (fetchError) {
      console.error('ML chat pipeline fetch error:', fetchError);
      assistantContent = generateFallbackResponse(message);
      sources = ['Local Knowledge Base'];
    }

    // Enrich response with database context
    const dbSources = await enrichWithDatabaseContext(message);
    if (dbSources.length > 0) {
      sources = [...sources, ...dbSources];
    }

    // Save assistant response to database
    const assistantMessage = await db.chatMessage.create({
      data: {
        role: 'assistant',
        content: assistantContent,
        sources: JSON.stringify(sources),
      },
    });

    return NextResponse.json({
      message: assistantMessage,
      userMessageId: userMessage.id,
      sources,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// Fallback response generator when ML pipeline is unavailable
function generateFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('battery') || lowerMsg.includes('lifepo4') || lowerMsg.includes('cathode')) {
    return 'Battery materials research focuses on improving energy density, cycle life, and safety. LiFePO4 offers excellent safety with ~170 mAh/g capacity and 2000+ cycles. NMC cathodes provide higher energy density (~200 mAh/g) but at higher cost. Solid electrolytes like LLZO enable next-generation solid-state batteries.';
  }
  if (lowerMsg.includes('semiconductor') || lowerMsg.includes('sic') || lowerMsg.includes('bandgap')) {
    return 'Wide-bandgap semiconductors like SiC and GaN are revolutionizing power electronics. SiC offers 3.26 eV bandgap vs Si\'s 1.12 eV, enabling higher voltage and temperature operation. 2D materials like graphene and MXenes show promise for next-generation transistors.';
  }
  if (lowerMsg.includes('solar') || lowerMsg.includes('perovskite') || lowerMsg.includes('photovoltaic')) {
    return 'Perovskite solar cells (CH3NH3PbI3) have achieved >25% PCE in lab settings, rivaling silicon. CIGS thin-film cells offer flexibility and ~23% efficiency. Stability and lead toxicity remain key challenges for perovskite commercialization.';
  }
  if (lowerMsg.includes('catalyst') || lowerMsg.includes('platinum') || lowerMsg.includes('mof')) {
    return 'Platinum group metals remain the gold standard for electrocatalysis but cost drives research into alternatives. TiO2 photocatalysis enables water splitting and pollutant degradation. MOFs provide unprecedented surface area for heterogeneous catalysis.';
  }

  return 'I can help you with questions about battery materials, semiconductors, solar cells, catalysts, alloys, polymers, ceramics, and biomedical materials. Please ask about a specific material, property, or methodology.';
}

// Enrich with database context
async function enrichWithDatabaseContext(message: string): Promise<string[]> {
  const sources: string[] = [];
  const lowerMsg = message.toLowerCase();

  try {
    // Search for relevant materials in the database
    const materials = await db.material.findMany({
      where: {
        OR: [
          { name: { contains: message, mode: 'insensitive' } },
          { formula: { contains: message, mode: 'insensitive' } },
          { category: { contains: message.split(' ')[0], mode: 'insensitive' } },
        ],
      },
      take: 5,
      include: { properties: true },
    });

    for (const mat of materials) {
      sources.push(`${mat.name} (${mat.formula}) - Materials Database`);
    }

    // Search for relevant papers
    const papers = await db.researchPaper.findMany({
      where: {
        OR: [
          { title: { contains: message, mode: 'insensitive' } },
          { keywords: { contains: message, mode: 'insensitive' } },
        ],
      },
      take: 3,
    });

    for (const paper of papers) {
      sources.push(`${paper.title.substring(0, 60)}... (${paper.year})`);
    }
  } catch (e) {
    // Silently fail - enrichment is optional
  }

  return [...new Set(sources)];
}
