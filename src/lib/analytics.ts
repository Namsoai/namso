/**
 * analytics.ts — Lightweight fire-and-forget event tracker
 *
 * Design contract:
 *   - Frontend uses this for INTENT / UI funnel events
 *   - Backend (triggers + edge functions) owns TRUTH / state transition events
 *   - This function NEVER throws — analytics must never break product flows
 */

import { supabase } from "@/integrations/supabase/client";

type EventName =
  // Frontend funnel
  | "business_signup_started"
  | "business_signup_completed"
  | "freelancer_application_started"
  | "freelancer_application_submitted"
  // Backend truth (can be called from edge functions too)
  | "task_created"
  | "task_assigned"
  | "work_submitted"
  | "freelancer_approved"
  | "escrow_created"
  | "escrow_funded"
  | "escrow_released";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Track a front-end analytics event.
 * Always fire-and-forget — awaiting this is optional.
 */
export async function trackEvent(
  eventName: EventName,
  properties: EventProperties = {},
  userId?: string
): Promise<void> {
  try {
    await supabase.from("analytics_events").insert({
      event_name: eventName,
      user_id: userId ?? null,
      properties,
    });
  } catch {
    // Silently swallow — analytics must never block or throw in product code
  }
}
