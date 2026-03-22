import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, Building2, Briefcase, CreditCard,
  Mail, BarChart3, Settings, FileText, ClipboardList, Store, TrendingUp,
  Activity, ShieldCheck, LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { to: "/admin/messages", label: "Messages", icon: Mail },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalFreelancers: 0, approvedFreelancers: 0, pendingFreelancers: 0, rejectedFreelancers: 0,
    totalBusinesses: 0, totalTasks: 0, openTasks: 0, activeTasks: 0,
    completedTasks: 0, totalMessages: 0, totalPayments: 0,
    totalRevenue: 0, releasedRevenue: 0, avgTaskValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [apps, roles, tasks, msgs, payments, proposals] = await Promise.all([
        supabase.from("freelancer_applications").select("status"),
        supabase.from("user_roles").select("role"),
        supabase.from("tasks").select("status, budget"),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("amount, status"),
      ]);

      const appData = apps.data ?? [];
      const roleData = roles.data ?? [];
      const taskData = tasks.data ?? [];
      const paymentData = payments.data ?? [];

      const totalRevenue = paymentData.reduce((s, p) => s + Number(p.amount), 0);
      const releasedRevenue = paymentData.filter(p => p.status === "released").reduce((s, p) => s + Number(p.amount), 0);
      const avgTaskValue = taskData.length ? taskData.reduce((s, t) => s + Number(t.budget), 0) / taskData.length : 0;


      setStats({
        totalFreelancers: appData.length,
        approvedFreelancers: appData.filter(a => a.status === "approved").length,
        pendingFreelancers: appData.filter(a => a.status === "pending").length,
        rejectedFreelancers: appData.filter(a => a.status === "rejected").length,
        totalBusinesses: roleData.filter(r => r.role === "business").length,
        totalTasks: taskData.length,
        openTasks: taskData.filter(t => t.status === "open").length,
        activeTasks: taskData.filter(t => t.status === "in_progress").length,
        completedTasks: taskData.filter(t => t.status === "completed").length,
        totalMessages: msgs.count ?? 0,
        totalPayments: paymentData.length,
        totalRevenue,
        releasedRevenue,
        avgTaskValue,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: "Total Revenue", value: `€${stats.totalRevenue.toFixed(0)}`, icon: TrendingUp },
    { label: "Released Revenue", value: `€${stats.releasedRevenue.toFixed(0)}`, icon: CreditCard },
    { label: "Avg Task Value", value: `€${stats.avgTaskValue.toFixed(0)}`, icon: Activity },
    { label: "Total Applications", value: stats.totalFreelancers, icon: FileText },
    { label: "Pending", value: stats.pendingFreelancers, icon: ClipboardList, link: "/admin/applications" },
    { label: "Approved Freelancers", value: stats.approvedFreelancers, icon: GraduationCap, link: "/admin/freelancers" },
    { label: "Total Businesses", value: stats.totalBusinesses, icon: Building2, link: "/admin/businesses" },
    { label: "Total Tasks", value: stats.totalTasks, icon: Briefcase, link: "/admin/tasks" },
    { label: "Completed Tasks", value: stats.completedTasks, icon: Briefcase },
    { label: "Active Tasks", value: stats.activeTasks, icon: Briefcase },
    { label: "Contact Messages", value: stats.totalMessages, icon: Mail, link: "/admin/messages" },
    { label: "Payment Records", value: stats.totalPayments, icon: CreditCard, link: "/admin/payments" },
  ];

  return (
    <DashboardShell sidebarItems={sidebarItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">Platform administration dashboard</p>
        </div>
        <NotificationBell />
      </div>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map(c => (
              <div key={c.label} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <c.icon className="h-4 w-4" /> {c.label}
                </div>
                <div className="font-display text-2xl font-bold text-foreground">{c.value}</div>
                {"link" in c && c.link && (
                  <Link to={c.link} className="mt-1 block text-xs text-primary hover:underline">View →</Link>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/applications"><Button size="sm">Review Applications</Button></Link>
            <Link to="/admin/tasks"><Button size="sm" variant="outline">Manage Tasks</Button></Link>
            <Link to="/admin/payments"><Button size="sm" variant="outline">Manage Payments</Button></Link>
            <Link to="/admin/reports"><Button size="sm" variant="outline">View Reports</Button></Link>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

export { sidebarItems as adminSidebarItems };
