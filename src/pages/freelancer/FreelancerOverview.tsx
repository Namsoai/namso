import { Link } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, Clock, CheckCircle2, DollarSign,
  MessageSquare, Settings, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardShell, { SidebarItem } from "@/components/DashboardShell";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, usePayments } from "@/hooks/useTasks";

const sidebarItems: SidebarItem[] = [
  { to: "/freelancer", label: "Overview", icon: LayoutDashboard },
  { to: "/freelancer/available-tasks", label: "Available Tasks", icon: Briefcase },
  { to: "/freelancer/active", label: "Active Work", icon: Clock },
  { to: "/freelancer/completed", label: "Completed", icon: CheckCircle2 },
  { to: "/freelancer/earnings", label: "Earnings", icon: DollarSign },
  { to: "/freelancer/messages", label: "Messages", icon: MessageSquare },
  { to: "/freelancer/portfolio", label: "Portfolio", icon: User },
  { to: "/freelancer/settings", label: "Settings", icon: Settings },
];

export default function FreelancerOverview() {
  const { user, profile } = useAuth();
  const { data: assignedTasks } = useTasks({ assignedTo: user?.id });
  const { data: payments } = usePayments({ payeeId: user?.id });

  const activeTasks = assignedTasks?.filter(t => ["in_progress", "revision_requested"].includes(t.status)).length ?? 0;
  const completedTasks = assignedTasks?.filter(t => t.status === "completed").length ?? 0;
  const totalEarnings = payments?.filter(p => ["held", "released"].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const stats = [
    { label: "Active Tasks", value: activeTasks, icon: Clock },
    { label: "Completed", value: completedTasks, icon: CheckCircle2 },
    { label: "Total Earnings", value: `€${totalEarnings.toFixed(0)}`, icon: DollarSign },
  ];

  return (
    <DashboardShell sidebarItems={sidebarItems} title="Freelancer">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Find tasks and grow your portfolio</p>
        </div>
        <NotificationBell />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <s.icon className="h-4 w-4" />{s.label}
            </div>
            <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/freelancer/available-tasks"><Button size="sm">Browse Tasks</Button></Link>
        <Link to="/freelancer/active"><Button size="sm" variant="outline">Active Work</Button></Link>
        <Link to="/freelancer/portfolio"><Button size="sm" variant="outline">Update Portfolio</Button></Link>
      </div>

      {(!assignedTasks || assignedTasks.length === 0) && (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="italic">Ready to start? Browse available tasks or wait for a business to assign you.</p>
          <Link to="/freelancer/available-tasks" className="mt-4 inline-block">
            <Button>Browse Tasks</Button>
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}

export { sidebarItems as freelancerSidebarItems };
