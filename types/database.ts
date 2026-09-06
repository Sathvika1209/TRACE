/**
 * Supabase PostgreSQL Database Type Definitions
 * Source of truth: supabase/migrations/20260906000000_initial_trace_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DataStatus = "FRESH" | "DELAYED" | "STALE" | "UNAVAILABLE";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      watchlist_instruments: {
        Row: {
          id: string;
          watchlist_id: string;
          symbol: string;
          exchange: string;
          display_name: string | null;
          display_order: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          watchlist_id: string;
          symbol: string;
          exchange?: string;
          display_name?: string | null;
          display_order?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          watchlist_id?: string;
          symbol?: string;
          exchange?: string;
          display_name?: string | null;
          display_order?: number;
          added_at?: string;
        };
        Relationships: [];
      };
      checkpoints: {
        Row: {
          id: string;
          user_id: string;
          watchlist_id: string;
          created_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          watchlist_id: string;
          created_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          watchlist_id?: string;
          created_at?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      checkpoint_snapshots: {
        Row: {
          id: string;
          checkpoint_id: string;
          symbol: string;
          exchange: string;
          price: number | null;
          price_timestamp: string | null;
          volume: number | null;
          day_high: number | null;
          day_low: number | null;
          day_open: number | null;
          previous_close: number | null;
          data_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          checkpoint_id: string;
          symbol: string;
          exchange?: string;
          price?: number | null;
          price_timestamp?: string | null;
          volume?: number | null;
          day_high?: number | null;
          day_low?: number | null;
          day_open?: number | null;
          previous_close?: number | null;
          data_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          checkpoint_id?: string;
          symbol?: string;
          exchange?: string;
          price?: number | null;
          price_timestamp?: string | null;
          volume?: number | null;
          day_high?: number | null;
          day_low?: number | null;
          day_open?: number | null;
          previous_close?: number | null;
          data_status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_checkpoint_with_snapshots: {
        Args: {
          p_watchlist_id: string;
          p_snapshots: Json;
          p_metadata?: Json | null;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
