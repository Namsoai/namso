-- =============================================================================
-- Migration 0013 — Enforce account_status = active in RLS
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================
-- The previous RLS policies verified identity but not 'account_status'.
-- A 'frozen' freelancer or suspended business technically could still INSERT 
-- tasks or submissions. We create an is_active() helper and patch the policies.

CREATE OR REPLACE FUNCTION public.is_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND account_status = 'active'
  );
$$;

COMMENT ON FUNCTION public.is_active() IS 'Returns true if the current JWT user has account_status=active in profiles. Used in RLS policies to sandbox frozen/suspended users.';

-- 1. Tasks: Only active businesses can insert tasks
DROP POLICY IF EXISTS "tasks: business can insert" ON public.tasks;
CREATE POLICY "tasks: business can insert"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = client_id AND is_active());

-- 2. Task Submissions: Only active freelancers can submit work
DROP POLICY IF EXISTS "task_submissions: freelancer can submit" ON public.task_submissions;
CREATE POLICY "task_submissions: freelancer can submit"
  ON public.task_submissions FOR INSERT
  WITH CHECK (auth.uid() = freelancer_id AND is_active());

-- 3. Payments: Only active businesses can initialize payments (Escrow prep)
-- This overrides the policy we added in migration 000009
DROP POLICY IF EXISTS "payments: clients can insert pending" ON public.payments;
CREATE POLICY "payments: clients can insert pending"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = payer_id AND status = 'pending' AND is_active());

-- 4. Messages: Only active users can send messages
DROP POLICY IF EXISTS "messages: users can send" ON public.messages;
CREATE POLICY "messages: users can send"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND is_active());

-- 5. Reviews: Only active users can write reviews
DROP POLICY IF EXISTS "reviews: business can write" ON public.reviews;
CREATE POLICY "reviews: business can write"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = client_id AND is_active());

-- Note: freelancer_applications MUST intentionally allow frozen (unapproved) users to insert!
-- So we DO NOT add an is_active() check there.
