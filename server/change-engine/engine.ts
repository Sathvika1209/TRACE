import { UserCheckpoint } from "@/types/checkpoint";
import {
  BenchmarkQuote,
  InstrumentBaseline,
  MarketQuote,
} from "@/types/market";
import {
  BenchmarkPerformance,
  ChangeDetectionResult,
  ChangeReason,
  MeaningfulChangeItem,
  SignificanceTier,
  StructuredChangeEvidence,
} from "@/types/change-engine";

export interface ChangeEngineInput {
  checkpoint?: UserCheckpoint | null;
  currentQuotes: Record<string, MarketQuote>;
  benchmarkQuote?: BenchmarkQuote | null;
  benchmarkBaseline?: { price: number | null; priceTimestamp?: string | null } | null;
  baselines?: Record<string, InstrumentBaseline>;
  evaluatedAt?: string;
}

export interface IChangeEngine {
  detectMeaningfulChanges(input: ChangeEngineInput): Promise<ChangeDetectionResult>;
  calculateStructuredEvidence(
    symbol: string,
    currentQuote: MarketQuote,
    baselinePrice: number | null,
    baselineVolume: number | null,
    benchmarkPerformance: BenchmarkPerformance | null,
    baselineMetrics?: InstrumentBaseline | null
  ): StructuredChangeEvidence;
}

/**
 * Deterministic Meaningful Change Engine
 *
 * Core Principles:
 * 1. 100% Deterministic: Given the same inputs, it produces identical scores, ranks, and evidence.
 * 2. Explainable: Every score component maps directly to mathematical market signals.
 * 3. Graceful Degradation: Handles missing checkpoints, null prices, halted stocks, missing volume,
 *    and benchmark unavailability without inventing zero or throwing exceptions.
 * 4. Zero LLM Dependency: Core intelligence runs locally and deterministically.
 */
export class MeaningfulChangeEngine implements IChangeEngine {
  private static readonly DEFAULT_DAILY_VOLATILITY_PCT = 1.5;
  private static readonly DEFAULT_DAILY_RANGE_PCT = 2.0;

  async detectMeaningfulChanges(
    input: ChangeEngineInput
  ): Promise<ChangeDetectionResult> {
    const evaluatedAt = input.evaluatedAt || new Date().toISOString();
    const checkpointId = input.checkpoint?.id || "NO_CHECKPOINT";
    const checkpointTimestamp = input.checkpoint?.createdAt || evaluatedAt;

    // 1. Build benchmark performance metrics
    const benchmarkPerformance = this.calculateBenchmarkPerformance(
      input.benchmarkQuote,
      input.benchmarkBaseline
    );

    // 2. Map snapshot items by symbol for fast baseline lookup
    const snapshotMap = new Map<string, { price: number | null; volume: number | null }>();
    if (input.checkpoint?.snapshots) {
      for (const snap of input.checkpoint.snapshots) {
        snapshotMap.set(snap.symbol.toUpperCase(), {
          price: snap.price,
          volume: snap.volume,
        });
      }
    }

    // 3. Process each instrument
    const changeItems: MeaningfulChangeItem[] = [];
    const symbols = Object.keys(input.currentQuotes);

    for (const rawSym of symbols) {
      const sym = rawSym.toUpperCase();
      const currentQuote = input.currentQuotes[rawSym];
      if (!currentQuote) continue;

      const baselineSnap = snapshotMap.get(sym);
      const baselinePrice = baselineSnap ? baselineSnap.price : null;
      const baselineVolume = baselineSnap ? baselineSnap.volume : null;
      const baselineMetrics = input.baselines ? input.baselines[sym] : null;

      const evidence = this.calculateStructuredEvidence(
        sym,
        currentQuote,
        baselinePrice,
        baselineVolume,
        benchmarkPerformance,
        baselineMetrics
      );

      const explanation = this.generateDeterministicExplanation(evidence);

      changeItems.push({
        symbol: sym,
        exchange: currentQuote.exchange || "NSE",
        rank: 0, // Assigned after sorting
        evidence,
        checkpointTimestamp: baselineSnap ? checkpointTimestamp : null,
        currentTimestamp: currentQuote.priceTimestamp,
        explanation,
      });
    }

    // 4. Deterministic Sort & Ranking
    // Primary sort: significanceScore descending
    // Secondary sort: absolute priceDeltaPercent descending
    // Tertiary sort: symbol alphabetical ascending (strict tie-breaking)
    changeItems.sort((a, b) => {
      if (b.evidence.significanceScore !== a.evidence.significanceScore) {
        return b.evidence.significanceScore - a.evidence.significanceScore;
      }
      const aDelta = Math.abs(a.evidence.priceDeltaPercent || 0);
      const bDelta = Math.abs(b.evidence.priceDeltaPercent || 0);
      if (bDelta !== aDelta) {
        return bDelta - aDelta;
      }
      return a.symbol.localeCompare(b.symbol);
    });

    // Assign 1-indexed ranks
    changeItems.forEach((item, index) => {
      item.rank = index + 1;
    });

    // 5. Compute quiet state and meaningful count
    const meaningfulChangesCount = changeItems.filter(
      (item) => item.evidence.significanceTier !== "NORMAL"
    ).length;

    const isQuietState = meaningfulChangesCount === 0;

    return {
      checkpointId,
      checkpointTimestamp,
      evaluatedAt,
      benchmarkPerformance,
      changes: changeItems,
      totalInstrumentsEvaluated: changeItems.length,
      meaningfulChangesCount,
      isQuietState,
    };
  }

