-- =============================================================================
-- Migration 0016 — Notifications Ledger, Payloads & Preferences
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================
-- This migration transforms the basic notification system into a robust, 
-- decoupled event-driven architecture ready for transactional emails.

-- 1. Upgrade public.notifications
-- Add JSONB payload to pass structured deterministic entities to the UI and email template.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Create public.notification_deliveries
-- Segregated ledger guaranteeing webhook idempotency and robust tracking.
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  error TEXT,
  attempted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  UNIQUE(notification_id, channel)
);

-- Protect internal delivery logs from public reads
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
-- No RLS policies are added because ONLY the Service Role (Edge Functions) interacts with this ledger.
-- Clients never read or write raw delivery attempts.

-- 3. Create public.notification_preferences
-- Modular opt-out gate mapped to user profiles.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_preferences: users can view own"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences: users can update own"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enforce triggers to populate preferences organically
CREATE OR REPLACE FUNCTION public.handle_new_user_preference()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_preference
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preference();

-- Backfill preferences for existing operational profiles
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
