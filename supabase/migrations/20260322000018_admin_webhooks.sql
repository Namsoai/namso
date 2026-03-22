-- =============================================================================
-- Migration 0018 — Admin Event Triggers & Unified Webhook Router
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================

-- 1. Enable the official pg_net extension to cleanly handle async HTTP requests natively
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. The Unified Delivery Webhook Dispatcher
-- Automatically hits process-notifications whenever a 'pending' delivery is requested natively.
CREATE OR REPLACE FUNCTION public.trigger_email_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- We ping the Edge Gateway autonomously without blocking the parent Postgres transaction
  PERFORM net.http_post(
    url := 'https://xbqslsxaskrdxgoxtjoh.supabase.co/functions/v1/process-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('deliveryId', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map the Webhook solely to pending insertions
CREATE TRIGGER on_pending_delivery_webhook
  AFTER INSERT ON public.notification_deliveries
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.trigger_email_delivery();


-- =============================================================================
-- 3. Admin Notification Triggers (Database Originated)
-- =============================================================================

-- Freelancer Application Received Alert
CREATE OR REPLACE FUNCTION public.notify_admins_new_application()
RETURNS TRIGGER AS $$
DECLARE
  admin_rec RECORD;
  new_notif_id UUID;
BEGIN
  -- Loop over fully active admins
  FOR admin_rec IN 
    SELECT p.id 
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.account_status = 'active'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, payload)
    VALUES (
      admin_rec.id, 
      'freelancer_app_received', 
      'New Freelancer Application', 
      'A new freelancer application has just been submitted by ' || NEW.first_name || ' ' || NEW.last_name || '.', 
      '/admin/freelancers',
      jsonb_build_object('application_id', NEW.id, 'freelancer_name', NEW.first_name || ' ' || NEW.last_name, 'email', NEW.email)
    ) RETURNING id INTO new_notif_id;
    
    INSERT INTO public.notification_deliveries (notification_id, channel, status)
    VALUES (new_notif_id, 'email', 'pending');
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_freelancer_app
  AFTER INSERT ON public.freelancer_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_application();


-- Generic Contact Form Security Alert
CREATE OR REPLACE FUNCTION public.notify_admins_contact_message()
RETURNS TRIGGER AS $$
DECLARE
  admin_rec RECORD;
  new_notif_id UUID;
BEGIN
  FOR admin_rec IN 
    SELECT p.id 
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE ur.role = 'admin' AND p.account_status = 'active'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, payload)
    VALUES (
      admin_rec.id, 
      'new_contact_message', 
      'New Contact Inquiry', 
      'You received a new contact inquiry from ' || NEW.name || '.', 
      '/admin/inquiries',
      jsonb_build_object('inquiry_id', NEW.id, 'sender_name', NEW.name, 'email', NEW.email)
    ) RETURNING id INTO new_notif_id;
    
    INSERT INTO public.notification_deliveries (notification_id, channel, status)
    VALUES (new_notif_id, 'email', 'pending');
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_contact_message
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_contact_message();