  public calculateStructuredEvidence(
    symbol: string,
    currentQuote: MarketQuote,
    baselinePrice: number | null,
    baselineVolume: number | null,
    benchmarkPerformance: BenchmarkPerformance | null,
    baselineMetrics?: InstrumentBaseline | null
  ): StructuredChangeEvidence {
    const sym = symbol.toUpperCase();
    const dataStatus = currentQuote.dataStatus || "FRESH";
    const currentPrice = currentQuote.price;
    const currentVolume = currentQuote.volume;

    // Handle UNAVAILABLE data status immediately
    if (dataStatus === "UNAVAILABLE" || currentPrice === null) {
      return {
        symbol: sym,
        exchange: currentQuote.exchange || "NSE",
        baselinePrice,
        currentPrice: null,
        priceDelta: null,
        priceDeltaPercent: null,
        baselineVolume,
        currentVolume: null,
        volumeRatio: null,
        benchmarkDeltaPercent: benchmarkPerformance?.deltaPercent ?? null,
        relativePerformance: null,
        volatilityRatio: null,
        significanceScore: 0,
        significanceTier: "NORMAL",
        dataStatus: "UNAVAILABLE",
        reasons: [
          {
            code: "DATA_UNAVAILABLE",
            description: "Market data for this instrument is currently unavailable.",
            weight: 0,
          },
        ],
      };
    }

    const reasons: ChangeReason[] = [];
    let priceScore = 0;
    let benchScore = 0;
    let volumeScore = 0;
    let volatScore = 0;

    // --- Signal 1: Price Delta vs Baseline ---
    let priceDelta: number | null = null;
    let priceDeltaPercent: number | null = null;

    if (baselinePrice !== null && baselinePrice > 0) {
      priceDelta = Number((currentPrice - baselinePrice).toFixed(4));
      priceDeltaPercent = Number(
        (((currentPrice - baselinePrice) / baselinePrice) * 100).toFixed(4)
      );
    } else if (currentQuote.changePercent !== null && currentQuote.changePercent !== undefined) {
      // Fallback: If no checkpoint exists, evaluate day's change percent as baseline
      priceDeltaPercent = currentQuote.changePercent;
      if (currentQuote.change !== null && currentQuote.change !== undefined) {
        priceDelta = currentQuote.change;
      }
    }

    const dailyVolPct =
      baselineMetrics?.avgDailyVolatilityPct && baselineMetrics.avgDailyVolatilityPct > 0
        ? baselineMetrics.avgDailyVolatilityPct
        : MeaningfulChangeEngine.DEFAULT_DAILY_VOLATILITY_PCT;

    if (priceDeltaPercent !== null) {
      const absDeltaPct = Math.abs(priceDeltaPercent);
      // Normalized movement ratio against baseline daily volatility
      const moveRatio = absDeltaPct / dailyVolPct;

      if (moveRatio > 0.5) {
        // Price moved noticeably beyond typical noise
        priceScore = Math.min(40, Math.round((moveRatio - 0.5) * 16));

        if (priceDeltaPercent > 0) {
          reasons.push({
            code: "PRICE_SURGE",
            description: `Price increased by +${priceDeltaPercent.toFixed(2)}% since checkpoint`,
            factualMetric: `+${priceDeltaPercent.toFixed(2)}%`,
            weight: priceScore,
          });
        } else if (priceDeltaPercent < 0) {
          reasons.push({
            code: "PRICE_DROP",
            description: `Price declined by ${priceDeltaPercent.toFixed(2)}% since checkpoint`,
            factualMetric: `${priceDeltaPercent.toFixed(2)}%`,
            weight: priceScore,
          });
        }
      }
    }

    // --- Signal 2: Benchmark Divergence ---
    let relativePerformance: number | null = null;
    const benchDeltaPct = benchmarkPerformance?.deltaPercent ?? null;

    if (priceDeltaPercent !== null && benchDeltaPct !== null) {
      relativePerformance = Number((priceDeltaPercent - benchDeltaPct).toFixed(4));
      const absDivergence = Math.abs(relativePerformance);

      if (absDivergence > 0.5) {
        benchScore = Math.min(30, Math.round((absDivergence - 0.5) * 10));

        const dirText = relativePerformance > 0 ? "Outperformed" : "Underperformed";
        const signText = relativePerformance > 0 ? "+" : "";
        reasons.push({
          code: "BENCHMARK_DIVERGENCE",
          description: `${dirText} ${benchmarkPerformance?.name || "benchmark"} by ${signText}${relativePerformance.toFixed(2)} percentage points`,
          factualMetric: `${signText}${relativePerformance.toFixed(2)}% vs benchmark`,
          weight: benchScore,
        });
      }
    }

    // --- Signal 3: Volume Anomaly Ratio ---
    let volumeRatio: number | null = null;
    const avgVol =
      baselineMetrics?.avgVolume20d && baselineMetrics.avgVolume20d > 0
        ? baselineMetrics.avgVolume20d
        : baselineVolume && baselineVolume > 0
        ? baselineVolume
        : null;

    if (currentVolume !== null && avgVol !== null && avgVol > 0) {
      volumeRatio = Number((currentVolume / avgVol).toFixed(2));

      if (volumeRatio > 1.2) {
        volumeScore = Math.min(20, Math.round((volumeRatio - 1.2) * 11));

        reasons.push({
          code: "VOLUME_SPIKE",
          description: `Trading volume is ${volumeRatio.toFixed(1)}x higher than 20-day baseline`,
          factualMetric: `${volumeRatio.toFixed(1)}x avg vol`,
          weight: volumeScore,
        });
      }
    }

    // --- Signal 4: Intraday Volatility / Range Expansion ---
    let volatilityRatio: number | null = null;
    if (
      currentQuote.dayHigh !== null &&
      currentQuote.dayLow !== null &&
      currentQuote.dayOpen !== null &&
      currentQuote.dayOpen > 0
    ) {
      const intradayRangePct =
        ((currentQuote.dayHigh - currentQuote.dayLow) / currentQuote.dayOpen) * 100;
      const avgRangePct =
        baselineMetrics?.avgDailyRangePct && baselineMetrics.avgDailyRangePct > 0
          ? baselineMetrics.avgDailyRangePct
          : MeaningfulChangeEngine.DEFAULT_DAILY_RANGE_PCT;

      volatilityRatio = Number((intradayRangePct / avgRangePct).toFixed(2));

      if (volatilityRatio > 1.4) {
        volatScore = Math.min(10, Math.round((volatilityRatio - 1.3) * 8));

        reasons.push({
          code: "VOLATILITY_EXPANSION",
          description: `Intraday price range expanded to ${volatilityRatio.toFixed(1)}x historical range`,
          factualMetric: `${volatilityRatio.toFixed(1)}x normal range`,
          weight: volatScore,
        });
      }
    }

    // --- Data Status Reasons ---
    if (dataStatus === "STALE") {
      reasons.push({
        code: "DATA_STALE",
        description: "Market data may be delayed or stale (>24 hours).",
        weight: 0,
      });
    }

    // --- Composite Significance Score ---
    const rawScore = priceScore + benchScore + volumeScore + volatScore;
    const significanceScore = Math.min(100, Math.max(0, rawScore));

    // Significance Tier Mapping
    let significanceTier: SignificanceTier = "NORMAL";
    if (significanceScore >= 80) {
      significanceTier = "MAJOR";
    } else if (significanceScore >= 60) {
      significanceTier = "SIGNIFICANT";
    } else if (significanceScore >= 30) {
      significanceTier = "NOTABLE";
    }

    return {
      symbol: sym,
      exchange: currentQuote.exchange || "NSE",
      baselinePrice,
      currentPrice,
      priceDelta,
      priceDeltaPercent,
      baselineVolume,
      currentVolume,
      volumeRatio,
      benchmarkDeltaPercent: benchDeltaPct,
      relativePerformance,
      volatilityRatio,
      significanceScore,
      significanceTier,
      dataStatus,
      reasons,
    };
  }

