/**
 * Meaningful Change Engine Domain Types
 * Defines the contract for deterministic market change detection,
 * ranking, structured evidence, and optional explanation wrappers.
 */

export interface ChangeReason {
  code: string; // e.g., "PRICE_SURGE", "VOLUME_SPIKE", "BENCHMARK_DIVERGENCE"
  description: string;
  magnitude?: number;
  weight?: number;
}

/**
 * Structured factual evidence produced deterministically by the Change Engine.
 * This structure serves as the canonical contract between deterministic
 * computation and presentation (or optional future LLM summarization).
 */
export interface StructuredChangeEvidence {
  symbol: string;
  price_change: number; // Absolute/relative price difference since checkpoint
  volume_ratio: number; // Current volume vs typical/baseline volume
  relative_market_performance: number; // Difference vs market index (e.g. NIFTY50 / S&P500)
  significance_score: number; // Deterministic ranking score (0.0 to 1.0 or normalized scale)
  reasons: ChangeReason[];
}

export interface MeaningfulChangeItem {
  symbol: string;
  instrumentName?: string;
  rank: number;
  evidence: StructuredChangeEvidence;
  checkpointTimestamp: string;
  currentTimestamp: string;
  explanation?: string; // Deterministic template-based summary (or optional LLM generated narrative)
}

export interface ChangeDetectionResult {
  checkpointId: string;
  checkpointTimestamp: string;
  evaluatedAt: string;
  changes: MeaningfulChangeItem[];
  totalInstrumentsEvaluated: number;
  meaningfulChangesCount: number;
}
