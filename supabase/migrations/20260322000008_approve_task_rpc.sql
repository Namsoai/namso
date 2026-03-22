-- ── Function: approve_task_work ───────────────────────────────────────────────
-- Approves a task submission and generates a pending payment record.
-- Returns the ID of the newly created payment, allowing the frontend to trigger 'escrow-create'.

CREATE OR REPLACE FUNCTION public.approve_task_work(p_task_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id UUID;
  v_freelancer_id UUID;
  v_budget NUMERIC;
  v_payment_id UUID;
BEGIN
  -- 1. Get task details & lock row
  SELECT client_id, freelancer_id, budget
  INTO v_client_id, v_freelancer_id, v_budget
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  -- 2. Verify caller is the client
  IF auth.uid() != v_client_id THEN
    RAISE EXCEPTION 'Unauthorized: Only the client can approve work';
  END IF;

  -- 3. Update task status
  UPDATE public.tasks
  SET status = 'completed',
      assignment_status = 'accepted',
      updated_at = now()
  WHERE id = p_task_id;

  -- 4. Create pending payment record
  INSERT INTO public.payments (task_id, payer_id, payee_id, amount, currency, status)
  VALUES (p_task_id, v_client_id, v_freelancer_id, v_budget, 'USD', 'pending')
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;