  private calculateBenchmarkPerformance(
    benchmarkQuote?: BenchmarkQuote | null,
    benchmarkBaseline?: { price: number | null } | null
  ): BenchmarkPerformance | null {
    if (!benchmarkQuote || benchmarkQuote.price === null) {
      return null;
    }

    const currentPrice = benchmarkQuote.price;
    const baselinePrice =
      benchmarkBaseline?.price !== undefined && benchmarkBaseline.price !== null
        ? benchmarkBaseline.price
        : benchmarkQuote.previousClose;

    let deltaPercent: number | null = null;
    if (baselinePrice !== null && baselinePrice > 0) {
      deltaPercent = Number(
        (((currentPrice - baselinePrice) / baselinePrice) * 100).toFixed(4)
      );
    } else if (benchmarkQuote.changePercent !== null && benchmarkQuote.changePercent !== undefined) {
      deltaPercent = benchmarkQuote.changePercent;
    }

    return {
      symbol: benchmarkQuote.symbol,
      name: benchmarkQuote.name,
      baselinePrice,
      currentPrice,
      deltaPercent,
    };
  }

  private generateDeterministicExplanation(evidence: StructuredChangeEvidence): string {
    if (evidence.dataStatus === "UNAVAILABLE" || evidence.currentPrice === null) {
      return `${evidence.symbol} data is currently unavailable.`;
    }

    const sym = evidence.symbol;
    const deltaPct = evidence.priceDeltaPercent;

    if (evidence.significanceTier === "NORMAL" || deltaPct === null || Math.abs(deltaPct) < 0.05) {
      if (deltaPct !== null) {
        const sign = deltaPct >= 0 ? "+" : "";
        return `${sym} remained quiet within normal historical variance (${sign}${deltaPct.toFixed(2)}%).`;
      }
      return `${sym} showed no material change.`;
    }

    const action = deltaPct > 0 ? "rose" : "fell";
    const sign = deltaPct > 0 ? "+" : "";
    const parts: string[] = [`${sym} ${action} ${sign}${deltaPct.toFixed(2)}%`];

    if (
      evidence.relativePerformance !== null &&
      Math.abs(evidence.relativePerformance) >= 0.8
    ) {
      const relSign = evidence.relativePerformance > 0 ? "+" : "";
      parts.push(
        `diverging ${relSign}${evidence.relativePerformance.toFixed(2)}% vs benchmark`
      );
    }

    if (evidence.volumeRatio !== null && evidence.volumeRatio >= 1.4) {
      parts.push(`on ${evidence.volumeRatio.toFixed(1)}x typical volume`);
    }

    return `${parts.join(" ")}.`;
  }
}
