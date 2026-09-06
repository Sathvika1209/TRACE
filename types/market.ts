/**
 * Market Data Domain Types
 * Defines data structures for financial instruments, market quotes, and snapshots.
 */

export interface MarketInstrument {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  assetClass: "EQUITY" | "INDEX" | "COMMODITY" | "CRYPTO" | "FOREX";
  currency: string;
  isActive: boolean;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string; // ISO 8601 string
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

export interface DataFreshness {
  lastUpdated: string; // ISO 8601 string
  isStale: boolean;
  stalenessThresholdSeconds: number;
  source: string;
}

export interface MarketSnapshot {
  id: string;
  capturedAt: string; // ISO 8601 string
  quotes: Record<string, MarketQuote>;
}
