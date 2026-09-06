import { DataStatus } from "./database";

/**
 * Meaningful Change Engine Domain Types
 * Defines the contract for deterministic market change detection,
 * multi-signal significance scoring, structured evidence generation,
 * ranking, and quiet state detection.
 */

export type SignificanceTier = "NORMAL" | "NOTABLE" | "SIGNIFICANT" | "MAJOR";

export type ChangeReasonCode =
  | "PRICE_SURGE"
  | "PRICE_DROP"
  | "VOLUME_SPIKE"
  | "BENCHMARK_DIVERGENCE"
  | "VOLATILITY_EXPANSION"
  | "RANGE_BREAKOUT"
  | "DATA_STALE"
  | "DATA_UNAVAILABLE";

export interface ChangeReason {
  code: ChangeReasonCode | string;
  description: string;
  factualMetric?: string;
  weight?: number;
}

/**
 * Structured factual evidence produced deterministically by the Change Engine.
 * This structure serves as the canonical contract between deterministic
 * computation and presentation (or optional future LLM summarization).
 */
export interface StructuredChangeEvidence {
  symbol: string;
  exchange: string;
  instrumentName?: string;
  baselinePrice: number | null;
  currentPrice: number | null;
  priceDelta: number | null;
  priceDeltaPercent: number | null;
  baselineVolume: number | null;
  currentVolume: number | null;
  volumeRatio: number | null; // e.g. current volume / 20-day avg volume
  benchmarkDeltaPercent: number | null;
  relativePerformance: number | null; // priceDeltaPercent - benchmarkDeltaPercent
  volatilityRatio: number | null; // current range / avg baseline range
  significanceScore: number; // Deterministic 0–100 integer score
  significanceTier: SignificanceTier;
  dataStatus: DataStatus;
  reasons: ChangeReason[];
}

export interface MeaningfulChangeItem {
  symbol: string;
  exchange: string;
  instrumentName?: string;
  rank: number;
  evidence: StructuredChangeEvidence;
  checkpointTimestamp: string | null;
  currentTimestamp: string | null;
  explanation: string; // Deterministic template-based factual narrative
}

export interface BenchmarkPerformance {
  symbol: string;
  name: string;
  baselinePrice: number | null;
  currentPrice: number | null;
  deltaPercent: number | null;
}

export interface ChangeDetectionResult {
  checkpointId: string;
  checkpointTimestamp: string;
  evaluatedAt: string;
  benchmarkPerformance: BenchmarkPerformance | null;
  changes: MeaningfulChangeItem[];
  totalInstrumentsEvaluated: number;
  meaningfulChangesCount: number;
  isQuietState: boolean;
}
