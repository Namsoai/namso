-- =============================================================================
-- Migration 0021 — Strict Deduplication Keys for Edge Notifications
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS dedupe_key TEXT UNIQUE;
