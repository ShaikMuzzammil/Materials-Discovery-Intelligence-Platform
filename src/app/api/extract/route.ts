import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ExtractedMaterial {
  name: string;
  formula: string;
  category: string;
  confidence: number;
  context: string;
}

interface ExtractedProperty {
  name: string;
  value: string;
  unit: string;
  confidence: number;
}

interface ExtractedRelation {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

interface ExtractionResponse {
  materials: ExtractedMaterial[];
  properties: ExtractedProperty[];
  relations: ExtractedRelation[];
  summary: string;
  stats: {
    textLength: number;
    materialsFound: number;
    propertiesFound: number;
    relationsFound: number;
    avgConfidence: number;
  };
}

// POST /api/extract - Extract entities from text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, paperId } = body as { text: string; paperId?: string };

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // Call the ML pipeline for extraction
    const mlResponse = await fetch('/api/extract?XTransformPort=3030', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!mlResponse.ok) {
      console.error('ML pipeline error:', mlResponse.status, await mlResponse.text());
      return NextResponse.json(
        { error: 'ML extraction pipeline failed' },
        { status: 502 }
      );
    }

    const extractionResult = (await mlResponse.json()) as ExtractionResponse;

    // Store extracted materials in the database
    const storedEntities = [];

    for (const material of extractionResult.materials) {
      // Check if material already exists
      let dbMaterial = await db.material.findFirst({
        where: { formula: material.formula },
      });

      // Create material if it doesn't exist
      if (!dbMaterial) {
        dbMaterial = await db.material.create({
          data: {
            name: material.name,
            formula: material.formula,
            category: material.category === 'unknown' ? 'semiconductor' : material.category,
            description: `Auto-extracted from text. ${material.context}`,
            source: 'extraction',
            confidence: material.confidence,
          },
        });
      }

      // Create extracted entity linking material to paper (if provided)
      if (paperId) {
        const entity = await db.extractedEntity.create({
          data: {
            paperId,
            materialId: dbMaterial.id,
            entityType: 'material',
            entityText: material.formula,
            confidence: material.confidence,
            context: material.context,
          },
        });
        storedEntities.push(entity);
      } else {
        storedEntities.push({
          materialId: dbMaterial.id,
          name: material.name,
          formula: material.formula,
          confidence: material.confidence,
        });
      }
    }

    // Store extracted properties for materials found
    const storedProperties = [];
    if (extractionResult.materials.length > 0 && extractionResult.properties.length > 0) {
      for (const prop of extractionResult.properties) {
        // Try to find a matching material from this extraction
        for (const material of extractionResult.materials) {
          const dbMaterial = await db.material.findFirst({
            where: { formula: material.formula },
          });

          if (dbMaterial) {
            // Check if property already exists
            const existingProp = await db.materialProperty.findFirst({
              where: {
                materialId: dbMaterial.id,
                propertyName: prop.name,
              },
            });

            if (!existingProp) {
              const newProp = await db.materialProperty.create({
                data: {
                  materialId: dbMaterial.id,
                  propertyName: prop.name,
                  propertyValue: prop.value,
                  unit: prop.unit,
                  source: 'extraction',
                  confidence: prop.confidence,
                },
              });
              storedProperties.push(newProp);
            }
          }
        }
      }
    }

    // Store extracted relations as knowledge edges
    const storedEdges = [];
    for (const relation of extractionResult.relations) {
      const sourceMaterial = await db.material.findFirst({
        where: {
          OR: [
            { formula: relation.source },
            { name: { contains: relation.source } },
          ],
        },
      });
      const targetMaterial = await db.material.findFirst({
        where: {
          OR: [
            { formula: relation.target },
            { name: { contains: relation.target } },
          ],
        },
      });

      if (sourceMaterial && targetMaterial) {
        // Check if edge already exists
        const existingEdge = await db.knowledgeEdge.findFirst({
          where: {
            sourceEntityId: sourceMaterial.id,
            targetEntityId: targetMaterial.id,
            relationType: relation.type,
          },
        });

        if (!existingEdge) {
          const edge = await db.knowledgeEdge.create({
            data: {
              sourceEntityId: sourceMaterial.id,
              targetEntityId: targetMaterial.id,
              relationType: relation.type,
              confidence: relation.confidence,
              paperId: paperId || null,
            },
          });
          storedEdges.push(edge);
        }
      }
    }

    return NextResponse.json({
      summary: extractionResult.summary,
      materials: extractionResult.materials,
      properties: extractionResult.properties,
      relations: extractionResult.relations,
      stats: extractionResult.stats,
      stored: {
        entities: storedEntities.length,
        properties: storedProperties.length,
        edges: storedEdges.length,
      },
    });
  } catch (error) {
    console.error('Extract API error:', error);
    return NextResponse.json(
      { error: 'Failed to extract entities' },
      { status: 500 }
    );
  }
}
