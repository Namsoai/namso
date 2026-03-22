-- =============================================================================
-- Migration 0035 — Analytics Medians RPC
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================
-- Computes server-side median time-between-steps for the Growth Analytics panel.
--
-- Pairing strategy (verified against event properties in migrations 0023, 0026):
--   signup/freelancer funnels → pair by user_id (same actor, guaranteed)
--   escrow funnels            → pair by properties->>'payment_id'
--                               (actors differ: client creates, webhook/admin funds/releases)
--
-- Duplicate event guard: escrow medians use DISTINCT ON (payment_id) to pick
-- only the FIRST matching end-event per payment, preventing inflated counts
-- when repeated events occur on the same payment.
--
-- NULL behaviour: each metric returns NULL when no qualifying pairs exist.
-- The UI layer renders NULL as '—'.

CREATE OR REPLACE FUNCTION public.get_analytics_medians(
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(

    -- ── Signup funnel ─────────────────────────────────────────────────────────
    -- Pair by user_id: same authenticated user starts and completes signup.
    'signup_to_complete_hrs',
    (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gap_hrs)
     FROM (
       SELECT EXTRACT(EPOCH FROM (b.occurred_at - a.occurred_at)) / 3600.0 AS gap_hrs
       FROM analytics_events a
       JOIN analytics_events b
         ON  b.user_id       = a.user_id
         AND b.event_name    = 'business_signup_completed'
         AND b.occurred_at    > a.occurred_at
       WHERE a.event_name = 'business_signup_started'
         AND (p_since IS NULL OR a.occurred_at >= p_since)
     ) t),

    -- ── Freelancer funnel ─────────────────────────────────────────────────────
    -- Pair by user_id: freelancer submits and is approved under the same uid.
    'app_to_approved_hrs',
    (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gap_hrs)
     FROM (
       SELECT EXTRACT(EPOCH FROM (b.occurred_at - a.occurred_at)) / 3600.0 AS gap_hrs
       FROM analytics_events a
       JOIN analytics_events b
         ON  b.user_id       = a.user_id
         AND b.event_name    = 'freelancer_approved'
         AND b.occurred_at    > a.occurred_at
       WHERE a.event_name = 'freelancer_application_submitted'
         AND (p_since IS NULL OR a.occurred_at >= p_since)
     ) t),

    -- ── Escrow: Created → Funded ──────────────────────────────────────────────
    -- Pair by payment_id in properties (both sides must be non-null).
    -- DISTINCT ON picks the earliest matching 'escrow_funded' per payment
    -- to protect against duplicate end events.
    'escrow_created_to_funded_hrs',
    (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gap_hrs)
     FROM (
       SELECT DISTINCT ON (a.properties->>'payment_id')
         EXTRACT(EPOCH FROM (b.occurred_at - a.occurred_at)) / 3600.0 AS gap_hrs
       FROM analytics_events a
       JOIN analytics_events b
         ON  b.properties->>'payment_id' = a.properties->>'payment_id'
         AND b.properties->>'payment_id' IS NOT NULL
         AND b.event_name                = 'escrow_funded'
         AND b.occurred_at               > a.occurred_at
       WHERE a.event_name               = 'escrow_created'
         AND a.properties->>'payment_id' IS NOT NULL
         AND (p_since IS NULL OR a.occurred_at >= p_since)
       ORDER BY a.properties->>'payment_id', b.occurred_at ASC
     ) t),

    -- ── Escrow: Funded → Released ─────────────────────────────────────────────
    -- Same pattern: pair by payment_id, pick earliest release per payment.
    'funded_to_released_hrs',
    (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gap_hrs)
     FROM (
       SELECT DISTINCT ON (a.properties->>'payment_id')
         EXTRACT(EPOCH FROM (b.occurred_at - a.occurred_at)) / 3600.0 AS gap_hrs
       FROM analytics_events a
       JOIN analytics_events b
         ON  b.properties->>'payment_id' = a.properties->>'payment_id'
         AND b.properties->>'payment_id' IS NOT NULL
         AND b.event_name                = 'escrow_released'
         AND b.occurred_at               > a.occurred_at
       WHERE a.event_name               = 'escrow_funded'
         AND a.properties->>'payment_id' IS NOT NULL
         AND (p_since IS NULL OR a.occurred_at >= p_since)
       ORDER BY a.properties->>'payment_id', b.occurred_at ASC
     ) t),

    -- ── Pending applications ──────────────────────────────────────────────────
    -- Direct table reads; no analytics_events join required.
    'pending_apps_count',
    (SELECT COUNT(*)
     FROM public.freelancer_applications
     WHERE status = 'pending'),

    'oldest_pending_app_days',
    (SELECT EXTRACT(EPOCH FROM (now() - MIN(created_at))) / 86400.0
     FROM public.freelancer_applications
     WHERE status = 'pending')

  );
$$;

-- Admin-only: no client access needed
REVOKE ALL ON FUNCTION public.get_analytics_medians(TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_medians(TIMESTAMPTZ) TO service_role;
