import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DashboardShell from "@/components/DashboardShell";
import { businessSidebarItems } from "./BusinessOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";

export default function BusinessCompleted() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tasks, isLoading } = useTasks({ businessId: user?.id });
  const completed = tasks?.filter(t => t.status === "completed") ?? [];

  const repost = (task: typeof completed[0]) => {
    navigate("/business/post-task", {
      state: {
        prefill: {
          title: task.title,
          description: task.description,
          category: task.category,
          budget: String(task.budget),
          tools: task.tools ?? "",
        },
      },
    });
  };

  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Completed Work</h1>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !completed.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">
          No completed tasks yet. Once a freelancer delivers and you approve, tasks appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {completed.map(t => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <Link to={`/business/tasks/${t.id}`} className="font-medium text-foreground hover:text-primary">{t.title}</Link>
                <p className="mt-1 text-xs text-muted-foreground">{t.category} · €{Number(t.budget).toFixed(0)} · Completed {new Date(t.updated_at).toLocaleDateString()}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => repost(t)}>Repost</Button>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
