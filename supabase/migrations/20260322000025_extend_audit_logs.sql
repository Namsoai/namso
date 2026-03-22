-- Migration: 20260322000025_extend_audit_logs.sql
-- Description: Expands escrow_audit_logs with fields critical for dispute auditing.

ALTER TABLE public.escrow_audit_logs
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Optional: Create an index on actor_id if we ever want to see "all actions taken by user X"
CREATE INDEX IF NOT EXISTS idx_escrow_audit_logs_actor_id ON public.escrow_audit_logs(actor_id);
