import { usePayments } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardShell from "@/components/DashboardShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { adminSidebarItems } from "./AdminOverview";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];

// Allowed admin-initiated transitions from a given status
const ALLOWED_ACTIONS: Record<PaymentStatus, PaymentStatus[]> = {
  held:     ["released", "refunded", "disputed"],
  disputed: ["released", "refunded"],
  pending:  ["held", "released", "refunded"],
  funded:   ["released", "refunded"],
  released: [],
  refunded: [],
  failed:   [],
};

function badgeVariant(status: PaymentStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "released") return "default";
  if (status === "refunded" || status === "failed") return "destructive";
  if (status === "disputed") return "destructive";
  return "secondary";
}

export default function AdminPayments() {
  const { data: payments, isLoading } = usePayments();
  const qc = useQueryClient();
  const { toast } = useToast();

  const updatePaymentStatus = async (paymentId: string, status: PaymentStatus) => {
    const { error } = await supabase
      .from("payments")
      .update({ status })
      .eq("id", paymentId);
    if (error) {
      toast({ title: "Error updating payment", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Payment marked as ${status}` });
      qc.invalidateQueries({ queryKey: ["payments"] });
    }
  };

  const totalHeld = payments?.filter((p) => p.status === "held").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalReleased = payments?.filter((p) => p.status === "released").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalRefunded = payments?.filter((p) => p.status === "refunded").reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Payments</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Held</p>
          <p className="font-display text-xl font-bold text-foreground">€{totalHeld.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Released</p>
          <p className="font-display text-xl font-bold text-foreground">€{totalReleased.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Refunded</p>
          <p className="font-display text-xl font-bold text-foreground">€{totalRefunded.toFixed(2)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !payments?.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No payment records yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map((p) => {
                const status = p.status as PaymentStatus;
                const actions = ALLOWED_ACTIONS[status] ?? [];
                return (
                  <tr key={p.id} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">€{Number(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={badgeVariant(status)}>{status.replace("_", " ")}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {actions.includes("released") && (
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="default">Release</Button>}
                            title="Release this payment?"
                            description={`€${Number(p.amount).toFixed(2)} will be marked as released to the freelancer.`}
                            confirmLabel="Release"
                            variant="default"
                            onConfirm={() => updatePaymentStatus(p.id, "released")}
                          />
                        )}
                        {actions.includes("refunded") && (
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="outline">Refund</Button>}
                            title="Refund this payment?"
                            description={`€${Number(p.amount).toFixed(2)} will be marked as refunded.`}
                            confirmLabel="Refund"
                            onConfirm={() => updatePaymentStatus(p.id, "refunded")}
                          />
                        )}
                        {actions.includes("disputed") && (
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="destructive">Dispute</Button>}
                            title="Mark as disputed?"
                            description="This payment will be flagged for review."
                            confirmLabel="Dispute"
                            onConfirm={() => updatePaymentStatus(p.id, "disputed")}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
