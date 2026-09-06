import { UserCheckpoint } from "@/types/checkpoint";
import { MarketQuote } from "@/types/market";
import { ChangeDetectionResult, StructuredChangeEvidence } from "@/types/change-engine";

export interface ChangeEngineInput {
  checkpoint: UserCheckpoint;
  currentQuotes: Record<string, MarketQuote>;
  benchmarkQuote?: MarketQuote; // Reference market index quote (e.g., Nifty 50, S&P 500)
}

/**
 * Meaningful Change Engine Boundary
 *
 * Core Principle:
 * Core market intelligence must remain 100% deterministic and explainable.
 * The engine compares a baseline checkpoint against current market state,
 * computes mathematical signals (absolute movement, relative-to-normal movement,
 * volume anomaly, relative benchmark performance, volatility change),
 * scores significance, and produces structured factual evidence.
 *
 * An optional LLM may later ingest this structured evidence to generate narratives,
 * but the LLM must NEVER determine whether a market change occurred.
 */
export interface IChangeEngine {
  detectMeaningfulChanges(input: ChangeEngineInput): Promise<ChangeDetectionResult>;
  calculateStructuredEvidence(
    symbol: string,
    baselineQuote: MarketQuote,
    currentQuote: MarketQuote,
    benchmarkBaseline?: MarketQuote,
    benchmarkCurrent?: MarketQuote
  ): StructuredChangeEvidence;
}

/**
 * Meaningful Change Engine Implementation Placeholder
 * The mathematical scoring and ranking algorithm will be implemented deliberately in later phases.
 */
export class MeaningfulChangeEngine implements IChangeEngine {
  async detectMeaningfulChanges(_input: ChangeEngineInput): Promise<ChangeDetectionResult> {
    throw new Error(
      "MeaningfulChangeEngine.detectMeaningfulChanges algorithm is not yet implemented in Phase 1."
    );
  }

  calculateStructuredEvidence(
    _symbol: string,
    _baselineQuote: MarketQuote,
    _currentQuote: MarketQuote,
    _benchmarkBaseline?: MarketQuote,
    _benchmarkCurrent?: MarketQuote
  ): StructuredChangeEvidence {
    throw new Error(
      "MeaningfulChangeEngine.calculateStructuredEvidence algorithm is not yet implemented in Phase 1."
    );
  }
}
