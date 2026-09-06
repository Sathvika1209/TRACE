import {
  BenchmarkQuote,
  HistoricalBar,
  InstrumentBaseline,
  MarketQuote,
} from "@/types/market";

/**
 * Market Data Provider Contract
 * Abstraction layer for external data feeds (Yahoo Finance, NSE, AlphaVantage, Mock, etc.).
 */
export interface IMarketDataProvider {
  readonly name: string;

  /**
   * Fetches latest normalized market quotes for a batch of symbols.
   */
  getQuotes(
    symbols: string[],
    exchange?: string
  ): Promise<Record<string, MarketQuote>>;

  /**
   * Fetches historical OHLCV bars for an instrument over a specified time range.
   */
  getHistoricalData(
    symbol: string,
    range?: "5d" | "1mo" | "3mo" | "1y"
  ): Promise<HistoricalBar[]>;

  /**
   * Fetches the current quote for the primary market benchmark (e.g., NIFTY 50).
   */
  getBenchmarkQuote(): Promise<BenchmarkQuote | null>;

  /**
   * Fetches or calculates statistical baseline metrics (20d avg volume, typical daily volatility).
   */
  getBaselineMetrics(symbol: string): Promise<InstrumentBaseline | null>;
}
