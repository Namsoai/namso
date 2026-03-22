/**
 * EscrowPanel — UI panel for creating, checking, and releasing escrow.
 *
 * Used inside BusinessTaskDetail when a task is in "completed" / "submitted"
 * status and a payment record with an amount exists.
 *
 * Status values match exactly what the Edge Functions return via `deriveStatus()`:
 *   "awaiting_agreement" | "awaiting_payment" | "funded" | "shipped" |
 *   "in_inspection" | "released" | "cancelled" | "rejected"
 *
 * Props:
 *   taskId      – DB task ID
 *   paymentId   – DB payment ID (must exist before this panel is shown)
 *   amount      – task budget amount
 *   buyerEmail  – business owner's email
 *   sellerEmail – freelancer's email
 *   description – (optional) human-readable label for the escrow transaction
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEscrow } from "@/hooks/useEscrow";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ShieldCheck, Loader2, RefreshCw, ExternalLink, LockKeyhole } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface EscrowPanelProps {
  taskId: string;
  paymentId: string;
  amount: number;
  buyerEmail: string;
  sellerEmail: string;
  description?: string;
  /** Pre-existing escrow ID if one was already created for this payment */
  initialEscrowId?: string | null;
}

// ── Status mapping ────────────────────────────────────────────────────────────
// These status strings match the Edge Function `deriveStatus()` output exactly.

type EscrowUIStatus =
  | "idle"                // no escrow created yet
  | "awaiting_agreement"  // created, seller needs to agree
  | "awaiting_payment"    // both agreed, buyer needs to fund
  | "funded"              // buyer funded, money held in escrow
  | "shipped"             // seller marked work as delivered
  | "in_inspection"       // buyer received, reviewing work
  | "released"            // buyer accepted → funds disbursed to seller
  | "cancelled"           // transaction cancelled
  | "rejected"            // buyer rejected the work
  | "unknown";            // unrecognized status

/**
 * Map the Edge Function's derived status string to a UI status.
 * Uses exact matching — no substring guessing.
 */
function mapStatus(derivedStatus: string): EscrowUIStatus {
  const validStatuses: EscrowUIStatus[] = [
    "awaiting_agreement", "awaiting_payment", "funded", "shipped",
    "in_inspection", "released", "cancelled", "rejected",
  ];
  if (validStatuses.includes(derivedStatus as EscrowUIStatus)) {
    return derivedStatus as EscrowUIStatus;
  }
  return "unknown";
}

const statusBadgeVariant: Record<EscrowUIStatus, "default" | "secondary" | "destructive" | "outline"> = {
  idle:                "outline",
  awaiting_agreement:  "outline",
  awaiting_payment:    "secondary",
  funded:              "default",
  shipped:             "secondary",
  in_inspection:       "secondary",
  released:            "default",
  cancelled:           "destructive",
  rejected:            "destructive",
  unknown:             "outline",
};

