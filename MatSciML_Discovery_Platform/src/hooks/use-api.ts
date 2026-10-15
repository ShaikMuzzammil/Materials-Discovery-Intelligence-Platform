"use client";

/**
 * Typed API client + TanStack Query hooks for every backend route.
 * All requests use relative paths (gateway-safe).
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type {
  AblationRow,
  CleaningCheckRow,
  DatasetStats,
  DiscoveryCandidate,
  FeatureImportanceRow,
  HistogramBin,
  ModelCvResult,
  Paper,
  PipelineStage,
  RunMetadata,
  SelectedFeature,
  SpotCheck,
  StructuredRecord,
} from "@/lib/types";

/* ------------------------------ response types ---------------------------- */

export interface OverviewResponse {
  project: { title: string; fullTitle: string; subtitle: string; basePaperDoi: string };
  run: RunMetadata;
  kpis: Array<{ key: string; label: string; value: number; sub: string; icon: string }>;
  pipelineHealth: Array<{ id: number; title: string; status: "verified" }>;
  bestModel: { model: string; mae: number; rmse: number; r2: number };
  fscore: { basePaper: number; ours: number; note: string };
  histogram: HistogramBin[];
  persistence: { source: string; databaseAvailable: boolean; seededRows: number };
  generatedAt: string;
}

export interface PapersResponse {
  papers: Paper[];
  total: number;
}

export interface RecordsResponse {
  records: StructuredRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: { properties: string[]; sources: string[] };
  stats: {
    sentencesScanned: number;
    recordsValidated: number;
    uniqueMaterials: number;
    benchmarkMatches: number;
  };
}

export interface DatasetResponse {
  stats: DatasetStats;
  cleaningReport: CleaningCheckRow[];
  histogram: HistogramBin[];
}

export interface FeaturesResponse {
  importance: FeatureImportanceRow[];
  selected: SelectedFeature[];
  ablation: AblationRow[];
  familySummary: {
    compositionBefore: number;
    compositionSelected: number;
    textBefore: number;
    textSelected: number;
    totalBefore: number;
    totalSelected: number;
  };
}

export interface ModelsResponse {
  cvResults: ModelCvResult[];
  holdout: { model: string; testSize: string; mae: number; rmse: number; r2: number };
  ablation: AblationRow[];
  spotChecks: SpotCheck[];
  publishedReference: { model: string; mae: number; description: string; source: string };
  fscore: { basePaper: number; ours: number; note: string };
}

export interface DiscoveryResponse {
  candidates: DiscoveryCandidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  families: string[];
  familyCounts: Array<{ family: string; count: number }>;
  topCandidate: { formula: string; family: string; predictedBandGapEv: number; note: string };
}

export interface PipelineResponse {
  stages: PipelineStage[];
}

/* -------------------------------- fetcher --------------------------------- */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/* --------------------------------- hooks ---------------------------------- */

export function useOverview(): UseQueryResult<OverviewResponse, Error> {
  return useQuery({
    queryKey: ["overview"],
    queryFn: () => fetchJson<OverviewResponse>("/api/overview"),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePapers(): UseQueryResult<PapersResponse, Error> {
  return useQuery({
    queryKey: ["papers"],
    queryFn: () => fetchJson<PapersResponse>("/api/papers"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface RecordsQuery {
  property?: string;
  source?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export function useRecords(params: RecordsQuery): UseQueryResult<RecordsResponse, Error> {
  const search = new URLSearchParams();
  if (params.property) search.set("property", params.property);
  if (params.source) search.set("source", params.source);
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 8));
  const qs = search.toString();
  return useQuery({
    queryKey: ["records", qs],
    queryFn: () => fetchJson<RecordsResponse>(`/api/records?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useDataset(): UseQueryResult<DatasetResponse, Error> {
  return useQuery({
    queryKey: ["dataset"],
    queryFn: () => fetchJson<DatasetResponse>("/api/dataset"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeatures(): UseQueryResult<FeaturesResponse, Error> {
  return useQuery({
    queryKey: ["features"],
    queryFn: () => fetchJson<FeaturesResponse>("/api/features"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useModels(): UseQueryResult<ModelsResponse, Error> {
  return useQuery({
    queryKey: ["models"],
    queryFn: () => fetchJson<ModelsResponse>("/api/models"),
    staleTime: 5 * 60 * 1000,
  });
}

export interface DiscoveryQuery {
  family?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export function useDiscovery(params: DiscoveryQuery): UseQueryResult<DiscoveryResponse, Error> {
  const search = new URLSearchParams();
  if (params.family) search.set("family", params.family);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 10));
  const qs = search.toString();
  return useQuery({
    queryKey: ["discovery", qs],
    queryFn: () => fetchJson<DiscoveryResponse>(`/api/discovery?${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function usePipeline(): UseQueryResult<PipelineResponse, Error> {
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: () => fetchJson<PipelineResponse>("/api/pipeline"),
    staleTime: 5 * 60 * 1000,
  });
}
