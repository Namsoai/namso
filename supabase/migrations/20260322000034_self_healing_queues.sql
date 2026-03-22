-- 1. Extend notification_deliveries metadata for Self Healing queues
ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 5 NOT NULL,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dead_letter_reason TEXT;

-- 2. Concurrency-safe queue claiming function
CREATE OR REPLACE FUNCTION public.claim_notification_deliveries(p_limit INT DEFAULT 10)
RETURNS TABLE (
  delivery_id UUID,
  notification_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT id
    FROM public.notification_deliveries
    WHERE status = 'pending' 
       OR (status = 'failed' AND attempt_count < max_attempts AND (next_retry_at IS NULL OR next_retry_at <= now()))
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  )
  UPDATE public.notification_deliveries nd
  SET status = 'processing',
      updated_at = now()
  FROM claimed
  WHERE nd.id = claimed.id
  RETURNING nd.id as delivery_id, nd.notification_id;
END;
$$;

-- 3. Escrow Synchronization logging
CREATE TABLE IF NOT EXISTS public.reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    remote_state TEXT,
    local_state TEXT NOT NULL,
    action_taken TEXT,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Protect internal engine logs
ALTER TABLE public.reconciliation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliation logs" 
  ON public.reconciliation_logs
  FOR SELECT 
  TO authenticated 
  USING (public.is_admin());

-- The Cron and Edge Functions will run with Service Role keys, bypassing RLS for safe inserts.