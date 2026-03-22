-- =============================================================================
-- Migration 0003 — is_admin() Function + Enable RLS + All Policies
-- Project: Namso (ai-task-connect)
-- Date: 2026-03-22
-- =============================================================================
-- IMPORTANT: Run AFTER migration 0001 (tables must exist).
-- This file:
--   1. Creates is_admin() helper function used in every RLS policy
--   2. Enables RLS on all 12 tables
--   3. Creates all access control policies with explanatory comments
-- =============================================================================

-- ── 1. is_admin() — shared RLS helper ─────────────────────────────────────────
-- Reads profiles.role for the current JWT user.
-- STABLE means Postgres can cache the result within a single query.
-- SECURITY DEFINER allows the function to bypass RLS when reading profiles.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current JWT user has role=admin in profiles. Used in RLS policies.';

-- ── 2. Enable RLS on all tables ────────────────────────────────────────────────
-- Supabase requires explicit ALTER TABLE ... ENABLE ROW LEVEL SECURITY.
-- After enabling, access defaults to DENY ALL until policies are added.

ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_calls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;

-- ── 3. RLS Policies ────────────────────────────────────────────────────────────

-- ─── profiles ──────────────────────────────────────────────────────────────────
-- Why: AuthContext reads the profile of the logged-in user. Admins need full
--      visibility to manage users. Users can update their own bio/tools/username.

CREATE POLICY "profiles: user can view own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins need to list all profiles for AdminFreelancers, AdminBusinesses pages
CREATE POLICY "profiles: admins can view all"
  ON public.profiles FOR SELECT
  USING (is_admin());

-- Required for SettingsForm.tsx (profile updates) and approve-freelancer (account_status)
CREATE POLICY "profiles: user can update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins manage account_status (freeze, suspend, revoke) via AdminFreelancers/AdminBusinesses
CREATE POLICY "profiles: admins can update any"
  ON public.profiles FOR UPDATE
  USING (is_admin());

-- ─── user_roles ────────────────────────────────────────────────────────────────
-- Why: approve-freelancer and send-contact-email edge fns query user_roles
--      using the service role key, which bypasses RLS. For client-side reads:
--      users may need to read their own role for display.

CREATE POLICY "user_roles: user can view own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_roles: admins can view all"
  ON public.user_roles FOR SELECT
  USING (is_admin());

-- Admins can assign roles (AdminAdmins page)
CREATE POLICY "user_roles: admins can insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "user_roles: admins can delete"
  ON public.user_roles FOR DELETE
  USING (is_admin());

-- ─── tasks ─────────────────────────────────────────────────────────────────────
-- Why:
--   - BusinessMyTasks, BusinessOverview, BusinessTaskDetail: business reads own tasks
--   - FreelancerAvailableTasks: freelancer reads open tasks (no auth required on that column)
--   - FreelancerActiveWork, FreelancerTaskDetail: freelancer reads tasks assigned to them
--   - AdminTasks: admin reads all tasks
--   - Mutations: business creates/updates own tasks; freelancer updates assignment_status only

CREATE POLICY "tasks: business can view own"
  ON public.tasks FOR SELECT
  USING (auth.uid() = client_id);

-- Freelancers see open tasks + tasks assigned to them
CREATE POLICY "tasks: freelancers can view open or assigned"
  ON public.tasks FOR SELECT
  USING (status = 'open' OR auth.uid() = freelancer_id);

CREATE POLICY "tasks: admins can view all"
  ON public.tasks FOR SELECT
  USING (is_admin());

CREATE POLICY "tasks: business can insert"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "tasks: business can update own"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Freelancer updates assignment_status to 'accepted'/'rejected' on their assigned task
CREATE POLICY "tasks: freelancer can update assigned"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "tasks: admins can update any"
  ON public.tasks FOR UPDATE
  USING (is_admin());

-- ─── payments ──────────────────────────────────────────────────────────────────
-- Why: Payments are written by edge functions using the service role key (bypasses RLS).
--      Clients only need to read their own. Admins view all for AdminPayments page.
-- NOTE: No INSERT policy for clients — payments are created server-side only.

