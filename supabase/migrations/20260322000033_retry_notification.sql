-- Add attempt tracking to notification deliveries
ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS attempt_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMPTZ;

-- Secure RPC for retrying deliveries
CREATE OR REPLACE FUNCTION public.retry_notification_delivery(
  p_delivery_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_check BOOLEAN;
  v_status TEXT;
BEGIN
  -- 1. Ensure caller is an admin
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_admin_check IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can manually override delivery states';
  END IF;

  -- 2. Lock the row for update to prevent race conditions
  SELECT status INTO v_status
  FROM public.notification_deliveries
  WHERE id = p_delivery_id
  FOR UPDATE;

  -- 3. Validate current state
  IF v_status NOT IN ('failed', 'bounced') THEN
    RAISE EXCEPTION 'Invalid State: Only failed or bounced deliveries can be retried. Current: %', v_status;
  END IF;

  -- 4. Update the row cleanly
  UPDATE public.notification_deliveries
  SET
    status = 'pending',
    attempt_count = attempt_count + 1,
    last_attempted_at = now(),
    error = null,
    provider_message_id = null
  WHERE id = p_delivery_id;

  -- 5. (Optional) Audit the retry if tied to a payment. 
  -- Since notifications aren't strictly payment rows natively, logging them globally is sufficient,
  -- but we can lean on the updated_at timestamp or future system audit tables for deep tracking.

END;
$$;
