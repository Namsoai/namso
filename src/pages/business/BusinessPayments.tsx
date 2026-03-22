import DashboardShell from "@/components/DashboardShell";
import { businessSidebarItems } from "./BusinessOverview";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";

export default function BusinessPayments() {
  const { user } = useAuth();
  const { data: payments, isLoading } = usePayments({ payerId: user?.id });

  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Payments</h1>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !payments?.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No payments yet. Payment records will appear here when tasks are completed.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map(p => (
                <tr key={p.id} className="bg-card">
                  <td className="px-4 py-3 font-medium text-foreground">€{Number(p.amount).toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{p.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