CREATE POLICY "payments: payer or payee can view own"
  ON public.payments FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() = payee_id);

CREATE POLICY "payments: admins can view all"
  ON public.payments FOR SELECT
  USING (is_admin());

-- ─── escrow_audit_logs ─────────────────────────────────────────────────────────
-- Why: Written exclusively by escrow-webhook edge fn via service role.
--      No public SELECT needed — admins only for audit trail review.

CREATE POLICY "escrow_audit_logs: admins can view"
  ON public.escrow_audit_logs FOR SELECT
  USING (is_admin());

-- ─── messages ──────────────────────────────────────────────────────────────────
-- Why: MessageList.tsx and useTasks.useMessages() filter by sender_id OR receiver_id.
--      Users must only see and send messages they are a party to.

CREATE POLICY "messages: participants can view"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages: users can send"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Mark messages as read (sets read_at)
CREATE POLICY "messages: receiver can update"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "messages: admins can view all"
  ON public.messages FOR SELECT
  USING (is_admin());

-- ─── notifications ─────────────────────────────────────────────────────────────
-- Why: NotificationBell.tsx and useNotifications() read per-user notifications.
--      Notifications are written server-side (edge fns) via service role key.

CREATE POLICY "notifications: user can view own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Mark as read from NotificationBell
CREATE POLICY "notifications: user can mark read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── freelancer_applications ──────────────────────────────────────────────────
-- Why: FreelancerSignup.tsx POSTs to this table (public insert).
--       AdminApplications.tsx reads and updates (admins only).

-- Anyone can submit — no auth required for the signup form
CREATE POLICY "freelancer_applications: public can insert"
  ON public.freelancer_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "freelancer_applications: admins can view all"
  ON public.freelancer_applications FOR SELECT
  USING (is_admin());

CREATE POLICY "freelancer_applications: admins can update"
  ON public.freelancer_applications FOR UPDATE
  USING (is_admin());

-- ─── contact_messages ─────────────────────────────────────────────────────────
-- Why: Contact.tsx POSTs here (public insert). AdminMessages.tsx reads all (admin only).

CREATE POLICY "contact_messages: public can insert"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact_messages: admins can view all"
  ON public.contact_messages FOR SELECT
  USING (is_admin());

CREATE POLICY "contact_messages: admins can update"
  ON public.contact_messages FOR UPDATE
  USING (is_admin());

-- ─── strategy_calls ────────────────────────────────────────────────────────────
-- Why: BookCall.tsx POSTs here (public insert). Admins view for follow-up.

CREATE POLICY "strategy_calls: public can insert"
  ON public.strategy_calls FOR INSERT
  WITH CHECK (true);

CREATE POLICY "strategy_calls: admins can view all"
  ON public.strategy_calls FOR SELECT
  USING (is_admin());

-- ─── task_submissions ─────────────────────────────────────────────────────────
-- Why: FreelancerActiveWork.tsx inserts submissions. BusinessTaskDetail.tsx
--      reads submissions for the task client. Admins can view all.

CREATE POLICY "task_submissions: freelancer can submit"
  ON public.task_submissions FOR INSERT
  WITH CHECK (auth.uid() = freelancer_id);

-- Business can view submissions for their tasks
CREATE POLICY "task_submissions: task owner can view"
  ON public.task_submissions FOR SELECT
  USING (
    auth.uid() = freelancer_id
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND t.client_id = auth.uid()
    )
  );

CREATE POLICY "task_submissions: admins can view all"
  ON public.task_submissions FOR SELECT
  USING (is_admin());

-- ─── reviews ──────────────────────────────────────────────────────────────────
-- Why: Business writes review after task completion. Freelancer profile shows rating.

CREATE POLICY "reviews: business can write"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Public read so freelancer profiles can show ratings
CREATE POLICY "reviews: public can read"
  ON public.reviews FOR SELECT
  USING (true);
