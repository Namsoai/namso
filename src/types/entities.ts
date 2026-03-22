/**
 * Shared entity interfaces for tables that are used throughout the codebase
 * but are not (yet) code-generated in src/integrations/supabase/types.ts.
 *
 * These types are derived from actual query shapes and insert payloads found
 * in the source code.  Keep them in sync with any schema migrations.
 */

// ── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "work_submitted"
  | "task_assigned"
  | "task_completed"
  | "revision_requested"
  | string; // allow future types without compile errors

export interface Notification {
  id: string;
  user_id: string;        // FK → profiles.id
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read?: boolean;
}

// ── TaskSubmission ────────────────────────────────────────────────────────────

export interface TaskSubmission {
  id: string;
  task_id: string;        // FK → tasks.id
  freelancer_id: string;  // FK → profiles.id
  message: string;
  file_url: string | null;
  created_at: string;
}

export interface TaskSubmissionInsert {
  task_id: string;
  freelancer_id: string;
  message: string;
  file_url?: string | null;
}

// ── Review ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  task_id: string;        // FK → tasks.id
  freelancer_id: string;  // FK → profiles.id
  client_id: string;      // FK → profiles.id
  rating: number;         // 1–5
  comment: string | null;
  created_at: string;
}

export interface ReviewInsert {
  task_id: string;
  freelancer_id: string;
  client_id: string;
  rating: number;
  comment?: string | null;
}

// ── UserRole ──────────────────────────────────────────────────────────────────

export type AppRole = "business" | "freelancer" | "admin";

export interface UserRole {
  user_id: string;        // FK → profiles.id
  role: AppRole;
}

export interface UserRoleInsert {
  user_id: string;
  role: AppRole;
}

// ── ContactMessage ────────────────────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  archived: boolean;
  created_at: string;
}

export interface ContactMessageInsert {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ── StrategyCall ──────────────────────────────────────────────────────────────

export type CallType = "strategy" | "task_identifier";

export type BudgetRange = "under_1k" | "1k_to_5k" | "5k_to_15k" | "over_15k";

export type Timeline =
  | "asap"
  | "within_1_month"
  | "1_to_3_months"
  | "exploring";

export interface StrategyCall {
  id: string;
  call_type: CallType;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  website: string | null;
  budget: BudgetRange;
  timeline: Timeline;
  description: string;
  created_at: string;
}

export interface StrategyCallInsert {
  call_type: CallType;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  website?: string | null;
  budget: BudgetRange;
  timeline: Timeline;
  description: string;
}

// ── Profile (extended beyond generated type) ──────────────────────────────────

export type AccountStatus = "active" | "frozen" | "suspended" | "revoked";

/**
 * Extended profile fields not yet reflected in the generated Supabase types.
 * Use alongside `Database["public"]["Tables"]["profiles"]["Row"]`.
 */
export interface ProfileExtended {
  id: string;             // auth UID — canonical identity field
  created_at: string;
  updated_at: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  username: string | null;   // headline / display name for freelancers
  bio: string | null;        // freelancer bio
  tools: string | null;      // freelancer tools list
  account_status: AccountStatus; // admin-managed account state
}

// ── FreelancerApplication ────────────────────────────────────────────────────

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface FreelancerApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  university: string;
  major: string;
  tools: string | null;
  bio: string | null;
  status: ApplicationStatus;
  reviewed_at: string | null;
  created_at: string;
}
