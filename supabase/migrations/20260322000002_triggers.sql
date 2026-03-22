-- =============================================================================
-- Migration 0002 — Triggers & Auto-functions
-- Project: Namso (ai-task-connect)
-- Date: 2026-03-22
-- =============================================================================
-- 1. handle_new_user()  → auto-creates a profiles row when a user signs up
-- 2. set_updated_at()   → keeps updated_at accurate on profiles, tasks, payments
-- =============================================================================

-- ── 1. Auto-create profile on auth.users INSERT ───────────────────────────────
-- Why: AuthContext.tsx calls supabase.from("profiles").select("*").eq("id", userId)
--      immediately after login/signup. If no profile row exists, everything breaks.
--
-- Role assignment:
--   - Business users: sign up via supabase.auth.signUp({ options: { data: { role: 'business' } } })
--   - Freelancers:    are invited via admin → their role default is 'freelancer'
--   - Fallback:       defaults to 'business' (least-privileged non-admin role)

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
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also insert into user_roles for edge fn RBAC compatibility
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to ensure it's on the correct table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Auto-update updated_at timestamp ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to tables that have updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. Keep user_roles in sync with profiles.role ─────────────────────────────
-- If an admin manually updates profiles.role, ensure user_roles doesn't drift.

CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the role is changing, delete old roles and insert the new one
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, NEW.role);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_role_trig ON public.profiles;
CREATE TRIGGER sync_profile_role_trig
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role();

