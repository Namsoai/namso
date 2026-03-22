-- ── Remove RPC Maintenance Debt ───────────────────────────────────────────
-- Extraneous RPCs for basic DB CRUD hide logic from the central RLS schema.
-- Removing the approve_task_work RPC.
DROP FUNCTION IF EXISTS public.approve_task_work(UUID);

-- ── Add RLS Insert Policy for Payments ────────────────────────────────────
-- Allows clients to insert a 'pending' payment record for their own tasks.
-- State transitions (pending -> held -> completed) remain protected,
-- as they require UPDATE privileges, which clients DO NOT have.
-- Only the Edge Functions (via service role) can update payment statuses.

CREATE POLICY "Clients can insert pending payments for their tasks"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND client_id = auth.uid())
    AND payer_id = auth.uid()
    AND status = 'pending'
  );