const statusLabel: Record<EscrowUIStatus, string> = {
  idle:                "Not created",
  awaiting_agreement:  "Awaiting agreement",
  awaiting_payment:    "Awaiting payment",
  funded:              "In escrow",
  shipped:             "Work delivered",
  in_inspection:       "Under review",
  released:            "Released",
  cancelled:           "Cancelled",
  rejected:            "Rejected",
  unknown:             "Unknown",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function EscrowPanel({
  taskId,
  paymentId,
  amount,
  buyerEmail,
  sellerEmail,
  description,
  initialEscrowId,
}: EscrowPanelProps) {
  const { createEscrow, checkEscrowStatus, releaseEscrow, isLoading, error } = useEscrow();
  const { toast } = useToast();

  const [escrowId, setEscrowId] = useState<string | null>(initialEscrowId ?? null);
  const [uiStatus, setUiStatus] = useState<EscrowUIStatus>(initialEscrowId ? "awaiting_agreement" : "idle");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { currency, formatPrice, convertedValue } = useCurrency();

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    let deliveryTime;
    try {
      const stored = sessionStorage.getItem("checkout_delivery");
      if (stored) deliveryTime = JSON.parse(stored);
    } catch { /* ignore parse error */ }

    const exchangeRate = convertedValue(1);
    const convertedAmount = convertedValue(amount);

    const result = await createEscrow({
      taskId,
      paymentId,
      amount,
      currency,
      convertedAmount,
      exchangeRate,
      deliveryTime,
      buyerEmail,
      sellerEmail,
      description: description ?? `Payment for task ${taskId}`,
    });
    if (result) {
      setEscrowId(result.escrowId);
      setUiStatus(mapStatus(result.status));
      if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
      toast({ title: "Escrow created", description: "The seller must agree, then the buyer can fund." });
    } else {
      toast({ title: "Escrow creation failed", description: error ?? "Unknown error.", variant: "destructive" });
    }
  };

  // ── Check status ──────────────────────────────────────────────────────────
  const handleCheckStatus = async () => {
    if (!escrowId) return;
    const result = await checkEscrowStatus(escrowId);
    if (result) {
      setUiStatus(mapStatus(result.status));
      if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
      toast({ title: "Escrow status refreshed", description: `Status: ${statusLabel[mapStatus(result.status)]}` });
    } else {
      toast({ title: "Status check failed", description: error ?? "Unknown error.", variant: "destructive" });
    }
  };

  // ── Release ───────────────────────────────────────────────────────────────
  const handleRelease = async () => {
    if (!escrowId) return;
    const result = await releaseEscrow({ escrowId, paymentId, buyerEmail, sellerEmail });
    if (result) {
      setUiStatus(mapStatus(result.status));
      const msg = result.note
        ? "Release initiated. Funds will auto-release after inspection period."
        : "Payment has been released to the freelancer.";
      toast({ title: "Funds released", description: msg });
    } else {
      toast({ title: "Release failed", description: error ?? "Unknown error.", variant: "destructive" });
    }
  };

  // ── Determine which actions are available ─────────────────────────────────
  const canCreate = uiStatus === "idle";
  const canRefresh = escrowId && !["released", "cancelled"].includes(uiStatus);
  const canRelease = ["funded", "awaiting_payment", "awaiting_agreement", "shipped"].includes(uiStatus);
  const isTerminal = ["released", "cancelled", "rejected"].includes(uiStatus);

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <LockKeyhole className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">Escrow Payment</h3>
        <Badge variant={statusBadgeVariant[uiStatus]} className="ml-auto text-[10px]">
          {statusLabel[uiStatus]}
        </Badge>
      </div>

      {/* Amount summary */}
      <p className="mb-4 text-sm text-muted-foreground">
        Amount held in escrow:{" "}
        <span className="font-semibold text-foreground">{formatPrice(amount)}</span>
      </p>

      {/* Escrow ID display */}
      {escrowId && (
        <p className="mb-4 text-xs text-muted-foreground break-all">
          <span className="font-medium text-foreground">Escrow ID:</span> {escrowId}
        </p>
      )}

      {/* Payment URL — shown when buyer needs to fund */}
      {uiStatus === "awaiting_payment" && paymentUrl && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-sm font-medium text-foreground">Fund this task</p>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Pay {formatPrice(amount)} securely via Escrow.com.
          </p>
          <a href={paymentUrl} target="_blank" rel="noreferrer">
            <Button className="w-full">
              Go to Escrow.com <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Create */}
        {canCreate && (
          <ConfirmDialog
            trigger={
              <Button size="sm" className="gap-1.5" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                Create Escrow
              </Button>
            }
            title="Create escrow transaction?"
            description={`This will create a secure escrow for ${formatPrice(amount)}. The seller must agree, then the buyer funds it. Funds are released when work is approved.`}
            confirmLabel="Create Escrow"
            variant="default"
            onConfirm={handleCreate}
          />
        )}

        {/* Refresh status */}
        {canRefresh && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCheckStatus} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh Status
          </Button>
        )}

        {/* Release */}
        {canRelease && (
          <ConfirmDialog
            trigger={
              <Button size="sm" variant="default" className="gap-1.5" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                Release Funds
              </Button>
            }
            title="Release escrow funds?"
            description="This will execute the release flow (ship → receive → accept). Only do this once you have approved the work."
            confirmLabel="Release Funds"
            variant="default"
            onConfirm={handleRelease}
          />
        )}

        {/* Released state — read only */}
        {uiStatus === "released" && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            Funds have been released to the freelancer.
          </p>
        )}

        {/* Idle state — read only */}
        {uiStatus === "idle" && (
          <div className="mt-4 rounded-lg bg-secondary/50 p-4 text-center">
            <p className="text-sm font-medium text-foreground">Pending Escrow Creation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Base Amount: €{amount} / Converted: {formatPrice(amount)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              The business needs to initiate the escrow. Funds will be held securely.
            </p>
          </div>
        )}

        {/* Rejected state — read only */}
        {uiStatus === "rejected" && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            Work was rejected by the buyer.
          </p>
        )}
      </div>
    </div>
  );
}
