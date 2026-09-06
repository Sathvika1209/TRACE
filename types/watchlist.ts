/**
 * Watchlist Domain Types
 * Defines data structures for user watchlists and instruments within watchlists.
 */

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  displayOrder: number;
  addedAt: string; // ISO 8601 string
  notes?: string;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  items?: WatchlistItem[];
}
