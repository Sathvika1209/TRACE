/**
 * Supabase Database Type Definitions Placeholder
 * This file will be populated with generated Supabase database types
 * (e.g. via `supabase gen types typescript`) once the database schema is established in Phase 2.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Tables will be defined deliberately in the database design phase.
      [_: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {
      [_: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [_: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
}
