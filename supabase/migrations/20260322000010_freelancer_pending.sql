-- ── Fix trigger to naturally initialize Freelancer accounts as 'pending' ──

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.user_role;
BEGIN
  -- Read role from user metadata if present, else default to 'business'
  BEGIN
    _role := (NEW.raw_user_meta_data ->> 'role')::public.user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    _role := 'business';
  END;

  IF _role IS NULL THEN
    _role := 'business';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    _role,
    CASE WHEN _role = 'freelancer' THEN 'pending' ELSE 'active' END
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also insert into user_roles for edge fn RBAC compatibility
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
