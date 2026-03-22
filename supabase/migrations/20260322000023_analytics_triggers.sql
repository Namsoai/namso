-- =============================================================================
-- Migration 0023 — Analytics Backend Truth Event Triggers
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================
-- These triggers record authoritative state-transition events.
-- They run AFTER successful DB writes and are strictly additive.
-- Failure to insert an analytics event must never affect the main operation.

-- Helper: safely insert an analytics event (silences any insert failures)
CREATE OR REPLACE FUNCTION public.record_analytics_event(
  p_event_name TEXT,
  p_user_id    UUID,
  p_properties JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.analytics_events (event_name, user_id, properties)
  VALUES (p_event_name, p_user_id, p_properties);
EXCEPTION WHEN OTHERS THEN
  -- Never let analytics errors surface to the caller
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── Task Created ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.analytics_on_task_created()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_analytics_task_created
  AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.analytics_on_task_created();


-- ─── Task Assigned ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.analytics_on_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when freelancer_id transitions from NULL to a real value
  IF OLD.freelancer_id IS NULL AND NEW.freelancer_id IS NOT NULL THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_analytics_task_assigned
  AFTER UPDATE OF freelancer_id ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.analytics_on_task_assigned();


-- ─── Work Submitted ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.analytics_on_work_submitted()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.record_analytics_event(
    'work_submitted',
    NEW.freelancer_id,
    jsonb_build_object(
      'task_id',       NEW.task_id,
      'submission_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_analytics_work_submitted
  AFTER INSERT ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.analytics_on_work_submitted();
