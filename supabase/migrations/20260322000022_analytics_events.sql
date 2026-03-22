-- =============================================================================
-- Migration 0022 — Analytics Events Table
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================
-- Design principles:
--   frontend tracks intent / UI funnel (anon client INSERT via RLS)
--   backend tracks truth / state transitions (service role INSERT from triggers/functions)

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  event_name   TEXT        NOT NULL,
  user_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id   TEXT,                              -- optional frontend fingerprint
  properties   JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Index for time-series admin queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at ON public.analytics_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name  ON public.analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id     ON public.analytics_events (user_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their OWN events (frontend funnel tracking)
CREATE POLICY "analytics_events: user can insert own"
  ON public.analytics_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL       -- allow anonymous events (signup started)
  );

-- Only service role / admins can read; regular users cannot query other users' events
-- (No SELECT policy = only service role can read, which is what the admin analytics page needs)
