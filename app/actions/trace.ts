"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";
import { WatchlistService } from "@/server/watchlist/service";
import { CheckpointService } from "@/server/checkpoint/service";
import { MarketDataService } from "@/server/market/service";
import { MeaningfulChangeEngine } from "@/server/change-engine/engine";
import { validateSymbol } from "@/lib/validation";
import { Watchlist } from "@/types/watchlist";
import { UserCheckpoint } from "@/types/checkpoint";
import {
  BenchmarkQuote,
  HistoricalBar,
  InstrumentBaseline,
  MarketQuote,
} from "@/types/market";
import {
  ChangeDetectionResult,
  StructuredChangeEvidence,
} from "@/types/change-engine";

export interface OverviewData {
  user: {
    id: string;
    email?: string;
  } | null;
  watchlist: Watchlist | null;
  latestCheckpoint: UserCheckpoint | null;
  changeResult: ChangeDetectionResult | null;
  currentQuotes: Record<string, MarketQuote>;
  benchmarkQuote: BenchmarkQuote | null;
  providerName: string;
  error?: string;
}

export interface InstrumentDetailData {
  symbol: string;
  exchange: string;
  displayName?: string;
  currentQuote: MarketQuote;
  baselineSnapshot: {
    price: number | null;
    priceTimestamp: string | null;
    volume: number | null;
    dataStatus: string;
  } | null;
  baselineMetrics: InstrumentBaseline | null;
  benchmarkQuote: BenchmarkQuote | null;
  historicalBars: HistoricalBar[];
  evidence: StructuredChangeEvidence;
  checkpointTimestamp: string | null;
  explanation: string;
  providerName: string;
}

const DEFAULT_INDIAN_WATCHLIST_SYMBOLS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "TATAMOTORS",
  "ICICIBANK",
  "ITC",
  "SBIN",
];

/**
 * Retrieves full overview state for the authenticated user's primary watchlist.
 */
