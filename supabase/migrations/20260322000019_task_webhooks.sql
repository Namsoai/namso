-- =============================================================================
-- Migration 0019 — Task & Submission Operational Webhooks
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================

-- 1. Task Assigned to Freelancer (Task UPDATE trigger)
-- User strictly advised: trigger when `freelancer_id` changes from NULL to a user
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  new_notif_id UUID;
BEGIN
  IF OLD.freelancer_id IS NULL AND NEW.freelancer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, payload)
    VALUES (
      NEW.freelancer_id,
      'task_assigned',
      'You have been assigned a Task!',
      'The client has officially assigned you to the task: ' || NEW.title || '. Please review the assignment and accept it to begin.',
      '/freelancer/tasks/' || NEW.id,
      jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title, 'client_id', NEW.client_id)
    ) RETURNING id INTO new_notif_id;

    INSERT INTO public.notification_deliveries (notification_id, channel, status)
    VALUES (new_notif_id, 'email', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_assigned
  AFTER UPDATE OF freelancer_id ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();


-- 2. Freelancer Submitted Work (Task Submission INSERT trigger)
CREATE OR REPLACE FUNCTION public.notify_submission_received()
RETURNS TRIGGER AS $$
DECLARE
  task_rec RECORD;
  new_notif_id UUID;
BEGIN
  -- Obtain the task to identify the business owner
  SELECT client_id, title INTO task_rec FROM public.tasks WHERE id = NEW.task_id;
  
  IF FOUND THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, payload)
    VALUES (
      task_rec.client_id,
      'work_submitted',
      'Task Work Submitted',
      'A freelancer has submitted deliverables for your task: ' || task_rec.title || '. Please review the work.',
      '/business/tasks/' || NEW.task_id,
      jsonb_build_object('task_id', NEW.task_id, 'task_title', task_rec.title, 'freelancer_id', NEW.freelancer_id)
    ) RETURNING id INTO new_notif_id;

    INSERT INTO public.notification_deliveries (notification_id, channel, status)
    VALUES (new_notif_id, 'email', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_work_submitted
  AFTER INSERT ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_received();


-- 3. Business Approved Submission (Task UPDATE status trigger)
-- User advised: Trigger when status transitions to 'completed'
CREATE OR REPLACE FUNCTION public.notify_submission_approved()
RETURNS TRIGGER AS $$
DECLARE
  new_notif_id UUID;
BEGIN
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Only dispatch if a freelancer is actually attached
    IF NEW.freelancer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, payload)
      VALUES (
        NEW.freelancer_id,
        'submission_approved',
        'Submission Approved!',
        'The client has formally approved your work for the task: ' || NEW.title || '. Your Escrow payment will be natively released momentarily.',
        '/freelancer/tasks/' || NEW.id,
        jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
      ) RETURNING id INTO new_notif_id;

      INSERT INTO public.notification_deliveries (notification_id, channel, status)
      VALUES (new_notif_id, 'email', 'pending');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_submission_approved
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_approved();
