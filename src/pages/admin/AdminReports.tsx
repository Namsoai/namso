import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminReports() {
  const [appsByMonth, setAppsByMonth] = useState<Record<string, unknown>[]>([]);
  const [tasksByMonth, setTasksByMonth] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [apps, tasks] = await Promise.all([
        supabase.from("freelancer_applications").select("created_at"),
        supabase.from("tasks").select("created_at, status"),
      ]);

      // Group by month
      const groupByMonth = (items: { created_at: string; [key: string]: unknown }[]) => {
        const map: Record<string, number> = {};
        items.forEach(i => {
          const month = new Date(i.created_at).toISOString().slice(0, 7);
          map[month] = (map[month] || 0) + 1;
        });
        return Object.entries(map).sort().map(([month, count]) => ({ month, count }));
      };

      setAppsByMonth(groupByMonth(apps.data ?? []));
      setTasksByMonth(groupByMonth(tasks.data ?? []));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Reports</h1>
      {loading ? (
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Freelancer Applications Over Time</h2>
            {appsByMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={appsByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(270 60% 30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Tasks Over Time</h2>
            {tasksByMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tasksByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(270 60% 30%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
