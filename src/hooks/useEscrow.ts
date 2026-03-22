/**
 * useEscrow — frontend hook for escrow operations.
 *
 * All calls go to our own Supabase Edge Functions.
 * The ESCROW_API_KEY is never exposed to the browser.
 *
 * Three operations:
 * - createEscrow: POST /escrow-create → creates an Escrow.com transaction
 * - checkEscrowStatus: GET /escrow-status?escrowId=... → fetches current status
 * - releaseEscrow: POST /escrow-release → executes ship→receive→accept flow
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ── Auth helper ───────────────────────────────────────────────────────────────

/** Get the current user's JWT for Edge Function authorization. */
async function getAuthHeader(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not authenticated.");
  return `Bearer ${token}`;
}

/** Build the Edge Function URL from the Supabase project URL. */
function edgeFnUrl(name: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/functions/v1/${name}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateEscrowParams {
  taskId: string;
  paymentId: string;
  amount: number;       // Base EUR
  currency?: string;    // Selected currency (e.g., USD)
  convertedAmount?: number; // Pre-calculated converted amount
  exchangeRate?: number;    // Rate used
  deliveryTime?: Record<string, any>; // User-defined delivery time payload
  buyerEmail: string;
  sellerEmail: string;
  description?: string;
}

export interface ReleaseEscrowParams {
  escrowId: string;
  paymentId: string;
  buyerEmail: string;
  sellerEmail: string;
}

/** Response shape returned by all three Edge Functions. */
export interface EscrowResult {
  escrowId: string;
  escrowItemId?: string;
  status: string;
  paymentUrl?: string;
  parties?: Array<{ role: string; customer: string; agreed: boolean }>;
  itemStatus?: Record<string, boolean>;
  scheduleStatus?: Record<string, boolean>;
  steps?: Record<string, { executed: boolean; skipped: boolean; ok: boolean; error?: string }>;
  note?: string;
  description?: string;
  currency?: string;
}

// ── Private helper ────────────────────────────────────────────────────────────

/**
 * Generic wrapper for calling an Edge Function with auth, error handling,
 * and loading state management.
 */
async function callEdgeFn(
  fnName: string,
  method: "GET" | "POST",
  urlOrBody?: string | Record<string, unknown>,
): Promise<EscrowResult> {
  const auth = await getAuthHeader();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const headers: Record<string, string> = { 
    Authorization: auth,
    apikey: anonKey
  };

  let url: string;
  let fetchOptions: RequestInit;

  if (method === "GET" && typeof urlOrBody === "string") {
    // GET with query string appended
    url = urlOrBody;
    fetchOptions = { method, headers };
  } else {
    // POST with JSON body
    url = edgeFnUrl(fnName);
    headers["Content-Type"] = "application/json";
    fetchOptions = {
      method,
      headers,
      body: JSON.stringify(urlOrBody ?? {}),
    };
  }

  const res = await fetch(url, fetchOptions);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as EscrowResult;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEscrow() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Wraps an async operation with loading/error state management.
   * Reduces repetitive try/catch/finally across all three operations.
   */
  async function withLoadingState(
    operation: () => Promise<EscrowResult>,
    errorMessage: string,
  ): Promise<EscrowResult | null> {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  /** Create a new escrow transaction on Escrow.com sandbox. */
  const createEscrow = (params: CreateEscrowParams) =>
    withLoadingState(
      () => callEdgeFn("escrow-create", "POST", params as unknown as Record<string, unknown>),
      "Failed to create escrow.",
    );

  /** Fetch the current status of an existing escrow transaction. */
  const checkEscrowStatus = (escrowId: string) =>
    withLoadingState(
      () => callEdgeFn(
        "escrow-status",
        "GET",
        `${edgeFnUrl("escrow-status")}?escrowId=${encodeURIComponent(escrowId)}`,
      ),
      "Failed to check escrow status.",
    );

  /** Execute the release flow (ship → receive → accept) on Escrow.com. */
  const releaseEscrow = (params: ReleaseEscrowParams) =>
    withLoadingState(
      () => callEdgeFn("escrow-release", "POST", params as unknown as Record<string, unknown>),
      "Failed to release escrow funds.",
    );

  return { createEscrow, checkEscrowStatus, releaseEscrow, isLoading, error };
}
