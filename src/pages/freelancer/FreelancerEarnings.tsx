import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";

export default function FreelancerEarnings() {
  const { user } = useAuth();
  const { data: payments, isLoading } = usePayments({ payeeId: user?.id });

  const total = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const released = payments?.filter(p => p.status === "released").reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const pending = payments?.filter(p => ["pending", "held"].includes(p.status)).reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Earnings</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="font-display text-2xl font-bold text-foreground">€{total.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Released</p>
          <p className="font-display text-2xl font-bold text-foreground">€{released.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="font-display text-2xl font-bold text-foreground">€{pending.toFixed(2)}</p>
        </div>
      </div>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      ) : !payments?.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No earnings yet. Complete tasks to start earning.</div>
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
