-- =============================================================================
-- Migration 0001 — Initial Schema
-- Project: Namso (ai-task-connect)
-- Date: 2026-03-22
-- =============================================================================
-- Creates all enums and all 12 tables.
-- Run this first, before any triggers, functions, or RLS policies.
-- Safe to re-run: all statements use IF NOT EXISTS.
-- =============================================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('business', 'freelancer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active', 'frozen', 'suspended', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM (
    'open', 'in_progress', 'completed', 'cancelled', 'draft', 'revision_requested'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.assignment_status AS ENUM (
    'unassigned', 'pending_acceptance', 'accepted', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending', 'funded', 'released', 'refunded', 'failed',
    'held', 'disputed', 'awaiting_escrow', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.escrow_status AS ENUM (
    'pending', 'created', 'funded', 'holding', 'released',
    'cancelled', 'refunded', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Table: profiles ───────────────────────────────────────────────────────────
-- Central identity table. id = auth.users.id.
-- Auto-populated by the handle_new_user() trigger (see migration 0002).

CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name      TEXT,
  email          TEXT,
  role           public.user_role NOT NULL DEFAULT 'business',
  username       TEXT,
  bio            TEXT,
  tools          TEXT,
  account_status public.account_status DEFAULT 'active',
  -- Used by resend-activation edge fn to detect if invited user has set a password.
  password_set   BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE  public.profiles IS 'One row per auth user. id = auth.uid().';
COMMENT ON COLUMN public.profiles.password_set IS 'Set to TRUE after the invited freelancer completes signup and sets their password. Used by resend-activation edge fn.';

-- ── Table: user_roles ─────────────────────────────────────────────────────────
-- Stores the same role as profiles.role but in a normalized form.
-- Some edge functions (approve-freelancer, send-contact-email) query this table
-- for admin checks. Must stay in sync with profiles.role.

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role    public.user_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'Normalized role lookup used by edge functions. Must stay in sync with profiles.role.';

-- ── Table: tasks ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id                UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ             NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ             NOT NULL DEFAULT now(),
  title             TEXT                    NOT NULL,
  description       TEXT                    NOT NULL,
  category          TEXT                    NOT NULL,
  budget            NUMERIC(12, 2)          NOT NULL CHECK (budget >= 0),
  deadline          DATE,
  tools             TEXT,
  status            public.task_status      NOT NULL DEFAULT 'open',
  assignment_status public.assignment_status NOT NULL DEFAULT 'unassigned',
  client_id         UUID                    NOT NULL REFERENCES public.profiles(id),
  freelancer_id     UUID                    REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ── Table: payments ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
  id            UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ             NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ             NOT NULL DEFAULT now(),
  task_id       UUID                    NOT NULL REFERENCES public.tasks(id),
  payer_id      UUID                    NOT NULL REFERENCES public.profiles(id),
  payee_id      UUID                    NOT NULL REFERENCES public.profiles(id),
  amount        NUMERIC(12, 2)          NOT NULL CHECK (amount >= 0),
  currency      TEXT                    NOT NULL DEFAULT 'EUR',
  status        public.payment_status   NOT NULL DEFAULT 'pending',
  escrow_id     TEXT,                   -- Escrow.com transaction ID (string, not UUID)
  escrow_status public.escrow_status    NOT NULL DEFAULT 'pending'
);

COMMENT ON COLUMN public.payments.escrow_id IS 'Escrow.com transaction ID. Set by escrow-create edge fn. Used to correlate webhook updates.';

-- ── Table: escrow_audit_logs ──────────────────────────────────────────────────
-- Immutable audit trail for every payment state transition attempted via webhook.

CREATE TABLE IF NOT EXISTS public.escrow_audit_logs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_id       TEXT        NOT NULL,   -- Escrow.com transaction ID
  payment_id           UUID        REFERENCES public.payments(id),
  old_status           TEXT        NOT NULL,
  requested_new_status TEXT        NOT NULL,
  accepted             BOOLEAN     NOT NULL,   -- Whether the transition was applied
  reason               TEXT        NOT NULL    -- Human-readable audit reason
);

-- ── Table: messages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender_id   UUID        NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID        NOT NULL REFERENCES public.profiles(id),
  task_id     UUID        REFERENCES public.tasks(id) ON DELETE SET NULL,
  content     TEXT        NOT NULL,
  read_at     TIMESTAMPTZ
);

-- ── Table: notifications ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL,
  link       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ── Table: freelancer_applications ───────────────────────────────────────────
-- Stores freelancer signup applications submitted via /signup/freelancer.
-- NOTE: legacy edge functions may reference this as "student_applications" —
-- those edge functions contain bugs that are fixed in migration 0003.

CREATE TABLE IF NOT EXISTS public.freelancer_applications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID        REFERENCES public.profiles(id),  -- admin who approved/rejected
  first_name  TEXT        NOT NULL,
  last_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  university  TEXT        NOT NULL,
  major       TEXT        NOT NULL,
  tools       TEXT,
  bio         TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- ── Table: contact_messages ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  archived   BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ── Table: strategy_calls ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.strategy_calls (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  call_type    TEXT        NOT NULL,
  full_name    TEXT        NOT NULL,
  company_name TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  website      TEXT,
  budget       TEXT        NOT NULL,
  timeline     TEXT        NOT NULL,
  description  TEXT        NOT NULL
);

-- ── Table: task_submissions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.task_submissions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  task_id       UUID        NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  freelancer_id UUID        NOT NULL REFERENCES public.profiles(id),
  message       TEXT        NOT NULL,
  file_url      TEXT        -- Supabase Storage URL for uploaded delivery file
);

-- ── Table: reviews ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reviews (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  task_id       UUID        NOT NULL REFERENCES public.tasks(id),
  freelancer_id UUID        NOT NULL REFERENCES public.profiles(id),
  client_id     UUID        REFERENCES public.profiles(id),
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT
);
