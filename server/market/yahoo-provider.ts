import {
  BenchmarkQuote,
  DataStatus,
  HistoricalBar,
  InstrumentBaseline,
  MarketQuote,
} from "@/types/market";
import { IMarketDataProvider } from "./provider";

/**
 * Yahoo Finance Market Data Provider
 * Fetches real-world market quotes, historical bars, and NIFTY 50 benchmark
 * data for Indian equities (.NS / .BO suffixes) with timeout protection and
 * strict status classification.
 */
interface YahooChartMeta {
  regularMarketPrice?: number;
  regularMarketTime?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketDayOpen?: number;
  chartPreviousClose?: number;
  previousClose?: number;
}

interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[];
    error?: unknown;
  };
}

export class YahooMarketDataProvider implements IMarketDataProvider {
  readonly name = "YAHOO_FINANCE";
  private readonly timeoutMs: number;

  constructor(timeoutMs: number = 5000) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Formats local Indian symbol to Yahoo Finance ticker format.
   * e.g., "TATAMOTORS", "NSE" -> "TATAMOTORS.NS"
   * e.g., "^NSEI" -> "^NSEI"
   */
  private formatTicker(symbol: string, exchange: string = "NSE"): string {
    const cleanSym = symbol.trim().toUpperCase();
    if (cleanSym.startsWith("^")) {
      return cleanSym;
    }
    if (cleanSym.endsWith(".NS") || cleanSym.endsWith(".BO")) {
      return cleanSym;
    }
    if (exchange.toUpperCase() === "BSE") {
      return `${cleanSym}.BO`;
    }
    return `${cleanSym}.NS`;
  }

