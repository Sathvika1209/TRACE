import { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { Database, Json } from "@/types/database";
import {
  UserCheckpoint,
  CheckpointSnapshotItem,
  CreateCheckpointInput,
} from "@/types/checkpoint";

/**
 * Checkpoint Service Boundary & Implementation
 * Manages user checkpoint baselines and snapshots in Supabase PostgreSQL with transactional atomicity.
 */
export interface ICheckpointService {
  createCheckpoint(input: CreateCheckpointInput): Promise<UserCheckpoint>;
  getLatestCheckpoint(userId: string, watchlistId: string): Promise<UserCheckpoint | null>;
  getCheckpointById(checkpointId: string, userId: string): Promise<UserCheckpoint | null>;
  listCheckpoints(userId: string, watchlistId: string, limit?: number): Promise<UserCheckpoint[]>;
  deleteCheckpoint(checkpointId: string, userId: string): Promise<boolean>;
}

export class CheckpointService implements ICheckpointService {
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
   * Creates a checkpoint and its associated market snapshots atomically.
   * Leverages the `create_checkpoint_with_snapshots` PostgreSQL RPC to ensure no partial states exist.
   */
  async createCheckpoint(input: CreateCheckpointInput): Promise<UserCheckpoint> {
    if (!input.snapshots || input.snapshots.length === 0) {
      throw new Error("Cannot create a checkpoint without instrument snapshots.");
    }

    const supabase = await this.getClient();

    // Prepare JSON payload for the atomic RPC
    const snapshotsPayload = input.snapshots.map((s) => ({
      symbol: s.symbol.trim().toUpperCase(),
      exchange: (s.exchange ?? "NSE").trim().toUpperCase(),
      price: s.price ?? null,
      price_timestamp: s.priceTimestamp ?? new Date().toISOString(),
      volume: s.volume ?? null,
      day_high: s.dayHigh ?? null,
      day_low: s.dayLow ?? null,
      day_open: s.dayOpen ?? null,
      previous_close: s.previousClose ?? null,
      data_status: s.dataStatus ?? "FRESH",
    }));

    // Call atomic stored procedure
    const { data: checkpointId, error: rpcError } = await supabase.rpc(
      "create_checkpoint_with_snapshots",
      {
        p_watchlist_id: input.watchlistId,
        p_snapshots: snapshotsPayload as unknown as Json,
        p_metadata: (input.metadata ?? null) as unknown as Json,
      }
    );

    if (rpcError) {
      // Fallback: If RPC is not present in local test environment, perform sequential atomic verification
      if (rpcError.message.includes("function") && rpcError.message.includes("does not exist")) {
        return await this.createCheckpointManualFallback(input, snapshotsPayload);
      }
      throw new Error(`Failed to create checkpoint atomically: ${rpcError.message}`);
    }

    // Retrieve the newly created complete checkpoint with its snapshots
    const createdCheckpoint = await this.getCheckpointById(checkpointId, input.userId);
    if (!createdCheckpoint) {
      throw new Error("Checkpoint was created but could not be re-queried.");
    }

    return createdCheckpoint;
  }

  /**
   * Manual fallback insert for environments where the RPC has not been migrated yet.
   */
  private async createCheckpointManualFallback(
    input: CreateCheckpointInput,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapshotsPayload: any[]
  ): Promise<UserCheckpoint> {
    const supabase = await this.getClient();

    // 1. Insert checkpoint
    const { data: checkpointData, error: checkpointError } = await supabase
      .from("checkpoints")
      .insert({
        user_id: input.userId,
        watchlist_id: input.watchlistId,
        metadata: input.metadata ?? null,
      })
      .select()
      .single();

    if (checkpointError) {
      throw new Error(`Fallback checkpoint insert failed: ${checkpointError.message}`);
    }

    // 2. Insert snapshots
    const snapshotsToInsert = snapshotsPayload.map((s) => ({
      ...s,
      checkpoint_id: checkpointData.id,
    }));

    const { error: snapshotError } = await supabase
      .from("checkpoint_snapshots")
      .insert(snapshotsToInsert);

    if (snapshotError) {
      // Cleanup partial checkpoint if snapshot insertion failed
      await supabase.from("checkpoints").delete().eq("id", checkpointData.id);
      throw new Error(`Snapshot insert failed (checkpoint rolled back): ${snapshotError.message}`);
    }

    const created = await this.getCheckpointById(checkpointData.id, input.userId);
    if (!created) {
      throw new Error("Fallback checkpoint was created but could not be queried.");
    }
    return created;
  }

  /**
   * Retrieves the most recent checkpoint for a given watchlist.
   */
  async getLatestCheckpoint(userId: string, watchlistId: string): Promise<UserCheckpoint | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("checkpoints")
      .select(`
        id,
        user_id,
        watchlist_id,
        created_at,
        metadata,
        checkpoint_snapshots (
          id,
          checkpoint_id,
          symbol,
          exchange,
          price,
          price_timestamp,
          volume,
          day_high,
          day_low,
          day_open,
          previous_close,
          data_status,
          created_at
        )
      `)
      .eq("user_id", userId)
      .eq("watchlist_id", watchlistId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch latest checkpoint: ${error.message}`);
    }

    if (!data) return null;
    return this.mapCheckpointRow(data);
  }

  /**
   * Retrieves a specific checkpoint by ID.
   */
  async getCheckpointById(checkpointId: string, userId: string): Promise<UserCheckpoint | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("checkpoints")
      .select(`
        id,
        user_id,
        watchlist_id,
        created_at,
        metadata,
        checkpoint_snapshots (
          id,
          checkpoint_id,
          symbol,
          exchange,
          price,
          price_timestamp,
          volume,
          day_high,
          day_low,
          day_open,
          previous_close,
          data_status,
          created_at
        )
      `)
      .eq("id", checkpointId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch checkpoint: ${error.message}`);
    }

    if (!data) return null;
    return this.mapCheckpointRow(data);
  }

  /**
   * Lists chronological checkpoints for a watchlist (for history view).
   */
  async listCheckpoints(
    userId: string,
    watchlistId: string,
    limit = 10
  ): Promise<UserCheckpoint[]> {
    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("checkpoints")
      .select(`
        id,
        user_id,
        watchlist_id,
        created_at,
        metadata,
        checkpoint_snapshots (
          id,
          checkpoint_id,
          symbol,
          exchange,
          price,
          price_timestamp,
          volume,
          day_high,
          day_low,
          day_open,
          previous_close,
          data_status,
          created_at
        )
      `)
      .eq("user_id", userId)
      .eq("watchlist_id", watchlistId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to list checkpoints: ${error.message}`);
    }

    if (!data) return [];
    return data.map((row) => this.mapCheckpointRow(row));
  }

  /**
   * Deletes a checkpoint (cascades to snapshots).
   */
  async deleteCheckpoint(checkpointId: string, userId: string): Promise<boolean> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from("checkpoints")
      .delete()
      .eq("id", checkpointId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete checkpoint: ${error.message}`);
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapCheckpointRow(row: any): UserCheckpoint {
    const snapshots: CheckpointSnapshotItem[] = (row.checkpoint_snapshots ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => ({
        id: s.id,
        checkpointId: s.checkpoint_id,
        symbol: s.symbol,
        exchange: s.exchange,
        price: s.price !== null ? Number(s.price) : null,
        priceTimestamp: s.price_timestamp,
        volume: s.volume !== null ? Number(s.volume) : null,
        dayHigh: s.day_high !== null ? Number(s.day_high) : null,
        dayLow: s.day_low !== null ? Number(s.day_low) : null,
        dayOpen: s.day_open !== null ? Number(s.day_open) : null,
        previousClose: s.previous_close !== null ? Number(s.previous_close) : null,
        dataStatus: s.data_status,
        createdAt: s.created_at,
      }));

    return {
      id: row.id,
      userId: row.user_id,
      watchlistId: row.watchlist_id,
      createdAt: row.created_at,
      metadata: row.metadata,
      snapshots,
    };
  }
}
