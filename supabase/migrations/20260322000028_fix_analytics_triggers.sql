-- Fix analytic trigger reference for tasks (business_id -> client_id)

CREATE OR REPLACE FUNCTION public.analytics_task_created_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.record_analytics_event(
    'task_created',
    NEW.client_id,
    jsonb_build_object(
      'task_id',    NEW.id,
      'task_title', NEW.title
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_task_assigned_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.freelancer_id IS NOT NULL AND OLD.freelancer_id IS NULL THEN
    PERFORM public.record_analytics_event(
      'task_assigned',
      NEW.freelancer_id,
      jsonb_build_object(
        'task_id',      NEW.id,
        'task_title',   NEW.title,
        'client_id',    NEW.client_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
