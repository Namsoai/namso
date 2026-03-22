import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";

const statusColors: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  draft:              "secondary",
  open:               "default",
  in_progress:        "default",
  revision_requested: "secondary",
  completed:          "default",
  cancelled:          "destructive",
  disputed:           "destructive",
};

export default function AdminTasks() {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (tasks ?? [])
    .filter(t => statusFilter === "all" || t.status === statusFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  const statuses = ["all", "open", "in_progress", "draft", "revision_requested", "completed", "cancelled"];

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Tasks</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No tasks found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Budget</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deadline</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(t => (
                <tr key={t.id} className="bg-card hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{t.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">€{Number(t.budget).toFixed(0)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{t.deadline || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={(statusColors[t.status as keyof typeof statusColors] as "secondary" | "default" | "destructive") || "secondary"}>{t.status.replace("_", " ")}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {t.status === "open" && (
                      <Button size="sm" variant="outline" onClick={() => updateTask.mutate({ id: t.id, status: "cancelled" })}>Cancel</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
