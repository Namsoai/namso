-- =============================================================================
-- Migration 0004 — Performance Indexes
-- Project: Namso (ai-task-connect)
-- Date: 2026-03-22
-- =============================================================================
-- Run AFTER migration 0001 (tables must exist).
-- All indexes use IF NOT EXISTS — safe to re-run.
-- =============================================================================

-- tasks — most queries filter by client or freelancer, or sort by status
CREATE INDEX IF NOT EXISTS idx_tasks_client_id       ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_freelancer_id   ON public.tasks(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status          ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignment_status ON public.tasks(assignment_status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at      ON public.tasks(created_at DESC);

-- payments — escrow-webhook looks up by escrow_id
CREATE INDEX IF NOT EXISTS idx_payments_task_id      ON public.payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_payer_id     ON public.payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id     ON public.payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_escrow_id    ON public.payments(escrow_id);  -- TEXT lookup in webhook

-- messages — UI filters by sender OR receiver
CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id  ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id      ON public.messages(task_id);

-- notifications — per-user latest first, filter unread
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON public.notifications(user_id, read) WHERE read = FALSE;

-- audit logs — webhook reconciliation looks up by transaction_id
CREATE INDEX IF NOT EXISTS idx_audit_transaction_id  ON public.escrow_audit_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_payment_id      ON public.escrow_audit_logs(payment_id);

-- task_submissions — business views submissions for a task
CREATE INDEX IF NOT EXISTS idx_submissions_task_id   ON public.task_submissions(task_id);

-- freelancer_applications — admin filtering by status
CREATE INDEX IF NOT EXISTS idx_applications_status   ON public.freelancer_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email    ON public.freelancer_applications(lower(email));

-- reviews — freelancer profile rating lookup
CREATE INDEX IF NOT EXISTS idx_reviews_freelancer_id ON public.reviews(freelancer_id);
