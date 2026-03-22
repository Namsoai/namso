-- Migration to support internal Operator Notes securely

CREATE OR REPLACE FUNCTION public.add_operator_note(
  p_payment_id UUID,
  p_note TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_check BOOLEAN;
BEGIN
  -- 1. Ensure caller is an admin
  SELECT is_admin INTO v_admin_check
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_admin_check IS NOT TRUE THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can add operator notes';
  END IF;

  -- 2. Insert into audit logs
  INSERT INTO public.escrow_audit_logs (
    payment_id,
    action,
    actor_id,
    metadata
  )
  VALUES (
    p_payment_id,
    'operator_note',
    auth.uid(),
    jsonb_build_object('note', p_note)
  );

END;
$$;
