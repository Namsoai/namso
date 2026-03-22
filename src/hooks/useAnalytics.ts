/**
 * useAnalytics — Admin-only analytics data hook
 *
 * Queries analytics_events via the typed Supabase client.
 * Uses service role access inherited from the admin user session.
 * All aggregation is done client-side from a single bulk fetch per time range.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TimeRange = "7d" | "30d" | "all";

export type EventName =
  | "business_signup_started"
  | "business_signup_completed"
  | "freelancer_application_started"
  | "freelancer_application_submitted"
  | "freelancer_approved"
  | "task_created"
  | "task_assigned"
  | "work_submitted"
  | "escrow_created"
  | "escrow_funded"
  | "escrow_released";

export interface EventCounts {
  business_signup_started: number;
  business_signup_completed: number;
  freelancer_application_started: number;
  freelancer_application_submitted: number;
  freelancer_approved: number;
  task_created: number;
  task_assigned: number;
  work_submitted: number;
  escrow_created: number;
  escrow_funded: number;
  escrow_released: number;
}

export interface FunnelStep {
  name: string;
  event: EventName;
  count: number;
  rate: number | null; // conversion rate from previous step (0–100)
}

export type DailyBucket = { date: string; counts: Partial<Record<EventName, number>> };

export interface AnalyticsData {
  counts: EventCounts;
  businessFunnel: FunnelStep[];
  freelancerFunnel: FunnelStep[];
  deliveryFunnel: FunnelStep[];
  dailyBuckets: DailyBucket[];
}

function makeTimestamp(range: TimeRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildCounts(rows: { event_name: string }[]): EventCounts {
  const zero: EventCounts = {
    business_signup_started: 0,
    business_signup_completed: 0,
    freelancer_application_started: 0,
    freelancer_application_submitted: 0,
    freelancer_approved: 0,
    task_created: 0,
    task_assigned: 0,
    work_submitted: 0,
    escrow_created: 0,
    escrow_funded: 0,
    escrow_released: 0,
  };
  for (const row of rows) {
    if (row.event_name in zero) {
      ((zero as unknown) as Record<string, number>)[row.event_name]++;
    }
  }
  return zero;
}

function buildFunnel(steps: Array<{ name: string; event: EventName }>, counts: EventCounts): FunnelStep[] {
  return steps.map((step, i) => {
    const count = counts[step.event];
    const prevCount = i === 0 ? null : counts[steps[i - 1].event];
    const rate = prevCount == null || prevCount === 0 ? null : Math.round((count / prevCount) * 100);
    return { ...step, count, rate };
  });
}

function buildDailyBuckets(rows: { event_name: string; occurred_at: string }[], daysBack: number): DailyBucket[] {
  const map = new Map<string, Partial<Record<EventName, number>>>();
  const now = new Date();

  // Pre-fill empty days so chart has continuous axis
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), {});
  }

  for (const row of rows) {
    const date = row.occurred_at.slice(0, 10);
    if (!map.has(date)) continue;
    const bucket = map.get(date)!;
    const key = row.event_name as EventName;
    bucket[key] = (bucket[key] ?? 0) + 1;
  }

  return Array.from(map.entries()).map(([date, counts]) => ({ date, counts }));
}

export function useAnalytics(range: TimeRange) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const since = makeTimestamp(range);

      let q = supabase
        .from("analytics_events")
        .select("event_name, occurred_at");

      if (since) q = q.gte("occurred_at", since);
      q = q.order("occurred_at", { ascending: true });

      const { data, error } = await q;
      if (error) throw error;

      const rows: { event_name: string; occurred_at: string }[] = data ?? [];
      const counts = buildCounts(rows);
      const daysBack = range === "7d" ? 7 : range === "30d" ? 30 : 90;

      return {
        counts,
        businessFunnel: buildFunnel(
          [
            { name: "Signup Started", event: "business_signup_started" },
            { name: "Signup Completed", event: "business_signup_completed" },
          ],
          counts
        ),
        freelancerFunnel: buildFunnel(
          [
            { name: "App Started", event: "freelancer_application_started" },
            { name: "App Submitted", event: "freelancer_application_submitted" },
            { name: "Approved", event: "freelancer_approved" },
          ],
          counts
        ),
        deliveryFunnel: buildFunnel(
          [
            { name: "Task Created", event: "task_created" },
            { name: "Task Assigned", event: "task_assigned" },
            { name: "Work Submitted", event: "work_submitted" },
            { name: "Escrow Created", event: "escrow_created" },
            { name: "Escrow Funded", event: "escrow_funded" },
            { name: "Escrow Released", event: "escrow_released" },
          ],
          counts
        ),
        dailyBuckets: buildDailyBuckets(rows, daysBack),
      };
    },
    staleTime: 60_000, // cache for 60s — analytics doesn't need to refresh on every render
  });
}
