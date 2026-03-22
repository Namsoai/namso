-- Migration: 20260322000024_dispute_states.sql
-- Description: Adds new failure-path explicit states to payment_status enum.
-- Note: 'disputed' and 'failed' already exist in the enum from initial setup.

DO $$ BEGIN
  ALTER TYPE public.payment_status ADD VALUE 'refund_requested';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.payment_status ADD VALUE 'refund_completed';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE public.payment_status ADD VALUE 'cancellation_completed';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
