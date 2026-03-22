import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";

export default function FreelancerCompleted() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useTasks({ assignedTo: user?.id });
  const completed = tasks?.filter(t => t.status === "completed") ?? [];

  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Completed Work</h1>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !completed.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No completed tasks yet.</div>
      ) : (
        <div className="space-y-3">
          {completed.map(t => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-medium text-foreground">{t.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.category} · €{Number(t.budget).toFixed(0)} · Completed {new Date(t.updated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
