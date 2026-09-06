import { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { Watchlist, WatchlistItem, CreateWatchlistInput, AddInstrumentInput } from "@/types/watchlist";

/**
 * Watchlist Service Boundary & Implementation
 * Manages user watchlists and instruments in Supabase PostgreSQL, strictly enforcing RLS and user ownership.
 */
export interface IWatchlistService {
  getUserWatchlists(userId: string): Promise<Watchlist[]>;
  getWatchlistById(watchlistId: string, userId: string): Promise<Watchlist | null>;
  createWatchlist(input: CreateWatchlistInput): Promise<Watchlist>;
  updateWatchlist(watchlistId: string, userId: string, name: string): Promise<Watchlist | null>;
  deleteWatchlist(watchlistId: string, userId: string): Promise<boolean>;
  addInstrumentToWatchlist(input: AddInstrumentInput): Promise<WatchlistItem>;
  removeInstrumentFromWatchlist(watchlistId: string, symbol: string, exchange?: string): Promise<boolean>;
  getOrCreateDefaultWatchlist(userId: string): Promise<Watchlist>;
}

export class WatchlistService implements IWatchlistService {
  private clientOverride?: SupabaseClient<Database>;

  constructor(clientOverride?: SupabaseClient<Database>) {
    this.clientOverride = clientOverride;
  }

  private async getClient(): Promise<SupabaseClient<Database>> {
    if (this.clientOverride) {
      return this.clientOverride;
    }
    return (await createServerSupabaseClient()) as unknown as SupabaseClient<Database>;
  }

  /**
   * Retrieves all watchlists for a specific user, including instruments ordered by display_order.
   */
  async getUserWatchlists(userId: string): Promise<Watchlist[]> {
    const supabase = await this.getClient();
    const { data: watchlists, error } = await supabase
      .from("watchlists")
      .select(`
        id,
        user_id,
        name,
        is_default,
        created_at,
        updated_at,
        watchlist_instruments (
          id,
          watchlist_id,
          symbol,
          exchange,
          display_name,
          display_order,
          added_at
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch user watchlists: ${error.message}`);
    }

    if (!watchlists) return [];

    return watchlists.map((w) => this.mapWatchlistRow(w));
  }

  /**
   * Retrieves a single watchlist by ID and ensures user ownership.
   */
  async getWatchlistById(watchlistId: string, userId: string): Promise<Watchlist | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("watchlists")
      .select(`
        id,
        user_id,
        name,
        is_default,
        created_at,
        updated_at,
        watchlist_instruments (
          id,
          watchlist_id,
          symbol,
          exchange,
          display_name,
          display_order,
          added_at
        )
      `)
      .eq("id", watchlistId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to fetch watchlist: ${error.message}`);
    }

    if (!data) return null;
    return this.mapWatchlistRow(data);
  }

  /**
   * Creates a new named watchlist for the user.
   */
  async createWatchlist(input: CreateWatchlistInput): Promise<Watchlist> {
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new Error("Watchlist name cannot be empty.");
    }

    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("watchlists")
      .insert({
        user_id: input.userId,
        name: trimmedName,
        is_default: input.isDefault ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create watchlist: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      items: [],
    };
  }

  /**
   * Updates an existing watchlist name.
   */
  async updateWatchlist(watchlistId: string, userId: string, name: string): Promise<Watchlist | null> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error("Watchlist name cannot be empty.");
    }

    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("watchlists")
      .update({
        name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", watchlistId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to update watchlist: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      isDefault: data.is_default,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Deletes a watchlist and cascades to its instruments and checkpoints.
   */
  async deleteWatchlist(watchlistId: string, userId: string): Promise<boolean> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("id", watchlistId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete watchlist: ${error.message}`);
    }

    return true;
  }

  /**
   * Adds an instrument to a watchlist with unique symbol constraint handling.
   */
  async addInstrumentToWatchlist(input: AddInstrumentInput): Promise<WatchlistItem> {
    const symbol = input.symbol.trim().toUpperCase();
    const exchange = (input.exchange ?? "NSE").trim().toUpperCase();

    if (!symbol) {
      throw new Error("Instrument symbol cannot be empty.");
    }

    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("watchlist_instruments")
      .insert({
        watchlist_id: input.watchlistId,
        symbol,
        exchange,
        display_name: input.displayName ?? null,
        display_order: input.displayOrder ?? 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(`Instrument ${symbol} (${exchange}) is already in this watchlist.`);
      }
      throw new Error(`Failed to add instrument to watchlist: ${error.message}`);
    }

    return {
      id: data.id,
      watchlistId: data.watchlist_id,
      symbol: data.symbol,
      exchange: data.exchange,
      displayName: data.display_name,
      displayOrder: data.display_order,
      addedAt: data.added_at,
    };
  }

  /**
   * Removes an instrument from a watchlist.
   */
  async removeInstrumentFromWatchlist(
    watchlistId: string,
    symbol: string,
    exchange = "NSE"
  ): Promise<boolean> {
    const supabase = await this.getClient();
    const upperSymbol = symbol.trim().toUpperCase();
    const upperExchange = exchange.trim().toUpperCase();

    const { error } = await supabase
      .from("watchlist_instruments")
      .delete()
      .eq("watchlist_id", watchlistId)
      .eq("symbol", upperSymbol)
      .eq("exchange", upperExchange);

    if (error) {
      throw new Error(`Failed to remove instrument from watchlist: ${error.message}`);
    }

    return true;
  }

  /**
   * Retrieves the default watchlist for a user, or creates "Main Watchlist" if none exists.
   */
  async getOrCreateDefaultWatchlist(userId: string): Promise<Watchlist> {
    const watchlists = await this.getUserWatchlists(userId);
    const defaultWatchlist = watchlists.find((w) => w.isDefault) || watchlists[0];

    if (defaultWatchlist) {
      return defaultWatchlist;
    }

    return await this.createWatchlist({
      userId,
      name: "Main Watchlist",
      isDefault: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapWatchlistRow(row: any): Watchlist {
    const items: WatchlistItem[] = (row.watchlist_instruments ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        id: item.id,
        watchlistId: item.watchlist_id,
        symbol: item.symbol,
        exchange: item.exchange,
        displayName: item.display_name,
        displayOrder: item.display_order,
        addedAt: item.added_at,
      }))
      .sort((a: WatchlistItem, b: WatchlistItem) => a.displayOrder - b.displayOrder);

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items,
    };
  }
}
