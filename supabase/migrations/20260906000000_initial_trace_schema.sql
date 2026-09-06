-- ==========================================================================
-- TRACE — Initial Database Schema & RLS Policies (Phase 4)
-- ==========================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------------
-- 1. Profiles Table (User Preferences & Metadata)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- 2. Watchlists Table (User-Owned Collections of Instruments)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT check_watchlist_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- --------------------------------------------------------------------------
-- 3. Watchlist Instruments Table (Instruments Within Watchlists)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.watchlist_instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  display_name TEXT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_watchlist_symbol_exchange UNIQUE (watchlist_id, symbol, exchange),
  CONSTRAINT check_symbol_not_empty CHECK (char_length(trim(symbol)) > 0)
);

-- --------------------------------------------------------------------------
-- 4. Checkpoints Table (User Baseline Snapshots / Memory Layer)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NULL
);

-- --------------------------------------------------------------------------
-- 5. Checkpoint Snapshots Table (Observed Market Quote State per Instrument)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checkpoint_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id UUID NOT NULL REFERENCES public.checkpoints(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  price NUMERIC(14, 4) NULL,
  price_timestamp TIMESTAMPTZ NULL,
  volume BIGINT NULL,
  day_high NUMERIC(14, 4) NULL,
  day_low NUMERIC(14, 4) NULL,
  day_open NUMERIC(14, 4) NULL,
  previous_close NUMERIC(14, 4) NULL,
  data_status TEXT NOT NULL DEFAULT 'FRESH',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_checkpoint_symbol_exchange UNIQUE (checkpoint_id, symbol, exchange),
  CONSTRAINT check_data_status CHECK (data_status IN ('FRESH', 'DELAYED', 'STALE', 'UNAVAILABLE'))
);

-- --------------------------------------------------------------------------
-- 6. Performance Indexes
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id 
  ON public.watchlists(user_id);

CREATE INDEX IF NOT EXISTS idx_watchlist_instruments_watchlist_id 
  ON public.watchlist_instruments(watchlist_id);

CREATE INDEX IF NOT EXISTS idx_checkpoints_user_watchlist 
  ON public.checkpoints(user_id, watchlist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkpoint_snapshots_checkpoint_id 
  ON public.checkpoint_snapshots(checkpoint_id);

CREATE INDEX IF NOT EXISTS idx_checkpoint_snapshots_symbol_exchange 
  ON public.checkpoint_snapshots(symbol, exchange);

-- --------------------------------------------------------------------------
-- 7. Row Level Security (RLS) Policies
-- --------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Watchlists policies
CREATE POLICY "Users can view their own watchlists"
  ON public.watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own watchlists"
  ON public.watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists"
  ON public.watchlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists"
  ON public.watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Watchlist Instruments policies
CREATE POLICY "Users can view instruments in their own watchlists"
  ON public.watchlist_instruments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists w
      WHERE w.id = watchlist_instruments.watchlist_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add instruments to their own watchlists"
  ON public.watchlist_instruments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watchlists w
      WHERE w.id = watchlist_instruments.watchlist_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update instruments in their own watchlists"
  ON public.watchlist_instruments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists w
      WHERE w.id = watchlist_instruments.watchlist_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove instruments from their own watchlists"
  ON public.watchlist_instruments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists w
      WHERE w.id = watchlist_instruments.watchlist_id
        AND w.user_id = auth.uid()
    )
  );

-- Checkpoints policies
CREATE POLICY "Users can view their own checkpoints"
  ON public.checkpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create checkpoints for their own watchlists"
  ON public.checkpoints FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.watchlists w
      WHERE w.id = checkpoints.watchlist_id
        AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own checkpoints"
  ON public.checkpoints FOR DELETE
  USING (auth.uid() = user_id);

-- Checkpoint Snapshots policies
CREATE POLICY "Users can view snapshots from their own checkpoints"
  ON public.checkpoint_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checkpoints c
      WHERE c.id = checkpoint_snapshots.checkpoint_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert snapshots into their own checkpoints"
  ON public.checkpoint_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.checkpoints c
      WHERE c.id = checkpoint_snapshots.checkpoint_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete snapshots from their own checkpoints"
  ON public.checkpoint_snapshots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.checkpoints c
      WHERE c.id = checkpoint_snapshots.checkpoint_id
        AND c.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 8. Atomic Checkpoint Creation Function
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_checkpoint_with_snapshots(
  p_watchlist_id UUID,
  p_snapshots JSONB,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_checkpoint_id UUID;
  v_snapshot JSONB;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify user owns the watchlist
  IF NOT EXISTS (
    SELECT 1 FROM public.watchlists
    WHERE id = p_watchlist_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Watchlist not found or access denied';
  END IF;

  -- Create checkpoint record
  INSERT INTO public.checkpoints (
    user_id,
    watchlist_id,
    metadata
  ) VALUES (
    v_user_id,
    p_watchlist_id,
    p_metadata
  ) RETURNING id INTO v_checkpoint_id;

  -- Insert snapshots atomically
  IF p_snapshots IS NOT NULL AND jsonb_array_length(p_snapshots) > 0 THEN
    FOR v_snapshot IN SELECT * FROM jsonb_array_elements(p_snapshots)
    LOOP
      INSERT INTO public.checkpoint_snapshots (
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
        data_status
      ) VALUES (
        v_checkpoint_id,
        (v_snapshot->>'symbol')::TEXT,
        COALESCE((v_snapshot->>'exchange')::TEXT, 'NSE'),
        (v_snapshot->>'price')::NUMERIC,
        CASE 
          WHEN v_snapshot->>'price_timestamp' IS NOT NULL 
          THEN (v_snapshot->>'price_timestamp')::TIMESTAMPTZ 
          ELSE NULL 
        END,
        (v_snapshot->>'volume')::BIGINT,
        (v_snapshot->>'day_high')::NUMERIC,
        (v_snapshot->>'day_low')::NUMERIC,
        (v_snapshot->>'day_open')::NUMERIC,
        (v_snapshot->>'previous_close')::NUMERIC,
        COALESCE((v_snapshot->>'data_status')::TEXT, 'FRESH')
      );
    END LOOP;
  END IF;

  RETURN v_checkpoint_id;
END;
$$;

-- --------------------------------------------------------------------------
-- 9. Automatic User Onboarding Trigger (Creates Profile & Default Watchlist)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  -- Create default primary watchlist
  INSERT INTO public.watchlists (user_id, name, is_default)
  VALUES (NEW.id, 'Main Watchlist', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