export async function getOverviewDataAction(): Promise<OverviewData> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      watchlist: null,
      latestCheckpoint: null,
      changeResult: null,
      currentQuotes: {},
      benchmarkQuote: null,
      providerName: "NONE",
      error: "UNAUTHENTICATED",
    };
  }

  try {
    const watchlistService = new WatchlistService();
    const checkpointService = new CheckpointService();
    const marketDataService = new MarketDataService();
    const changeEngine = new MeaningfulChangeEngine();

    // 1. Get or create user default watchlist
    let watchlist = await watchlistService.getOrCreateDefaultWatchlist(user.id);
    const initialItems = watchlist.items || [];

    // If new watchlist has 0 items, seed it with initial default Indian equities
    if (initialItems.length === 0) {
      for (let i = 0; i < DEFAULT_INDIAN_WATCHLIST_SYMBOLS.length; i++) {
        const sym = DEFAULT_INDIAN_WATCHLIST_SYMBOLS[i];
        try {
          await watchlistService.addInstrumentToWatchlist({
            watchlistId: watchlist.id,
            symbol: sym,
            exchange: "NSE",
            displayOrder: i,
          });
        } catch {
          // Ignore duplicate add errors
        }
      }
      // Reload watchlist with seeded instruments
      watchlist = await watchlistService.getOrCreateDefaultWatchlist(user.id);
    }

    const items = watchlist.items || [];
    const symbols = items.map((item) => item.symbol);

    // 2. Fetch current market quotes and benchmark quote
    const [currentQuotes, benchmarkQuote] = await Promise.all([
      marketDataService.getQuotesForSymbols(symbols, "NSE"),
      marketDataService.getBenchmarkQuote(),
    ]);

    // 3. Fetch latest checkpoint
    const latestCheckpoint = await checkpointService.getLatestCheckpoint(
      user.id,
      watchlist.id
    );

    // 4. Fetch baseline statistical profiles for all watchlist symbols
    const baselinePromises = symbols.map((sym) =>
      marketDataService.getBaselineMetrics(sym)
    );
    const baselinesList = await Promise.all(baselinePromises);
    const baselines: Record<string, InstrumentBaseline> = {};
    for (const b of baselinesList) {
      if (b) baselines[b.symbol.toUpperCase()] = b;
    }

    // 5. Evaluate deterministic change engine
    const changeResult = await changeEngine.detectMeaningfulChanges({
      checkpoint: latestCheckpoint,
      currentQuotes,
      benchmarkQuote,
      baselines,
      evaluatedAt: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      watchlist,
      latestCheckpoint,
      changeResult,
      currentQuotes,
      benchmarkQuote,
      providerName: marketDataService.getProviderName(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load overview data.";
    return {
      user: { id: user.id, email: user.email },
      watchlist: null,
      latestCheckpoint: null,
      changeResult: null,
      currentQuotes: {},
      benchmarkQuote: null,
      providerName: "UNKNOWN",
      error: message,
    };
  }
}

/**
 * Creates a new checkpoint for the user's watchlist, establishing a new baseline.
 */
export async function createCheckpointAction(watchlistId: string): Promise<{
  success: boolean;
  checkpoint?: UserCheckpoint;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const watchlistService = new WatchlistService();
    const checkpointService = new CheckpointService();
    const marketDataService = new MarketDataService();

    const watchlist = await watchlistService.getWatchlistById(watchlistId, user.id);
    if (!watchlist) {
      return { success: false, error: "Watchlist not found." };
    }

    const items = watchlist.items || [];
    if (items.length === 0) {
      return { success: false, error: "Cannot checkpoint an empty watchlist." };
    }

    const symbols = items.map((item) => item.symbol);
    const quotes = await marketDataService.getQuotesForSymbols(symbols, "NSE");

    const snapshots = symbols.map((sym) => {
      const quote = quotes[sym.toUpperCase()];
      return {
        symbol: sym.toUpperCase(),
        exchange: "NSE",
        price: quote ? quote.price : null,
        priceTimestamp: quote ? quote.priceTimestamp : new Date().toISOString(),
        volume: quote ? quote.volume : null,
        dayHigh: quote ? quote.dayHigh : null,
        dayLow: quote ? quote.dayLow : null,
        dayOpen: quote ? quote.dayOpen : null,
        previousClose: quote ? quote.previousClose : null,
        dataStatus: quote ? quote.dataStatus : "UNAVAILABLE",
      };
    });

    const checkpoint = await checkpointService.createCheckpoint({
      userId: user.id,
      watchlistId: watchlist.id,
      snapshots,
      metadata: {
        trigger: "MANUAL_CHECKPOINT",
        clientTimestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/");
    revalidatePath("/watchlist");
    revalidatePath("/history");

    return { success: true, checkpoint };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkpoint creation failed.";
    return { success: false, error: message };
  }
}

/**
 * Refreshes market data without advancing the checkpoint baseline.
 */
export async function refreshOverviewAction(_watchlistId?: string): Promise<OverviewData> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      watchlist: null,
      latestCheckpoint: null,
      changeResult: null,
      currentQuotes: {},
      benchmarkQuote: null,
      providerName: "NONE",
      error: "UNAUTHENTICATED",
    };
  }

  try {
    const marketDataService = new MarketDataService();
    marketDataService.clearCache(); // Force fresh quote fetch

    const overview = await getOverviewDataAction();
    revalidatePath("/");
    return overview;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Refresh failed.";
    return {
      user: { id: user.id, email: user.email },
      watchlist: null,
      latestCheckpoint: null,
      changeResult: null,
      currentQuotes: {},
      benchmarkQuote: null,
      providerName: "UNKNOWN",
      error: message,
    };
  }
}

/**
 * Adds an instrument to the user's active watchlist.
 */
export async function addInstrumentAction(
  watchlistId: string,
  symbol: string,
  exchange: string = "NSE",
  displayName?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const validation = validateSymbol(symbol);
  if (!validation.success || !validation.data) {
    return { success: false, error: "Invalid equity symbol format." };
  }

  try {
    const watchlistService = new WatchlistService();
    await watchlistService.addInstrumentToWatchlist({
      watchlistId,
      symbol: validation.data,
      exchange: exchange.toUpperCase(),
      displayName,
    });

    revalidatePath("/");
    revalidatePath("/watchlist");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add instrument.";
    return { success: false, error: message };
  }
}

/**
 * Removes an instrument from the user's active watchlist.
 */
export async function removeInstrumentAction(
  watchlistId: string,
  symbol: string,
  exchange: string = "NSE"
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    const watchlistService = new WatchlistService();
    await watchlistService.removeInstrumentFromWatchlist(
      watchlistId,
      symbol.toUpperCase(),
      exchange.toUpperCase()
    );

    revalidatePath("/");
    revalidatePath("/watchlist");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove instrument.";
    return { success: false, error: message };
  }
}

