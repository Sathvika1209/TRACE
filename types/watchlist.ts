/**
 * Watchlist Domain Types
 * Defines data structures for user watchlists and instruments within watchlists.
 */

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  exchange: string;
  displayName?: string | null;
  displayOrder: number;
  addedAt: string; // ISO 8601 UTC timestamp
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string; // ISO 8601 UTC timestamp
  updatedAt: string; // ISO 8601 UTC timestamp
  items?: WatchlistItem[];
}

export interface CreateWatchlistInput {
  userId: string;
  name: string;
  isDefault?: boolean;
}

export interface AddInstrumentInput {
  watchlistId: string;
  symbol: string;
  exchange?: string;
  displayName?: string;
  displayOrder?: number;
}
