import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ExtractionResult {
  materials: Array<{
    name: string;
    formula: string;
    category: string;
    confidence: number;
    context: string;
  }>;
  properties: Array<{
    name: string;
    value: string;
    unit: string;
    confidence: number;
  }>;
  relations: Array<{
    source: string;
    target: string;
    type: string;
    confidence: number;
  }>;
  summary: string;
  stats: {
    textLength: number;
    materialsFound: number;
    propertiesFound: number;
    relationsFound: number;
    avgConfidence: number;
  };
}

// POST /api/upload - Upload a file or text for extraction
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let text = '';
    let fileName = '';

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const textField = formData.get('text') as string | null;

      if (file) {
        fileName = file.name;
        // Read file content as text
        text = await file.text();
      } else if (textField) {
        text = textField;
        fileName = 'pasted_text';
      } else {
        return NextResponse.json(
          { error: 'No file or text provided' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON upload
      const body = await request.json();
      text = body.text || '';
      fileName = body.fileName || 'json_upload';
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type. Use multipart/form-data or application/json' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content found in upload' },
        { status: 400 }
      );
    }

    // Truncate very long text to prevent timeout
    const maxTextLength = 100000;
    const truncatedText = text.length > maxTextLength
      ? text.substring(0, maxTextLength) + '\n... [truncated]'
      : text;

    // Call the ML extraction pipeline
    let extractionResult: ExtractionResult;

    try {
      const mlResponse = await fetch('/api/extract?XTransformPort=3030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: truncatedText }),
      });

      if (mlResponse.ok) {
        extractionResult = (await mlResponse.json()) as ExtractionResult;
      } else {
        console.error('ML extract pipeline error:', mlResponse.status);
        return NextResponse.json(
          { error: 'ML extraction pipeline failed' },
          { status: 502 }
        );
      }
    } catch (fetchError) {
      console.error('ML extract pipeline fetch error:', fetchError);
      return NextResponse.json(
        { error: 'ML extraction pipeline unavailable' },
        { status: 503 }
      );
    }

    // Create a research paper entry for the uploaded content
    const paper = await db.researchPaper.create({
      data: {
        title: fileName || 'Uploaded Document',
        authors: 'Upload',
        abstract: truncatedText.substring(0, 500),
        year: new Date().getFullYear(),
        filePath: fileName,
        status: 'extracted',
      },
    });

    // Store extracted entities in the database
    const storedEntities = [];
    for (const material of extractionResult.materials) {
      // Find or create the material
      let dbMaterial = await db.material.findFirst({
        where: { formula: material.formula },
      });

      if (!dbMaterial) {
        dbMaterial = await db.material.create({
          data: {
            name: material.name,
            formula: material.formula,
            category: material.category === 'unknown' ? 'semiconductor' : material.category,
            description: `Extracted from uploaded document: ${fileName}. Context: ${material.context.substring(0, 200)}`,
            source: 'extraction',
            confidence: material.confidence,
          },
        });
      }

      // Create extracted entity
      const entity = await db.extractedEntity.create({
        data: {
          paperId: paper.id,
          materialId: dbMaterial.id,
          entityType: 'material',
          entityText: material.formula,
          confidence: material.confidence,
          context: material.context,
        },
      });
      storedEntities.push(entity);
    }

    // Store extracted properties
    const storedProperties = [];
    for (const material of extractionResult.materials) {
      const dbMaterial = await db.material.findFirst({
        where: { formula: material.formula },
      });
      if (dbMaterial) {
        for (const prop of extractionResult.properties) {
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

    // Create an extraction job record
    const extractionJob = await db.extractionJob.create({
      data: {
        paperId: paper.id,
        status: 'completed',
        result: JSON.stringify({
          materialsFound: extractionResult.materials.length,
          propertiesFound: extractionResult.properties.length,
          relationsFound: extractionResult.relations.length,
          summary: extractionResult.summary,
        }),
      },
    });

    return NextResponse.json({
      paper: {
        id: paper.id,
        title: paper.title,
        status: paper.status,
      },
      extraction: {
        summary: extractionResult.summary,
        materials: extractionResult.materials,
        properties: extractionResult.properties,
        relations: extractionResult.relations,
        stats: extractionResult.stats,
      },
      stored: {
        entities: storedEntities.length,
        properties: storedProperties.length,
      },
      jobId: extractionJob.id,
      fileName,
      textLength: text.length,
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
