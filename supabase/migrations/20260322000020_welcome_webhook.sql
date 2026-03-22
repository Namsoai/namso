-- =============================================================================
-- Migration 0020 — Business Welcome Notification Trigger
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_business_welcome()
RETURNS TRIGGER AS $$
DECLARE
  new_notif_id UUID;
BEGIN
  -- We specifically target Business signups
  IF NEW.role = 'business' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, payload)
    VALUES (
      NEW.id,
      'welcome_business',
      'Welcome to Namso!',
      'Your business account is fully active. You can now post your first task to the marketplace safely.',
      '/business/tasks',
      jsonb_build_object('business_name', NEW.full_name, 'email', NEW.email)
    ) RETURNING id INTO new_notif_id;

    INSERT INTO public.notification_deliveries (notification_id, channel, status)
    VALUES (new_notif_id, 'email', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_business_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_business_welcome();
