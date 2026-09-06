import { UserCheckpoint } from "@/types/checkpoint";

/**
 * Checkpoint Service Boundary
 * Abstract interface for recording and retrieving baseline market/user checkpoints.
 */
export interface ICheckpointService {
  recordCheckpoint(
    userId: string,
    watchlistId: string,
    state: UserCheckpoint["state"],
    metadata?: UserCheckpoint["metadata"]
  ): Promise<UserCheckpoint>;

  getLatestCheckpoint(userId: string, watchlistId: string): Promise<UserCheckpoint | null>;
  getCheckpointById(checkpointId: string, userId: string): Promise<UserCheckpoint | null>;
}

/**
 * Checkpoint Service Implementation Placeholder
 * In later phases, this will manage checkpoint creation, deduplication, and retrieval in Supabase PostgreSQL.
 */
export class CheckpointService implements ICheckpointService {
  async recordCheckpoint(
    _userId: string,
    _watchlistId: string,
    _state: UserCheckpoint["state"],
    _metadata?: UserCheckpoint["metadata"]
  ): Promise<UserCheckpoint> {
    throw new Error("CheckpointService.recordCheckpoint not yet implemented in Phase 1.");
  }

  async getLatestCheckpoint(
    _userId: string,
    _watchlistId: string
  ): Promise<UserCheckpoint | null> {
    throw new Error("CheckpointService.getLatestCheckpoint not yet implemented in Phase 1.");
  }

  async getCheckpointById(
    _checkpointId: string,
    _userId: string
  ): Promise<UserCheckpoint | null> {
    throw new Error("CheckpointService.getCheckpointById not yet implemented in Phase 1.");
  }
}