/**
 * Fetches deep analytical detail for a single instrument.
 */
export async function getInstrumentDetailAction(
  symbol: string,
  exchange: string = "NSE"
): Promise<InstrumentDetailData | null> {
  const sym = symbol.trim().toUpperCase();
  const user = await getCurrentUser();
  const marketDataService = new MarketDataService();
  const changeEngine = new MeaningfulChangeEngine();

  try {
    const [quotes, benchmarkQuote, baselineMetrics, historicalBars] =
      await Promise.all([
        marketDataService.getQuotesForSymbols([sym], exchange),
        marketDataService.getBenchmarkQuote(),
        marketDataService.getBaselineMetrics(sym),
        marketDataService.getHistoricalData(sym, "1mo"),
      ]);

    const currentQuote = quotes[sym] || {
      symbol: sym,
      exchange,
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
      source: marketDataService.getProviderName(),
    };

    let baselineSnapshot: InstrumentDetailData["baselineSnapshot"] = null;
    let checkpointTimestamp: string | null = null;

    if (user) {
      const watchlistService = new WatchlistService();
      const checkpointService = new CheckpointService();
      const watchlist = await watchlistService.getOrCreateDefaultWatchlist(user.id);
      const latestCheckpoint = await checkpointService.getLatestCheckpoint(
        user.id,
        watchlist.id
      );

      if (latestCheckpoint) {
        checkpointTimestamp = latestCheckpoint.createdAt;
        const snap = latestCheckpoint.snapshots?.find(
          (s) => s.symbol.toUpperCase() === sym
        );
        if (snap) {
          baselineSnapshot = {
            price: snap.price,
            priceTimestamp: snap.priceTimestamp,
            volume: snap.volume,
            dataStatus: snap.dataStatus,
          };
        }
      }
    }

    const benchmarkPerformance = benchmarkQuote
      ? {
          symbol: benchmarkQuote.symbol,
          name: benchmarkQuote.name,
          baselinePrice: benchmarkQuote.previousClose,
          currentPrice: benchmarkQuote.price,
          deltaPercent: benchmarkQuote.changePercent,
        }
      : null;

    const evidence = changeEngine.calculateStructuredEvidence(
      sym,
      currentQuote,
      baselineSnapshot?.price ?? null,
      baselineSnapshot?.volume ?? null,
      benchmarkPerformance,
      baselineMetrics
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const explanation = (changeEngine as any).generateDeterministicExplanation(evidence);

    return {
      symbol: sym,
      exchange,
      currentQuote,
      baselineSnapshot,
      baselineMetrics,
      benchmarkQuote,
      historicalBars,
      evidence,
      checkpointTimestamp,
      explanation,
      providerName: marketDataService.getProviderName(),
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the user's checkpoint history.
 */
export async function getHistoryAction(): Promise<{
  checkpoints: UserCheckpoint[];
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { checkpoints: [], error: "Authentication required." };
  }

  try {
    const watchlistService = new WatchlistService();
    const checkpointService = new CheckpointService();

    const watchlist = await watchlistService.getOrCreateDefaultWatchlist(user.id);
    const checkpoints = await checkpointService.listCheckpoints(user.id, watchlist.id, 20);

    return { checkpoints };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load history.";
    return { checkpoints: [], error: message };
  }
}
