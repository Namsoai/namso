import { Link } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, Clock, CheckCircle2, CreditCard,
  MessageSquare, Settings, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardShell, { SidebarItem } from "@/components/DashboardShell";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, usePayments } from "@/hooks/useTasks";

const sidebarItems: SidebarItem[] = [
  { to: "/business", label: "Overview", icon: LayoutDashboard },
  { to: "/business/tasks", label: "My Tasks", icon: Briefcase },
  { to: "/business/active", label: "Active Work", icon: Clock },
  { to: "/business/completed", label: "Completed", icon: CheckCircle2 },
  { to: "/business/payments", label: "Payments", icon: CreditCard },
  { to: "/business/messages", label: "Messages", icon: MessageSquare },
  { to: "/business/settings", label: "Settings", icon: Settings },
];

export default function BusinessOverview() {
  const { user, profile } = useAuth();
  const { data: tasks } = useTasks({ businessId: user?.id });
  const { data: payments } = usePayments({ payerId: user?.id });

  const openTasks = tasks?.filter(t => t.status === "open").length ?? 0;
  const activeTasks = tasks?.filter(t => t.status === "in_progress").length ?? 0;
  const completedTasks = tasks?.filter(t => t.status === "completed").length ?? 0;
  const totalSpent = payments?.filter(p => ["held", "released"].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const stats = [
    { label: "Posted Tasks", value: tasks?.length ?? 0, icon: Briefcase },
    { label: "Open Tasks", value: openTasks, icon: FileText },
    { label: "Active Work", value: activeTasks, icon: Clock },
    { label: "Completed", value: completedTasks, icon: CheckCircle2 },
  ];

  return (
    <DashboardShell sidebarItems={sidebarItems} title="Business">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Manage your tasks and active assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link to="/business/post-task">
            <Button size="sm"><Plus className="mr-2 h-4 w-4" />Post a Task</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <s.icon className="h-4 w-4" />{s.label}
            </div>
            <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {totalSpent > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4" /> Total Spent
          </div>
          <div className="font-display text-2xl font-bold text-foreground">€{totalSpent.toFixed(0)}</div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/business/post-task"><Button size="sm"><Plus className="mr-2 h-4 w-4" />Post a Task</Button></Link>
        <Link to="/services"><Button size="sm" variant="outline">Browse Services</Button></Link>
      </div>

      {(!tasks || tasks.length === 0) && (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="italic">No tasks posted yet. Post your first task to assign to verified freelancers.</p>
          <Link to="/business/post-task" className="mt-4 inline-block">
            <Button><Plus className="mr-2 h-4 w-4" />Post a Task</Button>
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}

export { sidebarItems as businessSidebarItems };
