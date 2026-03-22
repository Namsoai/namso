-- Migration: 20260322000026_financial_rpcs.sql
-- Description: 5 strict atomic state-machine RPCs for complex escrow transitions

-- Helper: Check admin status
CREATE OR REPLACE FUNCTION public.check_is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. open_dispute
CREATE OR REPLACE FUNCTION public.open_dispute(p_payment_id UUID, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_caller_id UUID;
  v_task public.tasks%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller_id AND account_status = 'active') THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  
  -- Explicitly reject terminal states
  IF v_payment.status IN ('released', 'refund_completed', 'cancellation_completed', 'failed') THEN
    RAISE EXCEPTION 'Payment is in a terminal state: %', v_payment.status;
  END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_payment.task_id;

  IF v_task.client_id != v_caller_id AND v_task.freelancer_id != v_caller_id THEN
    RAISE EXCEPTION 'Not authorized: must be payer or payee';
  END IF;

  IF v_payment.status NOT IN ('funded', 'held') THEN
    RAISE EXCEPTION 'Invalid state transition from % to disputed', v_payment.status;
  END IF;

  UPDATE public.payments SET status = 'disputed', updated_at = now() WHERE id = p_payment_id;

  INSERT INTO public.escrow_audit_logs (payment_id, actor_id, action, metadata)
  VALUES (p_payment_id, v_caller_id, 'open_dispute', jsonb_build_object('reason', p_reason, 'previous_status', v_payment.status));

  INSERT INTO public.analytics_events (event_name, user_id, properties, occurred_at)
  VALUES ('escrow_disputed', v_caller_id, jsonb_build_object('payment_id', p_payment_id, 'escrow_id', v_payment.escrow_id), now());

  -- Notifications
  INSERT INTO public.notifications (user_id, title, message, type, payload)
  VALUES 
    (v_task.client_id, 'Dispute Opened', 'A dispute was opened for task ' || v_task.title, 'dispute_opened', jsonb_build_object('dedupe_key', 'dispute_opened_business:' || p_payment_id, 'payment_id', p_payment_id)),
    (v_task.freelancer_id, 'Dispute Opened', 'A dispute was opened for task ' || v_task.title, 'dispute_opened', jsonb_build_object('dedupe_key', 'dispute_opened_freelancer:' || p_payment_id, 'payment_id', p_payment_id));
END;
$$;


