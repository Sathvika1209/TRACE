import { DataStatus } from "./database";

export type { DataStatus };

/**
 * Market Data Domain Types
 * Defines canonical data structures for financial instruments, market quotes,
 * historical baselines, and data trust metrics.
 */

export interface MarketInstrument {
  id?: string;
  symbol: string;
  name: string;
  exchange: string;
  assetClass: "EQUITY" | "INDEX" | "COMMODITY" | "CRYPTO" | "FOREX";
  currency: string;
  isActive: boolean;
}

export interface MarketQuote {
  symbol: string;
  exchange: string;
  price: number | null;
  priceTimestamp: string | null; // ISO 8601 UTC string
  volume: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  dayOpen: number | null;
  previousClose: number | null;
  change?: number | null;
  changePercent?: number | null;
  dataStatus: DataStatus;
  source: string;
  cachedAt?: string; // ISO 8601 UTC string
}

export interface HistoricalBar {
  timestamp: string; // ISO 8601 UTC string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface InstrumentBaseline {
  symbol: string;
  avgVolume20d: number;
  avgDailyVolatilityPct: number; // e.g. 1.8% typical daily absolute price change
  avgDailyRangePct: number; // e.g. 2.5% typical intraday high-low range
  calculatedAt: string; // ISO 8601 UTC string
}

export interface BenchmarkQuote {
  symbol: string;
  name: string;
  price: number | null;
  priceTimestamp: string | null; // ISO 8601 UTC string
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  dataStatus: DataStatus;
  source: string;
}

export interface MarketSnapshot {
  id: string;
  capturedAt: string; // ISO 8601 UTC string
  quotes: Record<string, MarketQuote>;
  benchmark?: BenchmarkQuote | null;
}
