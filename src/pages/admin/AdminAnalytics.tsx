/**
 * AdminAnalytics — Admin-only analytics dashboard
 *
 * Displays:
 *   - Top stat cards for all 11 tracked events
 *   - Business signup funnel
 *   - Freelancer application + approval funnel
 *   - Delivery / Escrow pipeline funnel
 *   - Time-range toggle: 7d | 30d | All time
 */

import { useState } from "react";
import {
  Users, Briefcase, CreditCard, TrendingUp, UserCheck,
  ClipboardList, ShoppingBag, DollarSign, CheckCircle2,
  BarChart3, Activity,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import StatCard from "@/components/analytics/StatCard";
import FunnelBar from "@/components/analytics/FunnelBar";
import { useAnalytics, TimeRange } from "@/hooks/useAnalytics";

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "All time", value: "all" },
];

function pct(a: number, b: number) {
  if (b === 0) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<TimeRange>("30d");
  const { data, isLoading } = useAnalytics(range);

  const c = data?.counts;

  const statCards = [
    // Business growth
    { label: "Biz Signups Started",    value: c?.business_signup_started ?? 0,    icon: Users,         highlight: false },
    { label: "Biz Signups Completed",  value: c?.business_signup_completed ?? 0,  icon: UserCheck,     highlight: true,
      sublabel: `Conversion: ${pct(c?.business_signup_completed ?? 0, c?.business_signup_started ?? 0)}` },
    // Freelancer pipeline
    { label: "FL Apps Started",        value: c?.freelancer_application_started ?? 0,   icon: ClipboardList, highlight: false },
    { label: "FL Apps Submitted",      value: c?.freelancer_application_submitted ?? 0, icon: ClipboardList, highlight: false,
      sublabel: `${pct(c?.freelancer_application_submitted ?? 0, c?.freelancer_application_started ?? 0)} submitted` },
    { label: "Freelancers Approved",   value: c?.freelancer_approved ?? 0,        icon: UserCheck,     highlight: true,
      sublabel: `${pct(c?.freelancer_approved ?? 0, c?.freelancer_application_submitted ?? 0)} of submitted` },
    // Task delivery
    { label: "Tasks Created",          value: c?.task_created ?? 0,               icon: Briefcase,     highlight: false },
    { label: "Tasks Assigned",         value: c?.task_assigned ?? 0,              icon: Activity,      highlight: false,
      sublabel: `${pct(c?.task_assigned ?? 0, c?.task_created ?? 0)} assigned` },
    { label: "Work Submitted",         value: c?.work_submitted ?? 0,             icon: ShoppingBag,   highlight: false,
      sublabel: `${pct(c?.work_submitted ?? 0, c?.task_assigned ?? 0)} of assigned` },
    // Escrow
    { label: "Escrow Created",         value: c?.escrow_created ?? 0,             icon: CreditCard,    highlight: false },
    { label: "Escrow Funded",          value: c?.escrow_funded ?? 0,              icon: DollarSign,    highlight: false,
      sublabel: `${pct(c?.escrow_funded ?? 0, c?.escrow_created ?? 0)} funded` },
    { label: "Escrow Released",        value: c?.escrow_released ?? 0,            icon: CheckCircle2,  highlight: true,
      sublabel: `${pct(c?.escrow_released ?? 0, c?.escrow_funded ?? 0)} released` },
  ];

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold text-foreground">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Event-level funnel data — intent vs truth
          </p>
        </div>

        {/* Time range picker */}
        <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                range === r.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {statCards.map(card => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                sublabel={card.sublabel}
                highlight={card.highlight}
              />
            ))}
          </div>

          {/* Funnel section label */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Funnels</h2>
          </div>

          {/* Funnels */}
          <div className="grid gap-4 lg:grid-cols-3">
            <FunnelBar
              title="Business Signup"
              steps={data?.businessFunnel ?? []}
              color="bg-blue-500"
            />
            <FunnelBar
              title="Freelancer Pipeline"
              steps={data?.freelancerFunnel ?? []}
              color="bg-violet-500"
            />
            <FunnelBar
              title="Delivery & Escrow"
              steps={data?.deliveryFunnel ?? []}
              color="bg-emerald-500"
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
