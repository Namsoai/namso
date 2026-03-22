import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import DashboardShell from "@/components/DashboardShell";
import { businessSidebarItems } from "./BusinessOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";

export default function BusinessActiveWork() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useTasks({ businessId: user?.id });
  const active = tasks?.filter(t => t.status === "in_progress") ?? [];

  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Active Work</h1>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !active.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No active work. Once you hire a freelancer, tasks will appear here.</div>
      ) : (
        <div className="space-y-3">
          {active.map(t => (
            <Link key={t.id} to={`/business/tasks/${t.id}`} className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.category} · €{Number(t.budget).toFixed(0)}{t.deadline ? ` · Due: ${t.deadline}` : ""}</p>
                </div>
                <Badge variant="secondary">{t.status.replace("_", " ")}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
