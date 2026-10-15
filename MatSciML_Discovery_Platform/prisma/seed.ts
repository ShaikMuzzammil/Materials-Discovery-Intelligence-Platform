/**
 * Seed script — copies the verified pipeline data from src/lib/data.ts into
 * the optional local SQLite database. Run:
 *
 *   bun run db:push && bun run db:seed
 *
 * The platform works without this step (static fallback), but seeding makes
 * the local API routes serve from Prisma.
 */

import { PrismaClient } from "@prisma/client";

import {
  DISCOVERY_CANDIDATES,
  FEATURE_IMPORTANCE,
  MODEL_CV_RESULTS,
  PAPERS,
  STRUCTURED_RECORDS,
} from "../src/lib/data";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding 24041_103 pipeline data …");

  // Wipe existing rows so re-seeding is idempotent.
  await prisma.featureImportance.deleteMany();
  await prisma.modelResult.deleteMany();
  await prisma.discoveryCandidate.deleteMany();
  await prisma.structuredRecord.deleteMany();
  await prisma.paper.deleteMany();

  await prisma.paper.createMany({ data: PAPERS });
  await prisma.structuredRecord.createMany({ data: STRUCTURED_RECORDS });
  await prisma.discoveryCandidate.createMany({ data: DISCOVERY_CANDIDATES });
  await prisma.modelResult.createMany({ data: MODEL_CV_RESULTS });
  await prisma.featureImportance.createMany({
    data: FEATURE_IMPORTANCE.map(({ rank, feature, importance }) => ({
      rank,
      feature,
      importance,
    })),
  });

  const counts = {
    papers: await prisma.paper.count(),
    records: await prisma.structuredRecord.count(),
    candidates: await prisma.discoveryCandidate.count(),
    modelResults: await prisma.modelResult.count(),
    featureImportance: await prisma.featureImportance.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
