import { MarketInstrument, MarketQuote, MarketSnapshot } from "@/types/market";

/**
 * Market Data Service Boundary
 * Abstract interface for fetching current market quotes, instrument details,
 * and historical/snapshot baselines from external market data providers.
 */
export interface IMarketDataService {
  getInstrument(symbol: string): Promise<MarketInstrument | null>;
  getLatestQuote(symbol: string): Promise<MarketQuote | null>;
  getQuotesForSymbols(symbols: string[]): Promise<Record<string, MarketQuote>>;
  getMarketSnapshot(symbols: string[]): Promise<MarketSnapshot>;
}

/**
 * Market Data Service Implementation Placeholder
 * In later phases, this will connect to the official market data provider.
 */
export class MarketDataService implements IMarketDataService {
  async getInstrument(_symbol: string): Promise<MarketInstrument | null> {
    throw new Error("MarketDataService.getInstrument not yet implemented in Phase 1.");
  }

  async getLatestQuote(_symbol: string): Promise<MarketQuote | null> {
    throw new Error("MarketDataService.getLatestQuote not yet implemented in Phase 1.");
  }

  async getQuotesForSymbols(_symbols: string[]): Promise<Record<string, MarketQuote>> {
    throw new Error("MarketDataService.getQuotesForSymbols not yet implemented in Phase 1.");
  }

  async getMarketSnapshot(_symbols: string[]): Promise<MarketSnapshot> {
    throw new Error("MarketDataService.getMarketSnapshot not yet implemented in Phase 1.");
  }
}
