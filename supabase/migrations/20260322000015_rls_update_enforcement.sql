-- =============================================================================
-- Migration 0015 — Enforce is_active() across all operational UPDATE policies
-- Project: Namso
-- Date: 2026-03-22
-- =============================================================================
-- The previous migrations covered INSERT policies, but frozen/suspended 
-- users must also be prohibited from taking operational actions via UPDATE.

-- 1. Optimize the is_active() helper per review feedback
CREATE OR REPLACE FUNCTION public.is_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND account_status = 'active'
  );
$$;

-- 2. Tasks: Business can update tasks only if active
DROP POLICY IF EXISTS "tasks: business can update own" ON public.tasks;
CREATE POLICY "tasks: business can update own"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = client_id AND is_active())
  WITH CHECK (auth.uid() = client_id AND is_active());

-- 3. Tasks: Freelancer can update assigned task status only if active
DROP POLICY IF EXISTS "tasks: freelancer can update assigned" ON public.tasks;
CREATE POLICY "tasks: freelancer can update assigned"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = freelancer_id AND is_active())
  WITH CHECK (auth.uid() = freelancer_id AND is_active());

-- 4. Messages: Receiver can mark as read only if active
DROP POLICY IF EXISTS "messages: receiver can update" ON public.messages;
CREATE POLICY "messages: receiver can update"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id AND is_active())
  WITH CHECK (auth.uid() = receiver_id AND is_active());

-- 5. Notifications: User can mark read only if active
DROP POLICY IF EXISTS "notifications: user can mark read" ON public.notifications;
CREATE POLICY "notifications: user can mark read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id AND is_active())
  WITH CHECK (auth.uid() = user_id AND is_active());

-- Note: We DO NOT enforce is_active() on "profiles: user can update own"
-- because frozen/suspended users might need to update their bio/tools 
-- to complete their profile before an admin approves them.
