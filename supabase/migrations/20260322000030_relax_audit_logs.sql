-- Drop NOT NULL constraints on legacy audit log columns
-- Since the new Phase 5 RPCs log their state changes cleanly via the `metadata` JSONB payload and internal variables, they do not pipe external Gateway references like `transaction_id`.

ALTER TABLE public.escrow_audit_logs
  ALTER COLUMN transaction_id DROP NOT NULL,
  ALTER COLUMN old_status DROP NOT NULL,
  ALTER COLUMN requested_new_status DROP NOT NULL,
  ALTER COLUMN accepted DROP NOT NULL,
  ALTER COLUMN reason DROP NOT NULL;