-- 2. request_refund
CREATE OR REPLACE FUNCTION public.request_refund(p_payment_id UUID, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_caller_id UUID;
  v_task public.tasks%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;

  -- Explicitly reject terminal states
  IF v_payment.status IN ('released', 'refund_completed', 'cancellation_completed', 'failed') THEN
    RAISE EXCEPTION 'Payment is in a terminal state: %', v_payment.status;
  END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_payment.task_id;

  IF v_task.client_id != v_caller_id THEN
    RAISE EXCEPTION 'Not authorized: only payer can request refund';
  END IF;

  IF v_payment.status NOT IN ('held', 'funded') THEN
    RAISE EXCEPTION 'Invalid state transition from % to refund_requested', v_payment.status;
  END IF;

  UPDATE public.payments SET status = 'refund_requested', updated_at = now() WHERE id = p_payment_id;

  INSERT INTO public.escrow_audit_logs (payment_id, actor_id, action, metadata)
  VALUES (p_payment_id, v_caller_id, 'request_refund', jsonb_build_object('reason', p_reason, 'previous_status', v_payment.status));

  INSERT INTO public.analytics_events (event_name, user_id, properties, occurred_at)
  VALUES ('refund_requested', v_caller_id, jsonb_build_object('payment_id', p_payment_id, 'escrow_id', v_payment.escrow_id), now());

  INSERT INTO public.notifications (user_id, title, message, type, payload)
  VALUES 
    (v_task.client_id, 'Refund Requested', 'A refund request was initiated for task ' || v_task.title, 'refund_requested', jsonb_build_object('dedupe_key', 'refund_requested_business:' || p_payment_id, 'payment_id', p_payment_id)),
    (v_task.freelancer_id, 'Refund Requested', 'The client requested a refund for task ' || v_task.title, 'refund_requested', jsonb_build_object('dedupe_key', 'refund_requested_freelancer:' || p_payment_id, 'payment_id', p_payment_id));
END;
$$;


-- 3. resolve_dispute
CREATE OR REPLACE FUNCTION public.resolve_dispute(p_payment_id UUID, p_outcome TEXT, p_resolution TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_caller_id UUID;
  v_task public.tasks%ROWTYPE;
  v_new_status public.payment_status;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT public.check_is_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Not authorized: admins only';
  END IF;

  IF p_outcome NOT IN ('release', 'refund') THEN
    RAISE EXCEPTION 'Invalid outcome. Must be release or refund.';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;

  -- Explicitly reject terminal states
  IF v_payment.status IN ('released', 'refund_completed', 'cancellation_completed', 'failed') THEN
    RAISE EXCEPTION 'Payment is in a terminal state: %', v_payment.status;
  END IF;

  IF v_payment.status != 'disputed' THEN
    RAISE EXCEPTION 'Invalid state: payment is not disputed (current: %)', v_payment.status;
  END IF;

  IF p_outcome = 'release' THEN
    v_new_status := 'released';
  ELSE
    v_new_status := 'refund_completed';
  END IF;

  UPDATE public.payments SET status = v_new_status, updated_at = now() WHERE id = p_payment_id;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_payment.task_id;

  INSERT INTO public.escrow_audit_logs (payment_id, actor_id, action, metadata)
  VALUES (p_payment_id, v_caller_id, 'resolve_dispute', jsonb_build_object('resolution', p_resolution, 'outcome', p_outcome, 'previous_status', v_payment.status));

  INSERT INTO public.analytics_events (event_name, user_id, properties, occurred_at)
  VALUES ('escrow_resolved', v_caller_id, jsonb_build_object('payment_id', p_payment_id, 'outcome', p_outcome), now());

  -- Notify parties
  INSERT INTO public.notifications (user_id, title, message, type, payload)
  VALUES 
    (v_task.client_id, 'Dispute Resolved', 'The dispute for task ' || v_task.title || ' was resolved: ' || p_outcome, 'dispute_resolved', jsonb_build_object('dedupe_key', 'dispute_resolved_business:' || p_payment_id, 'payment_id', p_payment_id)),
    (v_task.freelancer_id, 'Dispute Resolved', 'The dispute for task ' || v_task.title || ' was resolved: ' || p_outcome, 'dispute_resolved', jsonb_build_object('dedupe_key', 'dispute_resolved_freelancer:' || p_payment_id, 'payment_id', p_payment_id));
END;
$$;


-- 4. mark_refund_completed
CREATE OR REPLACE FUNCTION public.mark_refund_completed(p_payment_id UUID, p_note TEXT DEFAULT null)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_caller_id UUID;
  v_task public.tasks%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT public.check_is_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Not authorized: admins only';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;

  IF v_payment.status IN ('released', 'refund_completed', 'cancellation_completed', 'failed') THEN
    RAISE EXCEPTION 'Payment is in a terminal state: %', v_payment.status;
  END IF;

  IF v_payment.status NOT IN ('refund_requested', 'disputed') THEN
    RAISE EXCEPTION 'Invalid state transition from % to refund_completed', v_payment.status;
  END IF;

  UPDATE public.payments SET status = 'refund_completed', updated_at = now() WHERE id = p_payment_id;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_payment.task_id;

  INSERT INTO public.escrow_audit_logs (payment_id, actor_id, action, metadata)
  VALUES (p_payment_id, v_caller_id, 'mark_refund_completed', jsonb_build_object('note', p_note, 'previous_status', v_payment.status));

  INSERT INTO public.analytics_events (event_name, user_id, properties, occurred_at)
  VALUES ('escrow_refunded', v_caller_id, jsonb_build_object('payment_id', p_payment_id, 'escrow_id', v_payment.escrow_id), now());

  INSERT INTO public.notifications (user_id, title, message, type, payload)
  VALUES 
    (v_task.client_id, 'Refund Issued', 'The refund for task ' || v_task.title || ' has been completed.', 'refund_issued', jsonb_build_object('dedupe_key', 'refund_issued_business:' || p_payment_id, 'payment_id', p_payment_id)),
    (v_task.freelancer_id, 'Refund Issued', 'The refund for task ' || v_task.title || ' has been completed to the client.', 'refund_issued', jsonb_build_object('dedupe_key', 'refund_issued_freelancer:' || p_payment_id, 'payment_id', p_payment_id));
END;
$$;


-- 5. cancel_escrow
CREATE OR REPLACE FUNCTION public.cancel_escrow(p_payment_id UUID, p_reason TEXT DEFAULT null)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_caller_id UUID;
  v_task public.tasks%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;

  IF v_payment.status IN ('released', 'refund_completed', 'cancellation_completed', 'failed') THEN
    RAISE EXCEPTION 'Payment is in a terminal state: %', v_payment.status;
  END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = v_payment.task_id;

  IF v_task.client_id != v_caller_id THEN
    RAISE EXCEPTION 'Not authorized: only payer can cancel escrow';
  END IF;

  IF v_payment.status != 'pending' THEN
    RAISE EXCEPTION 'Invalid state transition from % to cancellation_completed', v_payment.status;
  END IF;

  UPDATE public.payments SET status = 'cancellation_completed', updated_at = now() WHERE id = p_payment_id;

  INSERT INTO public.escrow_audit_logs (payment_id, actor_id, action, metadata)
  VALUES (p_payment_id, v_caller_id, 'cancel_escrow', jsonb_build_object('reason', p_reason, 'previous_status', v_payment.status));

  INSERT INTO public.analytics_events (event_name, user_id, properties, occurred_at)
  VALUES ('escrow_cancelled', v_caller_id, jsonb_build_object('payment_id', p_payment_id, 'escrow_id', v_payment.escrow_id), now());

  INSERT INTO public.notifications (user_id, title, message, type, payload)
  VALUES 
    (v_task.client_id, 'Escrow Cancelled', 'The escrow initialization for task ' || v_task.title || ' was cancelled.', 'cancellation_confirmed', jsonb_build_object('dedupe_key', 'cancellation_confirmed_business:' || p_payment_id, 'payment_id', p_payment_id));
    -- freelancer may not need a notification here because the assignment likely falls through anyway, 
    -- but if freelancer_id is somehow set, we can notify.
  IF v_task.freelancer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, payload)
    VALUES (v_task.freelancer_id, 'Escrow Cancelled', 'The escrow initialization for task ' || v_task.title || ' was cancelled by the client.', 'cancellation_confirmed', jsonb_build_object('dedupe_key', 'cancellation_confirmed_freelancer:' || p_payment_id, 'payment_id', p_payment_id));
  END IF;
END;
$$;
