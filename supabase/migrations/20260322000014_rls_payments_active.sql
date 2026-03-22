-- =============================================================================
-- Migration 0014 — Payments Policy Patch for account_status
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================
-- The previous migration 0013 missed the exact policy name for payments.
-- Dropping the policy created in 000009 and appending the is_active() lock.

DROP POLICY IF EXISTS "Clients can insert pending payments for their tasks" ON public.payments;

CREATE POLICY "Clients can insert pending payments for their tasks"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND client_id = auth.uid())
    AND payer_id = auth.uid()
    AND status = 'pending'
    AND is_active()
  );
