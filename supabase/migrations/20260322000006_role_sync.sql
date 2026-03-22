-- ── 1. Keep user_roles in sync with profiles.role ─────────────────────────────
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
