import {
  BenchmarkQuote,
  HistoricalBar,
  InstrumentBaseline,
  MarketQuote,
} from "@/types/market";
import { IMarketDataProvider } from "./provider";

export interface MockInstrumentProfile {
  symbol: string;
  name: string;
  exchange: string;
  basePrice: number;
  avgVolume20d: number;
  avgDailyVolatilityPct: number;
  avgDailyRangePct: number;
}

export const KNOWN_INDIAN_EQUITIES: Record<string, MockInstrumentProfile> = {
  RELIANCE: {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    exchange: "NSE",
    basePrice: 2950.0,
    avgVolume20d: 4500000,
    avgDailyVolatilityPct: 1.4,
    avgDailyRangePct: 2.1,
  },
  TCS: {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd",
    exchange: "NSE",
    basePrice: 4200.0,
    avgVolume20d: 1800000,
    avgDailyVolatilityPct: 1.1,
    avgDailyRangePct: 1.7,
  },
  INFY: {
    symbol: "INFY",
    name: "Infosys Ltd",
    exchange: "NSE",
    basePrice: 1650.0,
    avgVolume20d: 5200000,
    avgDailyVolatilityPct: 1.6,
    avgDailyRangePct: 2.3,
  },
  HDFCBANK: {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    exchange: "NSE",
    basePrice: 1540.0,
    avgVolume20d: 12000000,
    avgDailyVolatilityPct: 1.3,
    avgDailyRangePct: 1.9,
  },
  TATAMOTORS: {
    symbol: "TATAMOTORS",
    name: "Tata Motors Ltd",
    exchange: "NSE",
    basePrice: 1040.0,
    avgVolume20d: 8500000,
    avgDailyVolatilityPct: 2.4,
    avgDailyRangePct: 3.5,
  },
  ICICIBANK: {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd",
    exchange: "NSE",
    basePrice: 1120.0,
    avgVolume20d: 7800000,
    avgDailyVolatilityPct: 1.5,
    avgDailyRangePct: 2.2,
  },
  ITC: {
    symbol: "ITC",
    name: "ITC Ltd",
    exchange: "NSE",
    basePrice: 480.0,
    avgVolume20d: 9200000,
    avgDailyVolatilityPct: 0.9,
    avgDailyRangePct: 1.3,
  },
  SBIN: {
    symbol: "SBIN",
    name: "State Bank of India",
    exchange: "NSE",
    basePrice: 820.0,
    avgVolume20d: 14000000,
    avgDailyVolatilityPct: 1.8,
    avgDailyRangePct: 2.6,
  },
  BHARTIARTL: {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Ltd",
    exchange: "NSE",
    basePrice: 1420.0,
    avgVolume20d: 3600000,
    avgDailyVolatilityPct: 1.4,
    avgDailyRangePct: 2.0,
  },
  LT: {
    symbol: "LT",
    name: "Larsen & Toubro Ltd",
    exchange: "NSE",
    basePrice: 3600.0,
    avgVolume20d: 2100000,
    avgDailyVolatilityPct: 1.5,
    avgDailyRangePct: 2.2,
  },
};

export const MOCK_NIFTY50_BENCHMARK: MockInstrumentProfile = {
  symbol: "^NSEI",
  name: "NIFTY 50",
  exchange: "NSE",
  basePrice: 24850.0,
  avgVolume20d: 180000000,
  avgDailyVolatilityPct: 0.75,
  avgDailyRangePct: 1.1,
};

/**
 * Deterministic Mock Market Data Provider
 * Provides realistic Indian equities data with support for override states,
 * baseline metrics, and predictable calculation for automated testing.
 */
export class MockMarketDataProvider implements IMarketDataProvider {
  readonly name = "TRACE_MOCK_PROVIDER";

  private quoteOverrides: Map<string, Partial<MarketQuote>> = new Map();
  private benchmarkOverride: Partial<BenchmarkQuote> | null = null;
  private fixedTimestamp: string | null = null;

  constructor(fixedTimestamp?: string) {
    if (fixedTimestamp) {
      this.fixedTimestamp = fixedTimestamp;
    }
  }

  /**
   * Override a quote for deterministic unit testing.
   */
  public setQuoteOverride(symbol: string, override: Partial<MarketQuote>): void {
    this.quoteOverrides.set(symbol.toUpperCase(), override);
  }

  /**
   * Clear all overrides.
   */
  public clearOverrides(): void {
    this.quoteOverrides.clear();
    this.benchmarkOverride = null;
  }

  /**
   * Override the benchmark quote.
   */
  public setBenchmarkOverride(override: Partial<BenchmarkQuote> | null): void {
    this.benchmarkOverride = override;
  }

  private getCurrentTimestamp(): string {
    return this.fixedTimestamp || new Date().toISOString();
  }

