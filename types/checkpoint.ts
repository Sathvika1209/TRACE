import { MarketQuote } from "./market";

/**
 * Checkpoint Domain Types
 * A checkpoint represents a recorded baseline of market and watchlist state
 * from a user's previous session/visit.
 */

export interface CheckpointInstrumentState {
  symbol: string;
  price: number;
  volume: number;
  capturedAt: string; // ISO 8601 string
  quoteSnapshot: MarketQuote;
}

export interface UserCheckpoint {
  id: string;
  userId: string;
  watchlistId: string;
  createdAt: string; // ISO 8601 string
  state: Record<string, CheckpointInstrumentState>;
  metadata?: {
    clientSessionId?: string;
    trigger?: "AUTOMATIC_VISIT" | "MANUAL_CHECKPOINT" | "SESSION_START";
  };
}

export interface CheckpointComparisonRequest {
  userId: string;
  watchlistId: string;
  targetCheckpointId?: string; // Optional: compare against specific or latest checkpoint
}
