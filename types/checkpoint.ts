import { DataStatus, Json } from "./database";

/**
 * Checkpoint Domain Types
 * A checkpoint represents a recorded baseline of market and watchlist state
 * from a user's previous session/visit.
 */

export interface CheckpointSnapshotItem {
  id: string;
  checkpointId: string;
  symbol: string;
  exchange: string;
  price: number | null;
  priceTimestamp: string | null; // ISO 8601 UTC string
  volume: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  dayOpen?: number | null;
  previousClose?: number | null;
  dataStatus: DataStatus;
  createdAt: string; // ISO 8601 UTC string
}

export interface UserCheckpoint {
  id: string;
  userId: string;
  watchlistId: string;
  createdAt: string; // ISO 8601 UTC string
  metadata?: {
    clientSessionId?: string;
    trigger?: "AUTOMATIC_VISIT" | "MANUAL_CHECKPOINT" | "SESSION_START";
    [key: string]: unknown;
  } | null;
  snapshots?: CheckpointSnapshotItem[];
}

export interface CreateCheckpointInput {
  userId: string;
  watchlistId: string;
  snapshots: Array<{
    symbol: string;
    exchange?: string;
    price: number | null;
    priceTimestamp?: string | null;
    volume?: number | null;
    dayHigh?: number | null;
    dayLow?: number | null;
    dayOpen?: number | null;
    previousClose?: number | null;
    dataStatus?: DataStatus;
  }>;
  metadata?: Json | null;
}
