import {
  BenchmarkQuote,
  InstrumentBaseline,
  MarketInstrument,
  MarketQuote,
  MarketSnapshot,
} from "@/types/market";
import { IMarketDataProvider } from "./provider";
import { MockMarketDataProvider, KNOWN_INDIAN_EQUITIES } from "./mock-provider";
import { YahooMarketDataProvider } from "./yahoo-provider";

export interface IMarketDataService {
  getInstrument(
    symbol: string,
    exchange?: string
  ): Promise<MarketInstrument | null>;
  getLatestQuote(
    symbol: string,
    exchange?: string
  ): Promise<MarketQuote | null>;
  getQuotesForSymbols(
    symbols: string[],
    exchange?: string
  ): Promise<Record<string, MarketQuote>>;
  getHistoricalData(
    symbol: string,
    range?: "5d" | "1mo" | "3mo" | "1y"
  ): Promise<import("@/types/market").HistoricalBar[]>;
  getBenchmarkQuote(): Promise<BenchmarkQuote | null>;
  getBaselineMetrics(symbol: string): Promise<InstrumentBaseline | null>;
  getMarketSnapshot(
    symbols: string[],
    exchange?: string
  ): Promise<MarketSnapshot>;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Market Data Service Implementation
 * Provides caching, batching, benchmark fetching, snapshot orchestration,
 * and seamless fallback across providers.
 */
export class MarketDataService implements IMarketDataService {
  private provider: IMarketDataProvider;
  private quoteCache: Map<string, CacheEntry<MarketQuote>> = new Map();
  private baselineCache: Map<string, CacheEntry<InstrumentBaseline>> = new Map();
  private benchmarkCache: CacheEntry<BenchmarkQuote> | null = null;

  // TTL settings
  private readonly quoteTtlMs: number;
  private readonly baselineTtlMs: number;
  private readonly benchmarkTtlMs: number;

  constructor(
    primaryProvider?: IMarketDataProvider,
    options?: {
      quoteTtlMs?: number;
      baselineTtlMs?: number;
      benchmarkTtlMs?: number;
    }
  ) {
    if (primaryProvider) {
      this.provider = primaryProvider;
    } else {
      // Explicit selection: TRACE_MARKET_PROVIDER="mock" or test environment uses mock;
      // otherwise, live Yahoo provider is strictly used with no silent fallback.
      const useMock =
        process.env.TRACE_MARKET_PROVIDER === "mock" ||
        process.env.NODE_ENV === "test";

      this.provider = useMock
        ? new MockMarketDataProvider()
        : new YahooMarketDataProvider(4000);
    }

    this.quoteTtlMs = options?.quoteTtlMs ?? 30 * 1000; // 30 seconds
    this.baselineTtlMs = options?.baselineTtlMs ?? 60 * 60 * 1000; // 1 hour
    this.benchmarkTtlMs = options?.benchmarkTtlMs ?? 30 * 1000; // 30 seconds
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  public clearCache(): void {
    this.quoteCache.clear();
    this.baselineCache.clear();
    this.benchmarkCache = null;
  }

  async getInstrument(
    symbol: string,
    exchange: string = "NSE"
  ): Promise<MarketInstrument | null> {
    const sym = symbol.trim().toUpperCase();
    const known = KNOWN_INDIAN_EQUITIES[sym];

    if (known) {
      return {
        symbol: known.symbol,
        name: known.name,
        exchange: known.exchange,
        assetClass: "EQUITY",
        currency: "INR",
        isActive: true,
      };
    }

    return {
      symbol: sym,
      name: sym,
      exchange,
      assetClass: "EQUITY",
      currency: "INR",
      isActive: true,
    };
  }

  async getLatestQuote(
    symbol: string,
    exchange: string = "NSE"
  ): Promise<MarketQuote | null> {
    const quotes = await this.getQuotesForSymbols([symbol], exchange);
    return quotes[symbol.trim().toUpperCase()] || null;
  }

  async getQuotesForSymbols(
    symbols: string[],
    exchange: string = "NSE"
  ): Promise<Record<string, MarketQuote>> {
    const now = Date.now();
    const results: Record<string, MarketQuote> = {};
    const missingSymbols: string[] = [];

    // 1. Check in-memory cache
    for (const rawSym of symbols) {
      const sym = rawSym.trim().toUpperCase();
      const cached = this.quoteCache.get(sym);
      if (cached && cached.expiresAt > now) {
        results[sym] = cached.data;
      } else {
        missingSymbols.push(sym);
      }
    }

    if (missingSymbols.length === 0) {
      return results;
    }

    // 2. Fetch missing quotes from configured provider
    let fetchedQuotes: Record<string, MarketQuote> = {};
    try {
      fetchedQuotes = await this.provider.getQuotes(missingSymbols, exchange);
    } catch {
      // On provider failure, missing symbols will be filled with UNAVAILABLE status below
      fetchedQuotes = {};
    }

    // 3. Cache and populate missing results with strict non-fabrication (UNAVAILABLE)
    for (const sym of missingSymbols) {
      const quote =
        fetchedQuotes[sym] || {
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
          source: this.provider.name,
          cachedAt: new Date().toISOString(),
        };

      this.quoteCache.set(sym, {
        data: quote,
        expiresAt: now + this.quoteTtlMs,
      });
      results[sym] = quote;
    }

    return results;
  }

  async getBenchmarkQuote(): Promise<BenchmarkQuote | null> {
    const now = Date.now();
    if (this.benchmarkCache && this.benchmarkCache.expiresAt > now) {
      return this.benchmarkCache.data;
    }

    let quote: BenchmarkQuote | null = null;
    try {
      quote = await this.provider.getBenchmarkQuote();
    } catch {
      quote = null;
    }

    if (quote) {
      this.benchmarkCache = {
        data: quote,
        expiresAt: now + this.benchmarkTtlMs,
      };
    }

    return quote;
  }

  async getBaselineMetrics(symbol: string): Promise<InstrumentBaseline | null> {
    const sym = symbol.trim().toUpperCase();
    const now = Date.now();
    const cached = this.baselineCache.get(sym);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    let baseline: InstrumentBaseline | null = null;
    try {
      baseline = await this.provider.getBaselineMetrics(sym);
    } catch {
      baseline = null;
    }

    if (baseline) {
      this.baselineCache.set(sym, {
        data: baseline,
        expiresAt: now + this.baselineTtlMs,
      });
    }

    return baseline;
  }

  async getHistoricalData(
    symbol: string,
    range: "5d" | "1mo" | "3mo" | "1y" = "1mo"
  ): Promise<import("@/types/market").HistoricalBar[]> {
    try {
      return await this.provider.getHistoricalData(symbol, range);
    } catch {
      return [];
    }
  }

  async getMarketSnapshot(
    symbols: string[],
    exchange: string = "NSE"
  ): Promise<MarketSnapshot> {
    const [quotes, benchmark] = await Promise.all([
      this.getQuotesForSymbols(symbols, exchange),
      this.getBenchmarkQuote(),
    ]);

    return {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      capturedAt: new Date().toISOString(),
      quotes,
      benchmark,
    };
  }
}
