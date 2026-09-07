import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MockMarketDataProvider } from "../server/market/mock-provider";
import { MarketDataService } from "../server/market/service";
import { MeaningfulChangeEngine } from "../server/change-engine/engine";
import { MarketQuote } from "../types/market";
import { IMarketDataProvider } from "../server/market/provider";

/**
 * Faulty provider designed to simulate partial failures, timeouts, and network outages.
 */
class FaultyMarketDataProvider implements IMarketDataProvider {
  readonly name = "FAULTY_TEST_PROVIDER";
  public simulateNetworkCrash = false;
  public slowSymbols: Set<string> = new Set();
  public unavailableSymbols: Set<string> = new Set();

  async getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>> {
    if (this.simulateNetworkCrash) {
      throw new Error("Simulated Provider Network Crash (500)");
    }

    const results: Record<string, MarketQuote> = {};
    for (const sym of symbols) {
      if (this.unavailableSymbols.has(sym)) {
        results[sym] = {
          symbol: sym,
          exchange: "NSE",
          price: null,
          priceTimestamp: null,
          volume: null,
          dayHigh: null,
          dayLow: null,
          dayOpen: null,
          previousClose: 1000,
          change: null,
          changePercent: null,
          dataStatus: "UNAVAILABLE",
          source: this.name,
          cachedAt: new Date().toISOString(),
        };
      } else {
        results[sym] = {
          symbol: sym,
          exchange: "NSE",
          price: 1500,
          priceTimestamp: new Date().toISOString(),
          volume: 500000,
          dayHigh: 1520,
          dayLow: 1490,
          dayOpen: 1500,
          previousClose: 1480,
          change: 20,
          changePercent: 1.35,
          dataStatus: "FRESH",
          source: this.name,
          cachedAt: new Date().toISOString(),
        };
      }
    }
    return results;
  }

  async getHistoricalData() {
    return [];
  }

  async getBenchmarkQuote() {
    if (this.simulateNetworkCrash) {
      throw new Error("Benchmark Timeout");
    }
    return null;
  }

  async getBaselineMetrics() {
    return null;
  }
}

describe("TRACE Resilience, Reliability & Error Isolation (Phase 7)", () => {
  const engine = new MeaningfulChangeEngine();

  describe("1. Partial Batch Failures & Fault Isolation", () => {
    test("One unavailable instrument does not crash or corrupt healthy instruments in batch", async () => {
      const faultyProvider = new FaultyMarketDataProvider();
      faultyProvider.unavailableSymbols.add("HALTED_CORP");

      const quotes = await faultyProvider.getQuotes(["RELIANCE", "HALTED_CORP", "TCS"]);

      assert.equal(quotes.RELIANCE.dataStatus, "FRESH");
      assert.equal(quotes.RELIANCE.price, 1500);

      assert.equal(quotes.HALTED_CORP.dataStatus, "UNAVAILABLE");
      assert.equal(quotes.HALTED_CORP.price, null);

      assert.equal(quotes.TCS.dataStatus, "FRESH");
      assert.equal(quotes.TCS.price, 1500);

      // Pass quotes into ChangeEngine
      const result = await engine.detectMeaningfulChanges({
        currentQuotes: quotes,
      });

      assert.equal(result.totalInstrumentsEvaluated, 3);
      const halted = result.changes.find((c) => c.symbol === "HALTED_CORP");
      assert.ok(halted);
      assert.equal(halted.evidence.dataStatus, "UNAVAILABLE");
      assert.equal(halted.evidence.significanceTier, "NORMAL");
      assert.equal(halted.evidence.significanceScore, 0);
    });

    test("MarketDataService gracefully falls back to secondary provider on primary crash", async () => {
      const primaryFaulty = new FaultyMarketDataProvider();
      primaryFaulty.simulateNetworkCrash = true;

      const secondaryMock = new MockMarketDataProvider();
      const service = new MarketDataService(primaryFaulty, {
        fallbackProvider: secondaryMock,
      });

      const quotes = await service.getQuotesForSymbols(["RELIANCE", "INFY"]);
      assert.ok(quotes.RELIANCE);
      assert.equal(quotes.RELIANCE.symbol, "RELIANCE");
      assert.equal(quotes.RELIANCE.dataStatus, "FRESH");
      assert.equal(quotes.RELIANCE.price, 2950);
    });
  });

  describe("2. Strict Missing Data & Non-Fabrication Rules", () => {
    test("ChangeEngine never converts null price or volume to 0.00", async () => {
      const quotes: Record<string, MarketQuote> = {
        MISSING_DATA_CO: {
          symbol: "MISSING_DATA_CO",
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
        currentQuotes: quotes,
      });

      const change = result.changes[0];
      assert.equal(change.evidence.currentPrice, null);
      assert.equal(change.evidence.priceDeltaPercent, null);
      assert.equal(change.evidence.volumeRatio, null);
      assert.equal(change.evidence.relativePerformance, null);
      assert.equal(change.evidence.significanceScore, 0);
      assert.equal(change.evidence.significanceTier, "NORMAL");
    });
  });

  describe("3. Immutability & Audit Trail Integrity", () => {
    test("Multiple consecutive refreshes preserve the exact original baseline timestamp and snapshot values", async () => {
      const initialTimestamp = "2026-09-07T09:15:00.000Z";
      const baselineCheckpoint = {
        id: "cp-original",
        userId: "usr-1",
        watchlistId: "wl-1",
        createdAt: initialTimestamp,
        snapshots: [
          {
            id: "s-1",
            checkpointId: "cp-original",
            symbol: "HDFCBANK",
            exchange: "NSE",
            price: 1600.0,
            priceTimestamp: initialTimestamp,
            volume: 2000000,
            dataStatus: "FRESH" as const,
            createdAt: initialTimestamp,
          },
        ],
      };

      const mockProvider = new MockMarketDataProvider();
      const service = new MarketDataService(mockProvider);

      // Refresh 1: Price moves to 1620
      mockProvider.setQuoteOverride("HDFCBANK", { price: 1620.0 });
      let currentQuotes = await service.getQuotesForSymbols(["HDFCBANK"]);
      let evaluation = await engine.detectMeaningfulChanges({
        checkpoint: baselineCheckpoint,
        currentQuotes,
        evaluatedAt: "2026-09-07T10:00:00.000Z",
      });

      assert.equal(evaluation.changes[0].evidence.baselinePrice, 1600.0);
      assert.equal(evaluation.changes[0].evidence.currentPrice, 1620.0);
      assert.equal(evaluation.checkpointTimestamp, initialTimestamp);

      // Refresh 2: Price moves to 1640
      service.clearCache();
      mockProvider.setQuoteOverride("HDFCBANK", { price: 1640.0 });
      currentQuotes = await service.getQuotesForSymbols(["HDFCBANK"]);
      evaluation = await engine.detectMeaningfulChanges({
        checkpoint: baselineCheckpoint,
        currentQuotes,
        evaluatedAt: "2026-09-07T11:00:00.000Z",
      });

      assert.equal(evaluation.changes[0].evidence.baselinePrice, 1600.0);
      assert.equal(evaluation.changes[0].evidence.currentPrice, 1640.0);
      assert.equal(evaluation.checkpointTimestamp, initialTimestamp);
    });
  });
});