  async getQuotes(
    symbols: string[],
    exchange: string = "NSE"
  ): Promise<Record<string, MarketQuote>> {
    const results: Record<string, MarketQuote> = {};
    const timestamp = this.getCurrentTimestamp();

    for (const rawSymbol of symbols) {
      const sym = rawSymbol.trim().toUpperCase();
      const override = this.quoteOverrides.get(sym);

      if (override) {
        results[sym] = {
          symbol: sym,
          exchange: override.exchange || exchange,
          price: override.price !== undefined ? override.price : null,
          priceTimestamp: override.priceTimestamp !== undefined ? override.priceTimestamp : timestamp,
          volume: override.volume !== undefined ? override.volume : null,
          dayHigh: override.dayHigh !== undefined ? override.dayHigh : null,
          dayLow: override.dayLow !== undefined ? override.dayLow : null,
          dayOpen: override.dayOpen !== undefined ? override.dayOpen : null,
          previousClose: override.previousClose !== undefined ? override.previousClose : null,
          change: override.change !== undefined ? override.change : null,
          changePercent: override.changePercent !== undefined ? override.changePercent : null,
          dataStatus: override.dataStatus || "FRESH",
          source: override.source || this.name,
          cachedAt: timestamp,
        };
        continue;
      }

      const profile = KNOWN_INDIAN_EQUITIES[sym];
      if (!profile) {
        // Unknown or unlisted symbol: return safe UNAVAILABLE quote
        results[sym] = {
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
          source: this.name,
          cachedAt: timestamp,
        };
        continue;
      }

      const prevClose = profile.basePrice;
      const currentPrice = profile.basePrice;
      const change = 0.0;
      const changePercent = 0.0;
      const dayHigh = currentPrice * 1.008;
      const dayLow = currentPrice * 0.992;
      const dayOpen = currentPrice * 1.001;
      const volume = profile.avgVolume20d;

      results[sym] = {
        symbol: sym,
        exchange: profile.exchange,
        price: currentPrice,
        priceTimestamp: timestamp,
        volume,
        dayHigh: Number(dayHigh.toFixed(2)),
        dayLow: Number(dayLow.toFixed(2)),
        dayOpen: Number(dayOpen.toFixed(2)),
        previousClose: prevClose,
        change,
        changePercent,
        dataStatus: "FRESH",
        source: this.name,
        cachedAt: timestamp,
      };
    }

    return results;
  }

  async getHistoricalData(
    symbol: string,
    _range: "5d" | "1mo" | "3mo" | "1y" = "1mo"
  ): Promise<HistoricalBar[]> {
    const sym = symbol.trim().toUpperCase();
    const profile = KNOWN_INDIAN_EQUITIES[sym] || {
      symbol: sym,
      name: sym,
      exchange: "NSE",
      basePrice: 1000.0,
      avgVolume20d: 1000000,
      avgDailyVolatilityPct: 1.5,
      avgDailyRangePct: 2.0,
    };

    const bars: HistoricalBar[] = [];
    const baseDate = new Date(this.getCurrentTimestamp());

    for (let i = 20; i >= 1; i--) {
      const barDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      const close = profile.basePrice * (1 + ((i % 5) - 2) * 0.005);
      const open = close * 0.998;
      const high = close * 1.01;
      const low = close * 0.99;
      const volume = profile.avgVolume20d;

      bars.push({
        timestamp: barDate.toISOString(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
      });
    }

    return bars;
  }

  async getBenchmarkQuote(): Promise<BenchmarkQuote | null> {
    const timestamp = this.getCurrentTimestamp();

    if (this.benchmarkOverride) {
      return {
        symbol: this.benchmarkOverride.symbol || MOCK_NIFTY50_BENCHMARK.symbol,
        name: this.benchmarkOverride.name || MOCK_NIFTY50_BENCHMARK.name,
        price: this.benchmarkOverride.price !== undefined ? this.benchmarkOverride.price : MOCK_NIFTY50_BENCHMARK.basePrice,
        priceTimestamp: this.benchmarkOverride.priceTimestamp !== undefined ? this.benchmarkOverride.priceTimestamp : timestamp,
        change: this.benchmarkOverride.change !== undefined ? this.benchmarkOverride.change : 0,
        changePercent: this.benchmarkOverride.changePercent !== undefined ? this.benchmarkOverride.changePercent : 0,
        previousClose: this.benchmarkOverride.previousClose !== undefined ? this.benchmarkOverride.previousClose : MOCK_NIFTY50_BENCHMARK.basePrice,
        dataStatus: this.benchmarkOverride.dataStatus || "FRESH",
        source: this.benchmarkOverride.source || this.name,
      };
    }

    return {
      symbol: MOCK_NIFTY50_BENCHMARK.symbol,
      name: MOCK_NIFTY50_BENCHMARK.name,
      price: MOCK_NIFTY50_BENCHMARK.basePrice,
      priceTimestamp: timestamp,
      change: 0,
      changePercent: 0,
      previousClose: MOCK_NIFTY50_BENCHMARK.basePrice,
      dataStatus: "FRESH",
      source: this.name,
    };
  }

  async getBaselineMetrics(symbol: string): Promise<InstrumentBaseline | null> {
    const sym = symbol.trim().toUpperCase();
    const profile = KNOWN_INDIAN_EQUITIES[sym];

    if (!profile) {
      // Return a safe default baseline for unknown symbols
      return {
        symbol: sym,
        avgVolume20d: 1000000,
        avgDailyVolatilityPct: 1.5,
        avgDailyRangePct: 2.2,
        calculatedAt: this.getCurrentTimestamp(),
      };
    }

    return {
      symbol: profile.symbol,
      avgVolume20d: profile.avgVolume20d,
      avgDailyVolatilityPct: profile.avgDailyVolatilityPct,
      avgDailyRangePct: profile.avgDailyRangePct,
      calculatedAt: this.getCurrentTimestamp(),
    };
  }
}
