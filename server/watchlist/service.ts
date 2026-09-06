import { Watchlist, WatchlistItem } from "@/types/watchlist";

/**
 * Watchlist Service Boundary
 * Abstract interface for managing user watchlists and items in persistence layer (Supabase PostgreSQL).
 */
export interface IWatchlistService {
  getUserWatchlists(userId: string): Promise<Watchlist[]>;
  getWatchlistById(watchlistId: string, userId: string): Promise<Watchlist | null>;
  createWatchlist(userId: string, name: string, description?: string): Promise<Watchlist>;
  addInstrumentToWatchlist(watchlistId: string, symbol: string): Promise<WatchlistItem>;
  removeInstrumentFromWatchlist(watchlistId: string, symbol: string): Promise<boolean>;
}

/**
 * Watchlist Service Implementation Placeholder
 * In later phases, this will execute isolated Supabase queries respecting RLS.
 */
export class WatchlistService implements IWatchlistService {
  async getUserWatchlists(_userId: string): Promise<Watchlist[]> {
    throw new Error("WatchlistService.getUserWatchlists not yet implemented in Phase 1.");
  }

  async getWatchlistById(_watchlistId: string, _userId: string): Promise<Watchlist | null> {
    throw new Error("WatchlistService.getWatchlistById not yet implemented in Phase 1.");
  }

  async createWatchlist(_userId: string, _name: string, _description?: string): Promise<Watchlist> {
    throw new Error("WatchlistService.createWatchlist not yet implemented in Phase 1.");
  }

  async addInstrumentToWatchlist(_watchlistId: string, _symbol: string): Promise<WatchlistItem> {
    throw new Error("WatchlistService.addInstrumentToWatchlist not yet implemented in Phase 1.");
  }

  async removeInstrumentFromWatchlist(_watchlistId: string, _symbol: string): Promise<boolean> {
    throw new Error("WatchlistService.removeInstrumentFromWatchlist not yet implemented in Phase 1.");
  }
}
