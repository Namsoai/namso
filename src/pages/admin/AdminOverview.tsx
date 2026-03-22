import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, Building2, Briefcase, CreditCard,
  Mail, BarChart3, Settings, ClipboardList, Store, LineChart, Scale,
  AlertOctagon, CheckCircle2, ShieldAlert, Activity
} from "lucide-react";
import DashboardShell, { SidebarItem } from "@/components/DashboardShell";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

const sidebarItems: SidebarItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/freelancers", label: "Freelancers", icon: GraduationCap },
  { to: "/admin/businesses", label: "Businesses", icon: Building2 },
  { to: "/admin/tasks", label: "Tasks", icon: Briefcase },
  { to: "/admin/services", label: "Services", icon: Store },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/disputes", label: "Disputes", icon: Scale },
  { to: "/admin/notifications", label: "Notifications", icon: Mail },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminOverview() {
  const [metrics, setMetrics] = useState({
    business: {
      newUsersToday: 0,
      appsPending: 0,
      escrowFundedToday: 0,
      escrowReleasedToday: 0,
      openDisputes: 0
    },
    health: {
      deadLetters: 0,
      bouncedEmails: 0,
      slaBreaches: 0,
      mismatches: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // Step 1: Identify smoke/test user IDs so we can exclude them from metrics.
      // Email substring filter works on profiles directly via PostgREST ilike.
      const { data: testProfiles } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", "%smoke_%@test.com");
      const testIds: string[] = (testProfiles ?? []).map((p) => p.id);

      // Helper: apply a PostgREST `not(col, in, (...ids))` exclusion only when test IDs exist.
      // Accepts `any` because the Supabase builder chain returns a `PostgrestFilterBuilder`,
      // not a bare `PostgrestQueryBuilder`, and we simply decorate the chain.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function excludeTestIds(query: any, column: string): any {
        if (testIds.length === 0) return query;
        return (query as any).not(column, "in", `(${testIds.join(",")})`);
      }

      // Step 2: Parallel queries – all exclude smoke users where applicable.
      const [
        { count: newUsersCount },
        { count: pendingAppsCount },
        { count: fundedCount },
        { count: releasedCount },
        { count: disputeCount },
        disputeSlaRes,
        { count: dlqCount },
        { count: bouncedCount },
        { count: mismatchCount },
      ] = await Promise.all([
        excludeTestIds(
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayIso).in("role", ["business", "freelancer"]),
          "id"
        ),
        // freelancer_applications has no user_id FK — it has an `email` column, so filter directly
        supabase.from("freelancer_applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .not("email", "ilike", "%smoke_%@test.com"),
        excludeTestIds(
          supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "funded").gte("updated_at", todayIso),
          "payer_id"
        ),
        excludeTestIds(
          supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "released").gte("updated_at", todayIso),
          "payer_id"
        ),
        // Plain count — no joins, no FK-failure risk. Ground-truth that matches AdminDisputes.
        supabase.from("payments")
          .select("*", { count: "exact", head: true })
          .in("status", ["disputed", "refund_requested"]),
        // Minimal join for SLA breach computation only — no task/profile FKs.
        supabase.from("payments")
          .select("id, created_at, escrow_audit_logs(created_at)")
          .in("status", ["disputed", "refund_requested"]),
        supabase.from("notification_deliveries").select("*", { count: "exact", head: true }).eq("status", "dead_letter"),
        supabase.from("notification_deliveries").select("*", { count: "exact", head: true }).eq("status", "bounced"),
        supabase.from("reconciliation_logs").select("*", { count: "exact", head: true }).in("action_taken", ["LOGGED_MISMATCH_ONLY", "LOGGED_MISMATCH"]),
      ]);

      const slaRows = disputeSlaRes.data || [];
      let slaBreaches = 0;

      // Compute SLA Breaches from audit log activity, not raw updated_at
      for (const d of slaRows) {
        let lastActivity = new Date(d.created_at).getTime();
        if (d.escrow_audit_logs && d.escrow_audit_logs.length > 0) {
          const times = d.escrow_audit_logs.map((l: any) => new Date(l.created_at).getTime());
          lastActivity = Math.max(...times);
        }
        if ((Date.now() - lastActivity) > 48 * 60 * 60 * 1000) slaBreaches++;
      }

      setMetrics({
        business: {
          newUsersToday: newUsersCount || 0,
          appsPending: pendingAppsCount || 0,
          escrowFundedToday: fundedCount || 0,
          escrowReleasedToday: releasedCount || 0,
          openDisputes: disputeCount || 0,
        },
        health: {
          deadLetters: dlqCount || 0,
          bouncedEmails: bouncedCount || 0,
          slaBreaches,
          mismatches: mismatchCount || 0,
        },
      });
      setLoading(false);
    }
    load();
  }, []);

  const healthPerfect = 
    metrics.health.deadLetters === 0 && 
    metrics.health.bouncedEmails <= 10 &&    // 10 bounces allowed before full system alert triggers
    metrics.health.slaBreaches === 0 && 
    metrics.health.mismatches === 0;

  return (
    <DashboardShell sidebarItems={sidebarItems} title="Overview">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Launch Control Tower</h1>
          <p className="text-sm text-muted-foreground">Executive overview of live system health and business operations.</p>
        </div>
        <NotificationBell />
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 animate-pulse">
          <div className="h-48 bg-muted rounded-xl"></div>
          <div className="h-48 bg-muted rounded-xl"></div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Business Metrics */}
          <div className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-primary/5 border-b border-border/50 p-4 pb-3 flex items-center justify-between">
               <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                 <Activity className="h-4 w-4 text-primary" /> Business Operations
               </h2>
               <Link to="/admin/analytics" className="text-xs font-semibold text-primary hover:underline">View Analytics &rarr;</Link>
            </div>
            
            <div className="p-2 gap-px bg-border flex flex-col">
               <div className="bg-card p-4 flex justify-between items-center group hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">New users (today)</span>
                  <span className="text-xl font-display font-bold">{metrics.business.newUsersToday}</span>
               </div>
               <Link to="/admin/applications" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">Applications pending</span>
                  <span className={`text-xl font-display font-bold ${metrics.business.appsPending > 0 ? 'text-amber-500' : 'text-foreground'}`}>{metrics.business.appsPending}</span>
               </Link>
               <Link to="/admin/payments" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">Escrow funded (today)</span>
                  <span className="text-xl font-display font-bold text-emerald-600">{metrics.business.escrowFundedToday}</span>
               </Link>
               <Link to="/admin/payments" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">Escrow released (today)</span>
                  <span className="text-xl font-display font-bold text-emerald-600">{metrics.business.escrowReleasedToday}</span>
               </Link>
               <Link to="/admin/disputes" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">Open disputes</span>
                  <span className="text-xl font-display font-bold">{metrics.business.openDisputes}</span>
               </Link>
            </div>
          </div>

          {/* System Health */}
          <div className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col ${healthPerfect ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
            <div className={`${healthPerfect ? 'bg-emerald-50' : 'bg-rose-50'} border-b border-border/50 p-4 pb-3 flex items-center justify-between`}>
               <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${healthPerfect ? 'text-emerald-700' : 'text-rose-700'}`}>
                 {healthPerfect ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />} 
                 System Health
               </h2>
               <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${healthPerfect ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700 animate-pulse'}`}>
                 {healthPerfect ? 'SECURE' : 'ACTION REQUIRED'}
               </span>
            </div>
            
            <div className="p-2 gap-px bg-border flex flex-col">
               <Link to="/admin/notifications" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {metrics.health.deadLetters > 0 ? <AlertOctagon className="h-4 w-4 text-rose-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    Dead letters (DLQ)
                  </span>
                  <span className={`text-xl font-display font-bold ${metrics.health.deadLetters > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {metrics.health.deadLetters}
                  </span>
               </Link>
               
               <Link to="/admin/notifications" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {metrics.health.bouncedEmails > 0 ? <AlertOctagon className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    Bounced emails
                  </span>
                  <span className={`text-xl font-display font-bold ${metrics.health.bouncedEmails > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {metrics.health.bouncedEmails}
                  </span>
               </Link>

               <Link to="/admin/disputes" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {metrics.health.slaBreaches > 0 ? <AlertOctagon className="h-4 w-4 text-rose-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    SLA breaches (&gt;48h)
                  </span>
                  <span className={`text-xl font-display font-bold ${metrics.health.slaBreaches > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {metrics.health.slaBreaches}
                  </span>
               </Link>

               <Link to="/admin/payments" className="bg-card p-4 flex justify-between items-center hover:bg-muted/30 transition-colors" title="Escrow state discrepancies requiring manual override.">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {metrics.health.mismatches > 0 ? <AlertOctagon className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    Reconciliation mismatches
                  </span>
                  <span className={`text-xl font-display font-bold ${metrics.health.mismatches > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {metrics.health.mismatches}
                  </span>
               </Link>
            </div>
          </div>
          
        </div>
      )}
    </DashboardShell>
  );
}

export { sidebarItems as adminSidebarItems };
