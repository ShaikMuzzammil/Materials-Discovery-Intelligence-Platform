import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface PredictionRecommendation {
  name: string;
  formula: string;
  score: number;
  reason: string;
}

interface PredictionResponse {
  recommendations: PredictionRecommendation[];
  methodology: string;
}

// POST /api/predict - Predict material recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category,
      targetProperty,
      minValue,
      maxValue,
      application,
    } = body as {
      category?: string;
      targetProperty?: string;
      minValue?: number;
      maxValue?: number;
      application?: string;
    };

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required for prediction' },
        { status: 400 }
      );
    }

    // Call the ML pipeline for prediction
    let mlResult: PredictionResponse;

    try {
      const mlResponse = await fetch('/api/predict?XTransformPort=3030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          targetProperty,
          minValue,
          maxValue,
          application,
        }),
      });

      if (mlResponse.ok) {
        mlResult = (await mlResponse.json()) as PredictionResponse;
      } else {
        console.error('ML predict pipeline error:', mlResponse.status);
        mlResult = generateFallbackPrediction(category);
      }
    } catch (fetchError) {
      console.error('ML predict pipeline fetch error:', fetchError);
      mlResult = generateFallbackPrediction(category);
    }

    // Enrich recommendations with database data
    const enrichedRecommendations = await Promise.all(
      mlResult.recommendations.map(async (rec) => {
        const dbMaterial = await db.material.findFirst({
          where: { formula: rec.formula },
          include: { properties: true },
        });

        return {
          ...rec,
          inDatabase: !!dbMaterial,
          materialId: dbMaterial?.id || null,
          properties: dbMaterial?.properties.map((p) => ({
            name: p.propertyName,
            value: p.propertyValue,
            unit: p.unit,
          })) || [],
          matchesTarget:
            targetProperty && dbMaterial
              ? dbMaterial.properties.some(
                  (p) =>
                    p.propertyName.toLowerCase().includes(targetProperty.toLowerCase()) &&
                    (minValue === undefined || parseFloat(p.propertyValue) >= minValue) &&
                    (maxValue === undefined || parseFloat(p.propertyValue) <= maxValue)
                )
              : false,
        };
      })
    );

    // Find additional materials from the database in this category
    const dbMaterialsInCategory = await db.material.findMany({
      where: { category },
      include: { properties: true },
      take: 10,
      orderBy: { confidence: 'desc' },
    });

    const recommendedFormulas = new Set(mlResult.recommendations.map((r) => r.formula));
    const additionalFromDb = dbMaterialsInCategory
      .filter((m) => !recommendedFormulas.has(m.formula))
      .map((m) => {
        let score = 0.6;
        if (targetProperty) {
          const prop = m.properties.find((p) =>
            p.propertyName.toLowerCase().includes(targetProperty.toLowerCase())
          );
          if (prop) {
            const val = parseFloat(prop.propertyValue);
            if (!isNaN(val)) {
              if (minValue !== undefined && val >= minValue) score += 0.15;
              if (maxValue !== undefined && val <= maxValue) score += 0.15;
            }
            score += 0.1;
          }
        }

        return {
          name: m.name,
          formula: m.formula,
          score: Math.round(score * 100) / 100,
          reason: `Found in database with ${m.properties.length} documented properties`,
          inDatabase: true,
          materialId: m.id,
          properties: m.properties.map((p) => ({
            name: p.propertyName,
            value: p.propertyValue,
            unit: p.unit,
          })),
          matchesTarget: false,
          source: 'database',
        };
      });

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      additionalMaterials: additionalFromDb,
      methodology: mlResult.methodology,
      query: {
        category,
        targetProperty,
        minValue,
        maxValue,
        application,
      },
    });
  } catch (error) {
    console.error('Predict API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}

// Fallback prediction when ML pipeline is unavailable
function generateFallbackPrediction(category: string): PredictionResponse {
  const categoryRecommendations: Record<string, PredictionRecommendation[]> = {
    battery: [
      { name: 'LiFePO4', formula: 'LiFePO4', score: 0.92, reason: 'Excellent safety and cycle life' },
      { name: 'NMC 811', formula: 'LiNi0.8Mn0.1Co0.1O2', score: 0.88, reason: 'High energy density' },
      { name: 'LLZO', formula: 'Li7La3Zr2O12', score: 0.85, reason: 'Solid-state electrolyte with good conductivity' },
      { name: 'Li4Ti5O12', formula: 'Li4Ti5O12', score: 0.82, reason: 'Exceptional cycle life for grid storage' },
    ],
    semiconductor: [
      { name: 'SiC', formula: 'SiC', score: 0.93, reason: 'Wide bandgap for power electronics' },
      { name: 'GaN', formula: 'GaN', score: 0.90, reason: 'High electron mobility for RF applications' },
      { name: 'MXene Ti3C2Tx', formula: 'Ti3C2Tx', score: 0.84, reason: '2D conductor for flexible electronics' },
      { name: 'Graphene', formula: 'C', score: 0.80, reason: 'Exceptional conductivity and strength' },
    ],
    solar: [
      { name: 'CH3NH3PbI3', formula: 'CH3NH3PbI3', score: 0.94, reason: 'Highest PCE among solution-processed cells' },
      { name: 'CuInGaSe2', formula: 'CuInGaSe2', score: 0.87, reason: 'Stable thin-film with good efficiency' },
      { name: 'TiO2', formula: 'TiO2', score: 0.78, reason: 'Standard ETL material for DSSCs' },
    ],
    catalyst: [
      { name: 'Pt', formula: 'Pt', score: 0.95, reason: 'Best ORR/HER activity' },
      { name: 'MOF-5', formula: 'Zn4O(BDC)3', score: 0.86, reason: 'Highest surface area for heterogeneous catalysis' },
      { name: 'Co3O4', formula: 'Co3O4', score: 0.82, reason: 'Cost-effective OER catalyst' },
      { name: 'TiO2', formula: 'TiO2', score: 0.79, reason: 'Versatile photocatalyst' },
    ],
    alloy: [
      { name: 'Inconel 718', formula: 'NiCrFeNbMo', score: 0.91, reason: 'Superalloy for high-temperature applications' },
      { name: 'Ti6Al4V', formula: 'Ti6Al4V', score: 0.88, reason: 'Best strength-to-weight ratio' },
      { name: 'Stainless Steel 316', formula: 'FeCrNiMo', score: 0.83, reason: 'Superior corrosion resistance' },
    ],
    polymer: [
      { name: 'PEEK', formula: '(C19H12O3)n', score: 0.90, reason: 'Highest continuous service temperature' },
      { name: 'PET', formula: '(C10H8O4)n', score: 0.82, reason: 'Good mechanical properties and recyclability' },
    ],
    ceramic: [
      { name: 'Al2O3', formula: 'Al2O3', score: 0.92, reason: 'Most versatile technical ceramic' },
      { name: 'ZrO2', formula: 'ZrO2', score: 0.88, reason: 'Highest fracture toughness among ceramics' },
      { name: 'Si3N4', formula: 'Si3N4', score: 0.85, reason: 'Excellent thermal shock resistance' },
    ],
    biomedical: [
      { name: 'Ti6Al4V', formula: 'Ti6Al4V', score: 0.93, reason: 'Gold standard for orthopedic implants' },
      { name: 'Hydroxyapatite', formula: 'Ca5(PO4)3OH', score: 0.89, reason: 'Bone-mimicking bioceramic' },
    ],
  };

  const recommendations = categoryRecommendations[category] || categoryRecommendations['battery'];

  return {
    recommendations,
    methodology: 'Fallback prediction using predefined domain heuristics and database-verified material properties. The ML pipeline was unavailable for this request.',
  };
}