  /**
   * Determine data freshness based on quote timestamp and current time.
   */
  private determineDataStatus(marketTimeSec?: number): DataStatus {
    if (!marketTimeSec || marketTimeSec <= 0) {
      return "UNAVAILABLE";
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const ageSec = nowSec - marketTimeSec;

    // Under 20 minutes: DELAYED (Standard free Yahoo feed has ~15m delay for Indian markets)
    if (ageSec < 20 * 60) {
      return "DELAYED";
    }

    // Between 20 minutes and 24 hours: DELAYED (market closed / end-of-day)
    if (ageSec < 24 * 60 * 60) {
      return "DELAYED";
    }

    // Older than 24 hours (e.g. holiday or long stale period)
    return "STALE";
  }

  private async fetchChartData(
    ticker: string,
    range: string = "1mo",
    interval: string = "1d"
  ): Promise<YahooChartResult | null> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker
    )}?range=${range}&interval=${interval}&includePrePost=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const json = (await response.json()) as YahooChartResponse;
      return json?.chart?.result?.[0] || null;
    } catch {
      // Return null on timeout, network failure, or rate limit
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getQuotes(
    symbols: string[],
    exchange: string = "NSE"
  ): Promise<Record<string, MarketQuote>> {
    const results: Record<string, MarketQuote> = {};
    const nowIso = new Date().toISOString();

    // Fetch batch quotes concurrently with graceful per-instrument error isolation
    const fetchPromises = symbols.map(async (rawSymbol) => {
      const sym = rawSymbol.trim().toUpperCase();
      const ticker = this.formatTicker(sym, exchange);

      try {
        const chartData = await this.fetchChartData(ticker, "5d", "1d");

        if (!chartData || !chartData.meta) {
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
            cachedAt: nowIso,
          };
          return;
        }

        const meta = chartData.meta;
        const regularMarketPrice =
          typeof meta.regularMarketPrice === "number"
            ? meta.regularMarketPrice
            : null;
        const regularMarketTime = meta.regularMarketTime
          ? new Date(meta.regularMarketTime * 1000).toISOString()
          : null;
        const previousClose =
          typeof meta.chartPreviousClose === "number"
            ? meta.chartPreviousClose
            : typeof meta.previousClose === "number"
            ? meta.previousClose
            : null;

        let change: number | null = null;
        let changePercent: number | null = null;

        if (regularMarketPrice !== null && previousClose !== null && previousClose > 0) {
          change = Number((regularMarketPrice - previousClose).toFixed(4));
          changePercent = Number(
            (((regularMarketPrice - previousClose) / previousClose) * 100).toFixed(4)
          );
        }

        const dataStatus = this.determineDataStatus(meta.regularMarketTime);

        // Extract high, low, open, volume from meta or most recent quote indicators
        const dayHigh =
          typeof meta.regularMarketDayHigh === "number"
            ? meta.regularMarketDayHigh
            : null;
        const dayLow =
          typeof meta.regularMarketDayLow === "number"
            ? meta.regularMarketDayLow
            : null;
        const dayOpen =
          typeof meta.regularMarketDayOpen === "number"
            ? meta.regularMarketDayOpen
            : null;
        const volume =
          typeof meta.regularMarketVolume === "number"
            ? meta.regularMarketVolume
            : null;

        results[sym] = {
          symbol: sym,
          exchange,
          price: regularMarketPrice,
          priceTimestamp: regularMarketTime,
          volume,
          dayHigh,
          dayLow,
          dayOpen,
          previousClose,
          change,
          changePercent,
          dataStatus,
          source: this.name,
          cachedAt: nowIso,
        };
      } catch {
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
          cachedAt: nowIso,
        };
      }
    });

    await Promise.all(fetchPromises);
    return results;
  }

  async getHistoricalData(
    symbol: string,
    range: "5d" | "1mo" | "3mo" | "1y" = "1mo"
  ): Promise<HistoricalBar[]> {
    const ticker = this.formatTicker(symbol);
    const chartData = await this.fetchChartData(ticker, range, "1d");

    if (!chartData || !chartData.timestamp || !chartData.indicators?.quote?.[0]) {
      return [];
    }

    const timestamps: number[] = chartData.timestamp;
    const quotes = chartData.indicators.quote[0];
    const opens: (number | null)[] = quotes.open || [];
    const highs: (number | null)[] = quotes.high || [];
    const lows: (number | null)[] = quotes.low || [];
    const closes: (number | null)[] = quotes.close || [];
    const volumes: (number | null)[] = quotes.volume || [];

    const bars: HistoricalBar[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close === null || close === undefined || isNaN(close)) {
        continue;
      }

      bars.push({
        timestamp: new Date(timestamps[i] * 1000).toISOString(),
        open: typeof opens[i] === "number" ? opens[i]! : close,
        high: typeof highs[i] === "number" ? highs[i]! : close,
        low: typeof lows[i] === "number" ? lows[i]! : close,
        close,
        volume: typeof volumes[i] === "number" ? volumes[i]! : 0,
      });
    }

    return bars;
  }

  async getBenchmarkQuote(): Promise<BenchmarkQuote | null> {
    try {
      const chartData = await this.fetchChartData("^NSEI", "5d", "1d");
      if (!chartData || !chartData.meta) {
        return null;
      }

      const meta = chartData.meta;
      const price =
        typeof meta.regularMarketPrice === "number"
          ? meta.regularMarketPrice
          : null;
      const priceTimestamp = meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null;
      const previousClose =
        typeof meta.chartPreviousClose === "number"
          ? meta.chartPreviousClose
          : typeof meta.previousClose === "number"
          ? meta.previousClose
          : null;

      let change: number | null = null;
      let changePercent: number | null = null;

      if (price !== null && previousClose !== null && previousClose > 0) {
        change = Number((price - previousClose).toFixed(2));
        changePercent = Number(
          (((price - previousClose) / previousClose) * 100).toFixed(4)
        );
      }

      const dataStatus = this.determineDataStatus(meta.regularMarketTime);

      return {
        symbol: "^NSEI",
        name: "NIFTY 50",
        price,
        priceTimestamp,
        change,
        changePercent,
        previousClose,
        dataStatus,
        source: this.name,
      };
    } catch {
      return null;
    }
  }

  async getBaselineMetrics(symbol: string): Promise<InstrumentBaseline | null> {
    const bars = await this.getHistoricalData(symbol, "1mo");

    if (bars.length < 5) {
      // Insufficient data to compute reliable 20-day statistics; return safe baseline
      return {
        symbol: symbol.toUpperCase(),
        avgVolume20d: 1000000,
        avgDailyVolatilityPct: 1.5,
        avgDailyRangePct: 2.2,
        calculatedAt: new Date().toISOString(),
      };
    }

    // Take the last 20 bars (or all available if < 20)
    const recentBars = bars.slice(-20);
    const volumeSum = recentBars.reduce((acc, bar) => acc + (bar.volume || 0), 0);
    const avgVolume20d = Math.round(volumeSum / recentBars.length);

    // Compute average absolute daily return and average daily range %
    let dailyReturnSum = 0;
    let rangeSum = 0;

    for (let i = 1; i < recentBars.length; i++) {
      const prevClose = recentBars[i - 1].close;
      const currClose = recentBars[i].close;
      if (prevClose > 0) {
        const ret = Math.abs((currClose - prevClose) / prevClose) * 100;
        dailyReturnSum += ret;
      }

      const open = recentBars[i].open;
      const high = recentBars[i].high;
      const low = recentBars[i].low;
      if (open > 0) {
        const range = ((high - low) / open) * 100;
        rangeSum += range;
      }
    }

    const count = recentBars.length - 1 || 1;
    const avgDailyVolatilityPct = Number((dailyReturnSum / count).toFixed(2));
    const avgDailyRangePct = Number((rangeSum / count).toFixed(2));

    return {
      symbol: symbol.toUpperCase(),
      avgVolume20d: avgVolume20d > 0 ? avgVolume20d : 1000000,
      avgDailyVolatilityPct: avgDailyVolatilityPct > 0.1 ? avgDailyVolatilityPct : 1.5,
      avgDailyRangePct: avgDailyRangePct > 0.1 ? avgDailyRangePct : 2.0,
      calculatedAt: new Date().toISOString(),
    };
  }
}
