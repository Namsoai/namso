-- Migration: 20260322000031_delivery_metadata.sql
-- Description: Adds template tracking directly to the outbox ledger to ensure we know exactly which code generated the email.

ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS template_version TEXT;
