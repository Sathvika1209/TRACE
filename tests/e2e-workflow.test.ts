import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MockMarketDataProvider } from "../server/market/mock-provider";
import { MeaningfulChangeEngine } from "../server/change-engine/engine";
import { UserCheckpoint } from "../types/checkpoint";
import { Watchlist } from "../types/watchlist";

describe("TRACE Phase 6: Product UI & End-to-End User Experience", () => {
  const engine = new MeaningfulChangeEngine();

  describe("1. First-Time User Onboarding & No-Baseline State", () => {
    test("First-time user has a watchlist with instruments but NO checkpoint", async () => {
      const initialWatchlist: Watchlist = {
        id: "wl-user-1",
        userId: "usr-1",
        name: "Main Watchlist",
        isDefault: true,
        createdAt: "2026-09-06T09:00:00.000Z",
        updatedAt: "2026-09-06T09:00:00.000Z",
        items: [
          {
            id: "wi-1",
            watchlistId: "wl-user-1",
            symbol: "RELIANCE",
            exchange: "NSE",
            displayName: "Reliance Industries",
            displayOrder: 0,
            addedAt: "2026-09-06T09:00:00.000Z",
          },
          {
            id: "wi-2",
            watchlistId: "wl-user-1",
            symbol: "TATAMOTORS",
            exchange: "NSE",
            displayName: "Tata Motors",
            displayOrder: 1,
            addedAt: "2026-09-06T09:00:00.000Z",
          },
        ],
      };

      const mockProvider = new MockMarketDataProvider("2026-09-06T09:15:00.000Z");
      const symbols = (initialWatchlist.items || []).map((i) => i.symbol);
      const currentQuotes = await mockProvider.getQuotes(symbols);

      // Evaluate change engine with null checkpoint (No-baseline state)
      const changeResult = await engine.detectMeaningfulChanges({
        checkpoint: null,
        currentQuotes,
      });

      assert.equal(changeResult.checkpointId, "NO_CHECKPOINT");
      assert.equal(changeResult.totalInstrumentsEvaluated, 2);
      // Changes exist in fallback mode, but user UI prompts: "TRACE needs a starting point"
    });
  });

  describe("2. Checkpoint Creation: Baseline Establishment", () => {
    test("User establishes baseline snapshot for watchlist instruments", async () => {
      const mockProvider = new MockMarketDataProvider("2026-09-06T09:15:00.000Z");
      const quotes = await mockProvider.getQuotes(["RELIANCE", "TATAMOTORS", "INFY"]);

      const checkpointTimestamp = "2026-09-06T09:15:00.000Z";
      const checkpoint: UserCheckpoint = {
        id: "cp-001",
        userId: "usr-1",
        watchlistId: "wl-user-1",
        createdAt: checkpointTimestamp,
        snapshots: [
          {
            id: "s-1",
            checkpointId: "cp-001",
            symbol: "RELIANCE",
            exchange: "NSE",
            price: quotes.RELIANCE.price, // 2950.0
            priceTimestamp: checkpointTimestamp,
            volume: quotes.RELIANCE.volume,
            dataStatus: "FRESH",
            createdAt: checkpointTimestamp,
          },
          {
            id: "s-2",
            checkpointId: "cp-001",
            symbol: "TATAMOTORS",
            exchange: "NSE",
            price: quotes.TATAMOTORS.price, // 1040.0
            priceTimestamp: checkpointTimestamp,
            volume: quotes.TATAMOTORS.volume,
            dataStatus: "FRESH",
            createdAt: checkpointTimestamp,
          },
          {
            id: "s-3",
            checkpointId: "cp-001",
            symbol: "INFY",
            exchange: "NSE",
            price: quotes.INFY.price, // 1650.0
            priceTimestamp: checkpointTimestamp,
            volume: quotes.INFY.volume,
            dataStatus: "FRESH",
            createdAt: checkpointTimestamp,
          },
        ],
      };

      assert.equal(checkpoint.snapshots?.length, 3);
      assert.equal(checkpoint.snapshots?.[0].price, 2950.0);
      assert.equal(checkpoint.snapshots?.[1].price, 1040.0);
    });
  });

  describe("3. Refresh Action Without Checkpoint Mutation", () => {
    test("User refreshes quotes: baseline timestamp and snapshot remain UNCHANGED", async () => {
      const originalCheckpoint: UserCheckpoint = {
        id: "cp-001",
        userId: "usr-1",
        watchlistId: "wl-user-1",
        createdAt: "2026-09-06T09:15:00.000Z",
        snapshots: [
          {
            id: "s-1",
            checkpointId: "cp-001",
            symbol: "TATAMOTORS",
            exchange: "NSE",
            price: 1040.0,
            priceTimestamp: "2026-09-06T09:15:00.000Z",
            volume: 8500000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T09:15:00.000Z",
          },
        ],
      };

      const mockProvider = new MockMarketDataProvider("2026-09-06T11:30:00.000Z");
      // Simulate price tick during refresh
      mockProvider.setQuoteOverride("TATAMOTORS", {
        price: 1055.0, // +1.44% move
        volume: 9000000,
      });

      const currentQuotes = await mockProvider.getQuotes(["TATAMOTORS"]);

      const result = await engine.detectMeaningfulChanges({
        checkpoint: originalCheckpoint,
        currentQuotes,
        evaluatedAt: "2026-09-06T11:30:00.000Z",
      });

      // Verify that the evaluation compared against the ORIGINAL baseline (1040.0)
      assert.equal(result.changes[0].evidence.baselinePrice, 1040.0);
      assert.equal(result.changes[0].evidence.currentPrice, 1055.0);
      assert.equal(result.checkpointTimestamp, "2026-09-06T09:15:00.000Z");
      assert.equal(result.evaluatedAt, "2026-09-06T11:30:00.000Z");
    });
  });

  describe("4. End-to-End Market Divergence -> Flagged Changes -> New Checkpoint Loop", () => {
    test("Core TRACE Journey: Baseline -> Divergence -> Meaningful Change -> Advance Checkpoint -> Quiet State", async () => {
      const mockProvider = new MockMarketDataProvider("2026-09-06T09:15:00.000Z");

      // 1. Initial State at 09:15 AM
      const baselineCheckpoint: UserCheckpoint = {
        id: "cp-morning",
        userId: "usr-1",
        watchlistId: "wl-1",
        createdAt: "2026-09-06T09:15:00.000Z",
        snapshots: [
          {
            id: "s-1",
            checkpointId: "cp-morning",
            symbol: "RELIANCE",
            exchange: "NSE",
            price: 2950.0,
            priceTimestamp: "2026-09-06T09:15:00.000Z",
            volume: 4500000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T09:15:00.000Z",
          },
          {
            id: "s-2",
            checkpointId: "cp-morning",
            symbol: "TATAMOTORS",
            exchange: "NSE",
            price: 1040.0,
            priceTimestamp: "2026-09-06T09:15:00.000Z",
            volume: 8500000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T09:15:00.000Z",
          },
        ],
      };

      // 2. User returns at 02:30 PM: TATAMOTORS surges +5.77% on 3x volume while NIFTY 50 is flat
      mockProvider.setQuoteOverride("TATAMOTORS", {
        price: 1100.0, // +5.77% surge
        volume: 25500000, // 3x volume
        dayHigh: 1105.0,
        dayLow: 1038.0,
        dayOpen: 1040.0,
        previousClose: 1040.0,
      });

      mockProvider.setQuoteOverride("RELIANCE", {
        price: 2955.0, // +0.17% (flat/quiet)
        volume: 4600000,
        dayHigh: 2960.0,
        dayLow: 2945.0,
        dayOpen: 2950.0,
        previousClose: 2950.0,
      });

      const afternoonQuotes = await mockProvider.getQuotes(["RELIANCE", "TATAMOTORS"]);
      const benchmarkQuote = await mockProvider.getBenchmarkQuote();

      const evaluation1 = await engine.detectMeaningfulChanges({
        checkpoint: baselineCheckpoint,
        currentQuotes: afternoonQuotes,
        benchmarkQuote,
        evaluatedAt: "2026-09-06T14:30:00.000Z",
      });

      // Assert that TATAMOTORS is ranked #1 with SIGNIFICANT / MAJOR tier
      assert.equal(evaluation1.isQuietState, false);
      assert.equal(evaluation1.meaningfulChangesCount, 1);
      assert.equal(evaluation1.changes[0].symbol, "TATAMOTORS");
      assert.equal(evaluation1.changes[0].rank, 1);
      assert.ok(evaluation1.changes[0].evidence.significanceScore >= 60);
      assert.ok(
        evaluation1.changes[0].evidence.reasons.some(
          (r) => r.code === "PRICE_SURGE" || r.code === "VOLUME_SPIKE"
        )
      );

      // 3. User clicks "Checkpoint" to set new baseline at 02:30 PM
      const newCheckpoint: UserCheckpoint = {
        id: "cp-afternoon",
        userId: "usr-1",
        watchlistId: "wl-1",
        createdAt: "2026-09-06T14:30:00.000Z",
        snapshots: [
          {
            id: "s-3",
            checkpointId: "cp-afternoon",
            symbol: "RELIANCE",
            exchange: "NSE",
            price: 2955.0,
            priceTimestamp: "2026-09-06T14:30:00.000Z",
            volume: 4600000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T14:30:00.000Z",
          },
          {
            id: "s-4",
            checkpointId: "cp-afternoon",
            symbol: "TATAMOTORS",
            exchange: "NSE",
            price: 1100.0,
            priceTimestamp: "2026-09-06T14:30:00.000Z",
            volume: 25500000,
            dataStatus: "FRESH",
            createdAt: "2026-09-06T14:30:00.000Z",
          },
        ],
      };

      // 4. Immediately after checkpointing, UI re-evaluates: changes should now reset to QUIET STATE
      const evaluation2 = await engine.detectMeaningfulChanges({
        checkpoint: newCheckpoint,
        currentQuotes: afternoonQuotes,
        benchmarkQuote,
        evaluatedAt: "2026-09-06T14:30:05.000Z",
      });

      assert.equal(evaluation2.isQuietState, true);
      assert.equal(evaluation2.meaningfulChangesCount, 0);
      assert.equal(evaluation2.changes[0].evidence.significanceTier, "NORMAL");
      assert.equal(evaluation2.checkpointId, "cp-afternoon");
    });
  });
});
