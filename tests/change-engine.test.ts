import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MeaningfulChangeEngine } from "../server/change-engine/engine";
import { MockMarketDataProvider } from "../server/market/mock-provider";
import { MarketDataService } from "../server/market/service";
import { UserCheckpoint } from "../types/checkpoint";
import { MarketQuote } from "../types/market";

describe("TRACE Deterministic Change Engine & Market Provider (Phase 5)", () => {
  const engine = new MeaningfulChangeEngine();

  describe("1. Initial Visit & Empty Checkpoint Handling", () => {
    test("Scenario 1: No checkpoint evaluates current quote day change gracefully", async () => {
      const currentQuotes: Record<string, MarketQuote> = {
        RELIANCE: {
          symbol: "RELIANCE",
          exchange: "NSE",
          price: 3000.0,
          priceTimestamp: "2026-09-06T10:00:00.000Z",
          volume: 4500000,
          dayHigh: 3020.0,
          dayLow: 2980.0,
          dayOpen: 2990.0,
          previousClose: 2950.0,
          change: 50.0,
          changePercent: 1.6949,
          dataStatus: "FRESH",
          source: "TEST",
        },
      };

      const result = await engine.detectMeaningfulChanges({
        checkpoint: null,
        currentQuotes,
      });

      assert.equal(result.checkpointId, "NO_CHECKPOINT");
      assert.equal(result.totalInstrumentsEvaluated, 1);
      assert.equal(result.changes.length, 1);
      assert.equal(result.changes[0].symbol, "RELIANCE");
      assert.equal(result.changes[0].evidence.baselinePrice, null);
      assert.equal(result.changes[0].evidence.currentPrice, 3000.0);
      assert.ok(result.changes[0].evidence.priceDeltaPercent !== null);
    });
  });

  describe("2. Flat / Zero Change Evaluation", () => {
    test("Scenario 2: Identical baseline and current price produces zero score and quiet state", async () => {
      const checkpoint: UserCheckpoint = {
        id: "cp-1",
        userId: "usr-1",
        watchlistId: "wl-1",
        createdAt: "2026-09-06T09:15:00.000Z",
        snapshots: [
          {
            id: "s1",
            checkpointId: "cp-1",
            symbol: "TCS",
            exchange: "NSE",
            price: 4200.0,
            priceTimestamp: "2026-09-06T09:15:00.000Z",
            volume: 1800000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T09:15:00.000Z",
          },
        ],
      };

      const currentQuotes: Record<string, MarketQuote> = {
        TCS: {
          symbol: "TCS",
          exchange: "NSE",
          price: 4200.0,
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 1800000,
          dayHigh: 4210.0,
          dayLow: 4190.0,
          dayOpen: 4200.0,
          previousClose: 4200.0,
          change: 0.0,
          changePercent: 0.0,
          dataStatus: "FRESH",
          source: "TEST",
        },
      };

      const result = await engine.detectMeaningfulChanges({
        checkpoint,
        currentQuotes,
      });

      assert.equal(result.totalInstrumentsEvaluated, 1);
      assert.equal(result.changes[0].evidence.significanceScore, 0);
      assert.equal(result.changes[0].evidence.significanceTier, "NORMAL");
      assert.equal(result.isQuietState, true);
      assert.equal(result.meaningfulChangesCount, 0);
    });
  });

  describe("3. Normal Move Within Variance vs Quiet State", () => {
    test("Scenario 3: Small price wiggle (< 0.5% on normal volatility) is scored as NORMAL", async () => {
      const checkpoint: UserCheckpoint = {
        id: "cp-2",
        userId: "usr-1",
        watchlistId: "wl-1",
        createdAt: "2026-09-06T09:15:00.000Z",
        snapshots: [
          {
            id: "s1",
            checkpointId: "cp-2",
            symbol: "INFY",
            exchange: "NSE",
            price: 1600.0,
            priceTimestamp: "2026-09-06T09:15:00.000Z",
            volume: 5000000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T09:15:00.000Z",
          },
        ],
      };

      const currentQuotes: Record<string, MarketQuote> = {
        INFY: {
          symbol: "INFY",
          exchange: "NSE",
          price: 1605.0, // +0.31% move (well within 1.6% daily baseline)
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 5100000,
          dayHigh: 1610.0,
          dayLow: 1595.0,
          dayOpen: 1600.0,
          previousClose: 1600.0,
          change: 5.0,
          changePercent: 0.3125,
          dataStatus: "FRESH",
          source: "TEST",
        },
      };

      const result = await engine.detectMeaningfulChanges({
        checkpoint,
        currentQuotes,
      });

      assert.equal(result.changes[0].evidence.significanceTier, "NORMAL");
      assert.equal(result.isQuietState, true);
      assert.ok(result.changes[0].explanation.includes("remained quiet"));
    });
  });

  describe("4. Significant Multi-Signal Price Surge", () => {
    test("Scenario 4: Large price move (+5%) with high volume produces SIGNIFICANT / MAJOR tier", async () => {
      const checkpoint: UserCheckpoint = {
        id: "cp-3",
        userId: "usr-1",
        watchlistId: "wl-1",
        createdAt: "2026-09-06T09:15:00.000Z",
        snapshots: [
          {
            id: "s1",
            checkpointId: "cp-3",
            symbol: "TATAMOTORS",
            exchange: "NSE",
            price: 1000.0,
            priceTimestamp: "2026-09-06T09:15:00.000Z",
            volume: 8000000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T09:15:00.000Z",
          },
        ],
      };

      const currentQuotes: Record<string, MarketQuote> = {
        TATAMOTORS: {
          symbol: "TATAMOTORS",
          exchange: "NSE",
          price: 1060.0, // +6% surge
          priceTimestamp: "2026-09-06T14:30:00.000Z",
          volume: 24000000, // 3x volume
          dayHigh: 1070.0,
          dayLow: 995.0,
          dayOpen: 1000.0,
          previousClose: 1000.0,
          change: 60.0,
          changePercent: 6.0,
          dataStatus: "FRESH",
          source: "TEST",
        },
      };

      const result = await engine.detectMeaningfulChanges({
        checkpoint,
        currentQuotes,
        baselines: {
          TATAMOTORS: {
            symbol: "TATAMOTORS",
            avgVolume20d: 8000000,
            avgDailyVolatilityPct: 2.0,
            avgDailyRangePct: 3.0,
            calculatedAt: "2026-09-06T09:00:00.000Z",
          },
        },
      });

      const item = result.changes[0];
      assert.ok(item.evidence.significanceScore >= 60, `Score ${item.evidence.significanceScore} should be >= 60`);
      assert.ok(
        item.evidence.significanceTier === "SIGNIFICANT" ||
          item.evidence.significanceTier === "MAJOR"
      );
      assert.equal(result.isQuietState, false);
      assert.equal(result.meaningfulChangesCount, 1);

      // Verify reasons
      const reasonCodes = item.evidence.reasons.map((r) => r.code);
      assert.ok(reasonCodes.includes("PRICE_SURGE"));
      assert.ok(reasonCodes.includes("VOLUME_SPIKE"));
    });
  });

  describe("5. Volatility-Adjusted Comparison", () => {
    test("Scenario 5: Identical 3% move scores higher on low-volatility stock (ITC) than high-volatility stock (TATAMOTORS)", () => {
      const quoteITC: MarketQuote = {
        symbol: "ITC",
        exchange: "NSE",
        price: 515.0, // +3% from 500
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 9000000,
        dayHigh: 518.0,
        dayLow: 498.0,
        dayOpen: 500.0,
        previousClose: 500.0,
        change: 15.0,
        changePercent: 3.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      const quoteTata: MarketQuote = {
        symbol: "TATAMOTORS",
        exchange: "NSE",
        price: 1030.0, // +3% from 1000
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 8500000,
        dayHigh: 1040.0,
        dayLow: 995.0,
        dayOpen: 1000.0,
        previousClose: 1000.0,
        change: 30.0,
        changePercent: 3.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      // ITC baseline volatility = 0.9%, TATAMOTORS = 2.5%
      const evidenceITC = engine.calculateStructuredEvidence(
        "ITC",
        quoteITC,
        500.0,
        9000000,
        null,
        {
          symbol: "ITC",
          avgVolume20d: 9000000,
          avgDailyVolatilityPct: 0.9,
          avgDailyRangePct: 1.3,
          calculatedAt: "2026-09-06T09:00:00.000Z",
        }
      );

      const evidenceTata = engine.calculateStructuredEvidence(
        "TATAMOTORS",
        quoteTata,
        1000.0,
        8500000,
        null,
        {
          symbol: "TATAMOTORS",
          avgVolume20d: 8500000,
          avgDailyVolatilityPct: 2.5,
          avgDailyRangePct: 3.5,
          calculatedAt: "2026-09-06T09:00:00.000Z",
        }
      );

      assert.ok(
        evidenceITC.significanceScore > evidenceTata.significanceScore,
        `ITC score (${evidenceITC.significanceScore}) should exceed TATAMOTORS score (${evidenceTata.significanceScore}) because 3% is a larger multiple of normal volatility for ITC`
      );
    });
  });

  describe("6. Benchmark Co-Movement vs Divergence", () => {
    test("Scenario 6: Stock moving in sync with benchmark receives lower significance than diverging stock", () => {
      const currentQuote: MarketQuote = {
        symbol: "HDFCBANK",
        exchange: "NSE",
        price: 1545.0, // +3.0% from 1500
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 12000000,
        dayHigh: 1550.0,
        dayLow: 1495.0,
        dayOpen: 1500.0,
        previousClose: 1500.0,
        change: 45.0,
        changePercent: 3.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      // Case A: NIFTY 50 also surged +3.0% (co-movement)
      const benchCoMove = {
        symbol: "^NSEI",
        name: "NIFTY 50",
        baselinePrice: 24000.0,
        currentPrice: 24720.0,
        deltaPercent: 3.0,
      };

      // Case B: NIFTY 50 dropped -1.0% (divergence: +4.0% relative)
      const benchDiverge = {
        symbol: "^NSEI",
        name: "NIFTY 50",
        baselinePrice: 24000.0,
        currentPrice: 23760.0,
        deltaPercent: -1.0,
      };

      const evidenceCoMove = engine.calculateStructuredEvidence(
        "HDFCBANK",
        currentQuote,
        1500.0,
        12000000,
        benchCoMove
      );

      const evidenceDiverge = engine.calculateStructuredEvidence(
        "HDFCBANK",
        currentQuote,
        1500.0,
        12000000,
        benchDiverge
      );

      assert.ok(
        evidenceDiverge.significanceScore > evidenceCoMove.significanceScore,
        `Diverging score (${evidenceDiverge.significanceScore}) should be higher than co-movement score (${evidenceCoMove.significanceScore})`
      );
      assert.ok(evidenceDiverge.reasons.some((r) => r.code === "BENCHMARK_DIVERGENCE"));
    });
  });

  describe("7. Benchmark Divergence Signal Verification", () => {
    test("Scenario 7: Generates factual BENCHMARK_DIVERGENCE reason with exact relative percentage", () => {
      const quote: MarketQuote = {
        symbol: "SBIN",
        exchange: "NSE",
        price: 840.0, // +5.0% from 800
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 14000000,
        dayHigh: 845.0,
        dayLow: 795.0,
        dayOpen: 800.0,
        previousClose: 800.0,
        change: 40.0,
        changePercent: 5.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      const bench = {
        symbol: "^NSEI",
        name: "NIFTY 50",
        baselinePrice: 24000.0,
        currentPrice: 24240.0,
        deltaPercent: 1.0, // NIFTY +1%
      };

      const evidence = engine.calculateStructuredEvidence(
        "SBIN",
        quote,
        800.0,
        14000000,
        bench
      );

      assert.equal(evidence.relativePerformance, 4.0); // 5% - 1% = +4%
      const benchReason = evidence.reasons.find((r) => r.code === "BENCHMARK_DIVERGENCE");
      assert.ok(benchReason);
      assert.ok(benchReason.description.includes("Outperformed NIFTY 50 by +4.00 percentage points"));
    });
  });

  describe("8. Volume Anomaly Confirmation", () => {
    test("Scenario 8: High volume ratio (>2.0x) increases significance score and produces VOLUME_SPIKE", () => {
      const quoteLowVol: MarketQuote = {
        symbol: "LT",
        exchange: "NSE",
        price: 3744.0, // +4%
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 2100000, // 1.0x baseline
        dayHigh: 3750.0,
        dayLow: 3590.0,
        dayOpen: 3600.0,
        previousClose: 3600.0,
        change: 144.0,
        changePercent: 4.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      const quoteHighVol: MarketQuote = {
        ...quoteLowVol,
        volume: 5250000, // 2.5x baseline
      };

      const baseline = {
        symbol: "LT",
        avgVolume20d: 2100000,
        avgDailyVolatilityPct: 1.5,
        avgDailyRangePct: 2.2,
        calculatedAt: "2026-09-06T09:00:00.000Z",
      };

      const evidenceLow = engine.calculateStructuredEvidence(
        "LT",
        quoteLowVol,
        3600.0,
        2100000,
        null,
        baseline
      );

      const evidenceHigh = engine.calculateStructuredEvidence(
        "LT",
        quoteHighVol,
        3600.0,
        2100000,
        null,
        baseline
      );

      assert.ok(evidenceHigh.significanceScore > evidenceLow.significanceScore);
      assert.ok(evidenceHigh.reasons.some((r) => r.code === "VOLUME_SPIKE"));
      assert.equal(evidenceHigh.volumeRatio, 2.5);
    });
  });

  describe("9. Missing Volume Handling", () => {
    test("Scenario 9: Missing / null volume is preserved as null and does not throw or penalize", () => {
      const quote: MarketQuote = {
        symbol: "BHARTIARTL",
        exchange: "NSE",
        price: 1476.8, // +4%
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: null, // Null volume
        dayHigh: 1480.0,
        dayLow: 1410.0,
        dayOpen: 1420.0,
        previousClose: 1420.0,
        change: 56.8,
        changePercent: 4.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      const evidence = engine.calculateStructuredEvidence(
        "BHARTIARTL",
        quote,
        1420.0,
        null,
        null
      );

      assert.equal(evidence.currentVolume, null);
      assert.equal(evidence.volumeRatio, null);
      assert.ok(evidence.significanceScore > 0, "Should still compute price movement score");
    });
  });

  describe("10. Missing Benchmark Handling", () => {
    test("Scenario 10: Missing benchmark degrades gracefully without benchmark divergence score", () => {
      const quote: MarketQuote = {
        symbol: "RELIANCE",
        exchange: "NSE",
        price: 3050.0, // +3.39%
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 4500000,
        dayHigh: 3060.0,
        dayLow: 2940.0,
        dayOpen: 2950.0,
        previousClose: 2950.0,
        change: 100.0,
        changePercent: 3.3898,
        dataStatus: "FRESH",
        source: "TEST",
      };

      const evidence = engine.calculateStructuredEvidence(
        "RELIANCE",
        quote,
        2950.0,
        4500000,
        null // No benchmark
      );

      assert.equal(evidence.benchmarkDeltaPercent, null);
      assert.equal(evidence.relativePerformance, null);
      assert.ok(evidence.significanceScore > 0);
      assert.equal(
        evidence.reasons.some((r) => r.code === "BENCHMARK_DIVERGENCE"),
        false
      );
    });
  });

  describe("11. Missing Historical Baseline Metrics Handling", () => {
    test("Scenario 11: Missing baseline uses safe defaults (1.5% daily volatility, 2.0% daily range)", () => {
      const quote: MarketQuote = {
        symbol: "UNKNOWN_NEW_STOCK",
        exchange: "NSE",
        price: 210.0, // +5.0%
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 1000000,
        dayHigh: 212.0,
        dayLow: 198.0,
        dayOpen: 200.0,
        previousClose: 200.0,
        change: 10.0,
        changePercent: 5.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      const evidence = engine.calculateStructuredEvidence(
        "UNKNOWN_NEW_STOCK",
        quote,
        200.0,
        null,
        null,
        null // No custom baseline metrics
      );

      assert.ok(evidence.significanceScore > 0);
      assert.ok(evidence.reasons.some((r) => r.code === "PRICE_SURGE"));
    });
  });

  describe("12. Stale Data Propagation", () => {
    test("Scenario 12: STALE data status is flagged in structured reasons", () => {
      const quote: MarketQuote = {
        symbol: "ICICIBANK",
        exchange: "NSE",
        price: 1150.0,
        priceTimestamp: "2026-09-01T10:00:00.000Z", // Old timestamp
        volume: 5000000,
        dayHigh: 1155.0,
        dayLow: 1110.0,
        dayOpen: 1120.0,
        previousClose: 1120.0,
        change: 30.0,
        changePercent: 2.6786,
        dataStatus: "STALE",
        source: "TEST",
      };

      const evidence = engine.calculateStructuredEvidence(
        "ICICIBANK",
        quote,
        1120.0,
        5000000,
        null
      );

      assert.equal(evidence.dataStatus, "STALE");
      assert.ok(evidence.reasons.some((r) => r.code === "DATA_STALE"));
    });
  });

  describe("13. Unavailable / Halted Instrument Handling", () => {
    test("Scenario 13: UNAVAILABLE status yields 0 score, NORMAL tier, and null metrics", () => {
      const quote: MarketQuote = {
        symbol: "HALTED_STOCK",
        exchange: "NSE",
        price: null,
        priceTimestamp: null,
        volume: null,
        dayHigh: null,
        dayLow: null,
        dayOpen: null,
        previousClose: 100.0,
        change: null,
        changePercent: null,
        dataStatus: "UNAVAILABLE",
        source: "TEST",
      };

      const evidence = engine.calculateStructuredEvidence(
        "HALTED_STOCK",
        quote,
        100.0,
        50000,
        null
      );

      assert.equal(evidence.significanceScore, 0);
      assert.equal(evidence.significanceTier, "NORMAL");
      assert.equal(evidence.currentPrice, null);
      assert.equal(evidence.dataStatus, "UNAVAILABLE");
      assert.ok(evidence.reasons.some((r) => r.code === "DATA_UNAVAILABLE"));
    });
  });

  describe("14. Partial Failure / Mixed Watchlist Isolation", () => {
    test("Scenario 14: Single failed instrument does not corrupt other instruments in watchlist", async () => {
      const currentQuotes: Record<string, MarketQuote> = {
        VALID_STOCK: {
          symbol: "VALID_STOCK",
          exchange: "NSE",
          price: 525.0,
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 2000000,
          dayHigh: 530.0,
          dayLow: 495.0,
          dayOpen: 500.0,
          previousClose: 500.0,
          change: 25.0,
          changePercent: 5.0,
          dataStatus: "FRESH",
          source: "TEST",
        },
        FAILED_STOCK: {
          symbol: "FAILED_STOCK",
          exchange: "NSE",
          price: null,
          priceTimestamp: null,
          volume: null,
          dayHigh: null,
          dayLow: null,
          dayOpen: null,
          previousClose: null,
          change: null,
          changePercent: null,
          dataStatus: "UNAVAILABLE",
          source: "TEST",
        },
      };

      const result = await engine.detectMeaningfulChanges({
        currentQuotes,
      });

      assert.equal(result.totalInstrumentsEvaluated, 2);
      const validItem = result.changes.find((c) => c.symbol === "VALID_STOCK");
      const failedItem = result.changes.find((c) => c.symbol === "FAILED_STOCK");

      assert.ok(validItem);
      assert.ok(validItem.evidence.significanceScore > 0);
      assert.ok(failedItem);
      assert.equal(failedItem.evidence.dataStatus, "UNAVAILABLE");
      assert.equal(failedItem.evidence.significanceScore, 0);
    });
  });

  describe("15. Invalid / Zero Price Guard", () => {
    test("Scenario 15: Baseline price of zero or negative is handled without division by zero error", () => {
      const quote: MarketQuote = {
        symbol: "TEST",
        exchange: "NSE",
        price: 50.0,
        priceTimestamp: "2026-09-06T12:00:00.000Z",
        volume: 1000,
        dayHigh: 50.0,
        dayLow: 50.0,
        dayOpen: 50.0,
        previousClose: 0.0,
        change: 0.0,
        changePercent: 0.0,
        dataStatus: "FRESH",
        source: "TEST",
      };

      const evidence = engine.calculateStructuredEvidence(
        "TEST",
        quote,
        0.0, // baseline price 0
        1000,
        null
      );

      assert.ok(!isNaN(evidence.significanceScore));
      assert.ok(isFinite(evidence.significanceScore));
    });
  });

  describe("16. Strict Determinism & Reproducibility", () => {
    test("Scenario 16: Two consecutive runs with identical inputs produce bit-identical results", async () => {
      const input = {
        checkpoint: {
          id: "cp-det",
          userId: "u1",
          watchlistId: "w1",
          createdAt: "2026-09-06T09:00:00.000Z",
          snapshots: [
            {
              id: "s1",
              checkpointId: "cp-det",
              symbol: "RELIANCE",
              exchange: "NSE",
              price: 2950.0,
              priceTimestamp: "2026-09-06T09:00:00.000Z",
              volume: 4000000,
              dataStatus: "FRESH" as const,
              createdAt: "2026-09-06T09:00:00.000Z",
            },
            {
              id: "s2",
              checkpointId: "cp-det",
              symbol: "TCS",
              exchange: "NSE",
              price: 4200.0,
              priceTimestamp: "2026-09-06T09:00:00.000Z",
              volume: 1500000,
              dataStatus: "FRESH" as const,
              createdAt: "2026-09-06T09:00:00.000Z",
            },
          ],
        },
        currentQuotes: {
          RELIANCE: {
            symbol: "RELIANCE",
            exchange: "NSE",
            price: 3080.0,
            priceTimestamp: "2026-09-06T14:00:00.000Z",
            volume: 9000000,
            dayHigh: 3090.0,
            dayLow: 2940.0,
            dayOpen: 2950.0,
            previousClose: 2950.0,
            change: 130.0,
            changePercent: 4.4068,
            dataStatus: "FRESH" as const,
            source: "TEST",
          },
          TCS: {
            symbol: "TCS",
            exchange: "NSE",
            price: 4210.0,
            priceTimestamp: "2026-09-06T14:00:00.000Z",
            volume: 1600000,
            dayHigh: 4220.0,
            dayLow: 4190.0,
            dayOpen: 4200.0,
            previousClose: 4200.0,
            change: 10.0,
            changePercent: 0.2381,
            dataStatus: "FRESH" as const,
            source: "TEST",
          },
        },
        evaluatedAt: "2026-09-06T14:00:00.000Z",
      };

      const result1 = await engine.detectMeaningfulChanges(input);
      const result2 = await engine.detectMeaningfulChanges(input);

      assert.deepEqual(result1, result2, "Engine outputs must be strictly deterministic and identical");
    });
  });

  describe("17. Ranking Order & Tie-Breaking", () => {
    test("Scenario 17: Items are ranked descending by significance score with stable tie-breaking", async () => {
      const currentQuotes: Record<string, MarketQuote> = {
        LOW_MOVE: {
          symbol: "LOW_MOVE",
          exchange: "NSE",
          price: 101.0, // +1%
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 100000,
          dayHigh: 102.0,
          dayLow: 99.0,
          dayOpen: 100.0,
          previousClose: 100.0,
          change: 1.0,
          changePercent: 1.0,
          dataStatus: "FRESH",
          source: "TEST",
        },
        HIGH_MOVE: {
          symbol: "HIGH_MOVE",
          exchange: "NSE",
          price: 108.0, // +8%
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 500000,
          dayHigh: 109.0,
          dayLow: 98.0,
          dayOpen: 100.0,
          previousClose: 100.0,
          change: 8.0,
          changePercent: 8.0,
          dataStatus: "FRESH",
          source: "TEST",
        },
        MID_MOVE: {
          symbol: "MID_MOVE",
          exchange: "NSE",
          price: 104.0, // +4%
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 200000,
          dayHigh: 105.0,
          dayLow: 99.0,
          dayOpen: 100.0,
          previousClose: 100.0,
          change: 4.0,
          changePercent: 4.0,
          dataStatus: "FRESH",
          source: "TEST",
        },
      };

      const result = await engine.detectMeaningfulChanges({
        currentQuotes,
      });

      assert.equal(result.changes[0].symbol, "HIGH_MOVE");
      assert.equal(result.changes[0].rank, 1);
      assert.equal(result.changes[1].symbol, "MID_MOVE");
      assert.equal(result.changes[1].rank, 2);
      assert.equal(result.changes[2].symbol, "LOW_MOVE");
      assert.equal(result.changes[2].rank, 3);
    });
  });

  describe("18. Quiet State Threshold Verification", () => {
    test("Scenario 18: Watchlist with only NORMAL tier instruments produces isQuietState = true", async () => {
      const currentQuotes: Record<string, MarketQuote> = {
        STOCK_A: {
          symbol: "STOCK_A",
          exchange: "NSE",
          price: 100.2,
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 100000,
          dayHigh: 100.5,
          dayLow: 99.8,
          dayOpen: 100.0,
          previousClose: 100.0,
          change: 0.2,
          changePercent: 0.2,
          dataStatus: "FRESH",
          source: "TEST",
        },
        STOCK_B: {
          symbol: "STOCK_B",
          exchange: "NSE",
          price: 200.3,
          priceTimestamp: "2026-09-06T12:00:00.000Z",
          volume: 150000,
          dayHigh: 201.0,
          dayLow: 199.5,
          dayOpen: 200.0,
          previousClose: 200.0,
          change: 0.3,
          changePercent: 0.15,
          dataStatus: "FRESH",
          source: "TEST",
        },
      };

      const result = await engine.detectMeaningfulChanges({
        currentQuotes,
      });

      assert.equal(result.meaningfulChangesCount, 0);
      assert.equal(result.isQuietState, true);
    });
  });

  describe("19. MarketDataService & Provider Integration", () => {
    test("Scenario 19: MockMarketDataProvider delivers typed quotes, baselines, and snapshot", async () => {
      const mockProvider = new MockMarketDataProvider("2026-09-06T10:00:00.000Z");
      const service = new MarketDataService(mockProvider);

      const quotes = await service.getQuotesForSymbols(["RELIANCE", "TCS"]);
      assert.equal(quotes.RELIANCE.symbol, "RELIANCE");
      assert.equal(quotes.RELIANCE.price, 2950.0);
      assert.equal(quotes.TCS.symbol, "TCS");
      assert.equal(quotes.TCS.price, 4200.0);

      const benchmark = await service.getBenchmarkQuote();
      assert.ok(benchmark);
      assert.equal(benchmark.symbol, "^NSEI");
      assert.equal(benchmark.name, "NIFTY 50");

      const baseline = await service.getBaselineMetrics("TATAMOTORS");
      assert.ok(baseline);
      assert.equal(baseline.symbol, "TATAMOTORS");
      assert.equal(baseline.avgDailyVolatilityPct, 2.4);

      const snapshot = await service.getMarketSnapshot(["RELIANCE", "INFY"]);
      assert.ok(snapshot.id);
      assert.ok(snapshot.quotes.RELIANCE);
      assert.ok(snapshot.quotes.INFY);
      assert.ok(snapshot.benchmark);
    });
  });

  describe("20. Multi-Instrument End-to-End Pipeline", () => {
    test("Scenario 20: 10-stock watchlist processes complete pipeline accurately", async () => {
      const mockProvider = new MockMarketDataProvider("2026-09-06T15:30:00.000Z");

      // Inject some meaningful variations
      mockProvider.setQuoteOverride("TATAMOTORS", {
        price: 1102.4, // +6% surge
        volume: 25500000, // 3x volume
        change: 62.4,
        changePercent: 6.0,
      });

      mockProvider.setQuoteOverride("INFY", {
        price: 1567.5, // -5% drop
        volume: 13000000, // 2.5x volume
        change: -82.5,
        changePercent: -5.0,
      });

      mockProvider.setQuoteOverride("HALTED", {
        price: null,
        volume: null,
        dataStatus: "UNAVAILABLE",
      });

      const symbols = [
        "RELIANCE",
        "TCS",
        "INFY",
        "HDFCBANK",
        "TATAMOTORS",
        "ICICIBANK",
        "ITC",
        "SBIN",
        "BHARTIARTL",
        "HALTED",
      ];

      const currentQuotes = await mockProvider.getQuotes(symbols);
      const benchmarkQuote = await mockProvider.getBenchmarkQuote();

      const result = await engine.detectMeaningfulChanges({
        currentQuotes,
        benchmarkQuote,
      });

      assert.equal(result.totalInstrumentsEvaluated, 10);
      assert.ok(result.meaningfulChangesCount >= 2, "Should detect at least TATAMOTORS and INFY as meaningful");
      assert.equal(result.isQuietState, false);

      // Verify top ranked items
      const top1 = result.changes[0];
      assert.ok(top1.symbol === "TATAMOTORS" || top1.symbol === "INFY");
      assert.ok(top1.evidence.significanceScore >= 60);

      // Verify ranks are continuous from 1 to 10
      const ranks = result.changes.map((c) => c.rank);
      assert.deepEqual(ranks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });
});
