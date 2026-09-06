import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { WatchlistService } from "../server/watchlist/service";
import { CheckpointService } from "../server/checkpoint/service";
import { validateSymbol, validateWatchlistName } from "../lib/validation/index";

describe("TRACE Persistence & Domain Contracts (Phase 4)", () => {
  describe("1. Input Validation & Domain Constraints", () => {
    test("validateSymbol accepts valid Indian equity symbols and normalizes case", () => {
      const res = validateSymbol(" tatamotors ");
      assert.equal(res.success, true);
      assert.equal(res.data, "TATAMOTORS");
    });

    test("validateSymbol rejects invalid empty or malformed symbols", () => {
      const emptyRes = validateSymbol("   ");
      assert.equal(emptyRes.success, false);
      assert.ok(emptyRes.errors?.symbol);

      const invalidCharRes = validateSymbol("RELIANCE$$%#");
      assert.equal(invalidCharRes.success, false);
      assert.ok(invalidCharRes.errors?.symbol);
    });

    test("validateWatchlistName requires non-empty names up to 50 characters", () => {
      const valid = validateWatchlistName("High Beta Indian Equities");
      assert.equal(valid.success, true);
      assert.equal(valid.data, "High Beta Indian Equities");

      const empty = validateWatchlistName("   ");
      assert.equal(empty.success, false);

      const tooLong = validateWatchlistName("A".repeat(55));
      assert.equal(tooLong.success, false);
    });
  });

  describe("2. Watchlist Service Contracts & User Isolation", () => {
    test("WatchlistService instantiation without client uses server client factory", () => {
      const service = new WatchlistService();
      assert.ok(service);
      assert.equal(typeof service.getUserWatchlists, "function");
      assert.equal(typeof service.createWatchlist, "function");
      assert.equal(typeof service.addInstrumentToWatchlist, "function");
    });

    test("WatchlistService enforces non-empty names on creation", async () => {
      const service = new WatchlistService();
      await assert.rejects(
        async () => {
          await service.createWatchlist({
            userId: "00000000-0000-0000-0000-000000000001",
            name: "   ",
          });
        },
        {
          name: "Error",
          message: "Watchlist name cannot be empty.",
        }
      );
    });

    test("WatchlistService enforces non-empty symbols when adding instruments", async () => {
      const service = new WatchlistService();
      await assert.rejects(
        async () => {
          await service.addInstrumentToWatchlist({
            watchlistId: "00000000-0000-0000-0000-000000000002",
            symbol: "   ",
          });
        },
        {
          name: "Error",
          message: "Instrument symbol cannot be empty.",
        }
      );
    });

    test("WatchlistService maps relational rows into typed Watchlist domain entities", () => {
      const mockRow = {
        id: "wl-100",
        user_id: "usr-42",
        name: "Core Nifty Watchlist",
        is_default: true,
        created_at: "2026-09-06T10:00:00.000Z",
        updated_at: "2026-09-06T10:00:00.000Z",
        watchlist_instruments: [
          {
            id: "wi-1",
            watchlist_id: "wl-100",
            symbol: "RELIANCE",
            exchange: "NSE",
            display_name: "Reliance Industries",
            display_order: 1,
            added_at: "2026-09-06T10:01:00.000Z",
          },
          {
            id: "wi-2",
            watchlist_id: "wl-100",
            symbol: "TCS",
            exchange: "NSE",
            display_name: "Tata Consultancy Services",
            display_order: 0,
            added_at: "2026-09-06T10:02:00.000Z",
          },
        ],
      };

      const service = new WatchlistService();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).mapWatchlistRow(mockRow);

      assert.equal(result.id, "wl-100");
      assert.equal(result.userId, "usr-42");
      assert.equal(result.isDefault, true);
      assert.equal(result.items.length, 2);
      // Verify sort order by displayOrder
      assert.equal(result.items[0].symbol, "TCS");
      assert.equal(result.items[1].symbol, "RELIANCE");
    });
  });

  describe("3. Checkpoint Service & Null Data Preservation", () => {
    test("CheckpointService requires snapshots when creating a checkpoint", async () => {
      const service = new CheckpointService();
      await assert.rejects(
        async () => {
          await service.createCheckpoint({
            userId: "00000000-0000-0000-0000-000000000001",
            watchlistId: "00000000-0000-0000-0000-000000000002",
            snapshots: [],
          });
        },
        {
          name: "Error",
          message: "Cannot create a checkpoint without instrument snapshots.",
        }
      );
    });

    test("Checkpoint snapshot mapping preserves NULL values and never invents zero", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRawRow: any = {
        id: "cp-1",
        user_id: "user-1",
        watchlist_id: "wl-1",
        created_at: "2026-09-06T10:15:00.000Z",
        metadata: { trigger: "SESSION_START" },
        checkpoint_snapshots: [
          {
            id: "snap-1",
            checkpoint_id: "cp-1",
            symbol: "TATAMOTORS",
            exchange: "NSE",
            price: "1042.5000",
            price_timestamp: "2026-09-06T10:14:50.000Z",
            volume: "2840000",
            day_high: "1050.0000",
            day_low: "1035.0000",
            day_open: "1038.0000",
            previous_close: "994.0000",
            data_status: "FRESH",
            created_at: "2026-09-06T10:15:00.000Z",
          },
          {
            id: "snap-2",
            checkpoint_id: "cp-1",
            symbol: "HALTED_STOCK",
            exchange: "NSE",
            price: null, // Null price must be preserved as null
            price_timestamp: null,
            volume: null,
            day_high: null,
            day_low: null,
            day_open: null,
            previous_close: "450.0000",
            data_status: "UNAVAILABLE",
            created_at: "2026-09-06T10:15:00.000Z",
          },
        ],
      };

      const service = new CheckpointService();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (service as any).mapCheckpointRow(mockRawRow);

      assert.equal(mapped.id, "cp-1");
      assert.equal(mapped.snapshots.length, 2);

      // Verify normal quote parsing
      const snap1 = mapped.snapshots[0];
      assert.equal(snap1.symbol, "TATAMOTORS");
      assert.equal(snap1.price, 1042.5);
      assert.equal(snap1.volume, 2840000);
      assert.equal(snap1.dataStatus, "FRESH");

      // Verify strict NULL preservation (NOT 0)
      const snap2 = mapped.snapshots[1];
      assert.equal(snap2.symbol, "HALTED_STOCK");
      assert.equal(snap2.price, null, "Price must remain null, NOT 0");
      assert.equal(snap2.volume, null, "Volume must remain null, NOT 0");
      assert.equal(snap2.dataStatus, "UNAVAILABLE");
      assert.equal(snap2.previousClose, 450.0);
    });
  });

  describe("4. Migration Script Structure & Constraints Verification", () => {
    test("Initial migration file exists and defines all 5 core tables", () => {
      const migrationPath = path.join(
        __dirname,
        "../supabase/migrations/20260906000000_initial_trace_schema.sql"
      );
      assert.ok(fs.existsSync(migrationPath), "Migration SQL file must exist.");

      const sqlContent = fs.readFileSync(migrationPath, "utf-8");

      // Table definitions
      assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS public.profiles"));
      assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS public.watchlists"));
      assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS public.watchlist_instruments"));
      assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS public.checkpoints"));
      assert.ok(sqlContent.includes("CREATE TABLE IF NOT EXISTS public.checkpoint_snapshots"));

      // Unique constraint on watchlist_instruments (symbol, exchange, watchlist_id)
      assert.ok(sqlContent.includes("CONSTRAINT uq_watchlist_symbol_exchange UNIQUE"));

      // RLS enables
      assert.ok(sqlContent.includes("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"));
      assert.ok(sqlContent.includes("ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;"));
      assert.ok(sqlContent.includes("ALTER TABLE public.watchlist_instruments ENABLE ROW LEVEL SECURITY;"));
      assert.ok(sqlContent.includes("ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;"));
      assert.ok(sqlContent.includes("ALTER TABLE public.checkpoint_snapshots ENABLE ROW LEVEL SECURITY;"));

      // Atomic function
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.create_checkpoint_with_snapshots"));

      // User onboarding trigger
      assert.ok(sqlContent.includes("CREATE OR REPLACE FUNCTION public.handle_new_user"));
    });
  });
});
