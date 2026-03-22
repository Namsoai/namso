import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardShell from "@/components/DashboardShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { businessSidebarItems } from "./BusinessOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";

export default function BusinessMyTasks() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useTasks({ businessId: user?.id });
  const updateTask = useUpdateTask();

  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">My Tasks</h1>
        <Link to="/business/post-task"><Button size="sm"><Plus className="mr-2 h-4 w-4" />Post a Task</Button></Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !tasks?.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">
          No tasks yet. <Link to="/business/post-task" className="text-primary hover:underline">Post your first task.</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(t => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <Link to={`/business/tasks/${t.id}`} className="font-medium text-foreground hover:text-primary">{t.title}</Link>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{t.category}</span>
                    <span>€{Number(t.budget).toFixed(0)}</span>
                    {t.deadline && <span>Due: {t.deadline}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t.status.replace("_", " ")}</Badge>
                  {t.status === "open" && (
                    <ConfirmDialog
                      trigger={<Button size="sm" variant="outline">Cancel</Button>}
                      title="Cancel this task?"
                      description="This will remove the task from freelancer listings. This cannot be undone."
                      confirmLabel="Cancel Task"
                      onConfirm={() => updateTask.mutate({ id: t.id, status: "cancelled" as never })}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
