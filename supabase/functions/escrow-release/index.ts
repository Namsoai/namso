/**
 * escrow-release Edge Function
 *
 * Releases funds from Escrow.com to the seller/freelancer.
 * The ESCROW_API_KEY and ESCROW_PLATFORM_EMAIL are server-side only.
 *
 * Escrow.com has NO single "release" action. Releasing funds requires up to
 * 3 sequential PATCH calls on the same endpoint:
 *
 *   Step 1: { "action": "ship" }    — mark items as delivered (as seller)
 *   Step 2: { "action": "receive" } — confirm receipt (as buyer)
 *   Step 3: { "action": "accept" }  — accept items → triggers auto-disburse (as buyer)
 *
 * Each step is skipped if the item already has that status flag set to true
 * (e.g., if the seller already shipped, step 1 is skipped).
 *
 * IMPORTANT: The "accept" action CANNOT be performed by a partner on behalf of
 * the buyer (Escrow.com restriction). If step 3 fails, the function still
 * succeeds with a partial status — the inspection_period auto-accept will
 * release funds automatically after 3 days.
 *
 * Endpoint: PATCH https://api.escrow-sandbox.com/2017-09-01/transaction/{id}
 * Auth:     Basic base64(ESCROW_PLATFORM_EMAIL:ESCROW_API_KEY)
 *
 * Expected request body (from frontend):
 *   { escrowId, paymentId, buyerEmail, sellerEmail }
 *
 * Returns:
 *   {
 *     escrowId, status, steps: { ship, receive, accept },
 *     itemStatus, scheduleStatus, parties
 *   }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Escrow.com API base URL — reads from env to allow sandbox/production switching
const ESCROW_API_BASE_URL = Deno.env.get("ESCROW_API_BASE_URL") ?? "https://api.escrow-sandbox.com/2017-09-01";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Derive a simple status string from Escrow.com item boolean flags. */
function deriveStatus(
  itemStatus: Record<string, boolean>,
  scheduleStatus: Record<string, boolean>,
  allAgreed: boolean,
): string {
  if (itemStatus.canceled)  return "cancelled";
  if (itemStatus.rejected)  return "rejected";
  if (itemStatus.accepted)  return "released";
  if (itemStatus.received)  return "in_inspection";
  if (itemStatus.shipped)   return "shipped";
  if (scheduleStatus.secured) return "funded";
  if (allAgreed)            return "awaiting_payment";
  return "awaiting_agreement";
}

/**
 * Perform one PATCH action on an Escrow.com transaction.
 * Returns { ok, data?, error? }.
 */
async function performAction(
  escrowId: string,
  action: string,
  basicAuth: string,
  asCustomer?: string,
): Promise<{ ok: boolean; data?: unknown; error?: string; httpStatus?: number }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${basicAuth}`,
  };
  // As-Customer header lets approved partners act on behalf of a party
  if (asCustomer) {
    headers["As-Customer"] = asCustomer;
  }

  const res = await fetch(
    `${ESCROW_API_BASE_URL}/transaction/${encodeURIComponent(escrowId)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: errText, httpStatus: res.status };
  }

  const data = await res.json();
  return { ok: true, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const escrowApiKey = Deno.env.get("ESCROW_API_KEY");
    const escrowPlatformEmail = Deno.env.get("ESCROW_PLATFORM_EMAIL");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Server misconfigured: missing Supabase env vars." }, 500);
    }
    if (!escrowApiKey) {
      return jsonResponse({ error: "Server misconfigured: ESCROW_API_KEY not set." }, 500);
    }
    if (!escrowPlatformEmail) {
      return jsonResponse({ error: "Server misconfigured: ESCROW_PLATFORM_EMAIL not set." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Auth: verify caller is a logged-in user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized: missing Authorization header." }, 401);
    }
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized: invalid token." }, 401);
    }

    // ── Parse and validate body ─────────────────────────────────────────────
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body." }, 400);
    }

    const RequestSchema = z.object({
      escrowId: z.string().min(1),
      paymentId: z.string().uuid()
    });

    const parseResult = RequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return jsonResponse({ error: "Invalid payload.", issues: parseResult.error.issues }, 400);
    }
    const { escrowId, paymentId } = parseResult.data;

    // ── Fetch authoritative database sources ────────────────────────────────
    const { data: payment, error: pError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("escrow_id", escrowId)
      .single();

    if (pError || !payment) {
      return jsonResponse({ error: "Payment record not found or escrow ID mismatch." }, 404);
    }

    const isBuyer = user.id === payment.payer_id;
    const isSeller = user.id === payment.payee_id;

    if (!isBuyer && !isSeller) {
      return jsonResponse({ error: "Unauthorized: You do not own this transaction." }, 403);
    }

    // Lookup real emails from auth identities
    const { data: buyerObj } = await supabaseAdmin.auth.admin.getUserById(payment.payer_id);
    const { data: sellerObj } = await supabaseAdmin.auth.admin.getUserById(payment.payee_id);
    const buyerEmail = buyerObj?.user?.email;
    const sellerEmail = sellerObj?.user?.email;

    if (!buyerEmail || !sellerEmail) {
       return jsonResponse({ error: "Missing validated user emails for parties." }, 400);
    }

    const basicAuth = btoa(`${escrowPlatformEmail}:${escrowApiKey}`);

    // ── Step 0: Fetch current status to skip already-completed steps ────────
    console.log(`[escrow-release] Starting release flow for transaction ${escrowId}`);

    const statusRes = await fetch(
      `${ESCROW_API_BASE_URL}/transaction/${encodeURIComponent(escrowId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`,
        },
      },
    );

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      console.error("[escrow-release] Failed to fetch transaction:", errText);
      return jsonResponse({ error: `Failed to fetch transaction status: ${statusRes.status}` }, 502);
    }

    const txnData = await statusRes.json();
    const currentItemStatus: Record<string, boolean> = txnData.items?.[0]?.status ?? {};

    // Track step results for the response
    const steps: Record<string, { executed: boolean; skipped: boolean; ok: boolean; error?: string }> = {
      ship:    { executed: false, skipped: false, ok: false },
      receive: { executed: false, skipped: false, ok: false },
      accept:  { executed: false, skipped: false, ok: false },
    };

    // ── Step 1: Ship (as seller) ────────────────────────────────────────────
    if (currentItemStatus.shipped || currentItemStatus.received || currentItemStatus.accepted) {
      console.log("[escrow-release] Step 1 (ship): already done, skipping");
      steps.ship = { executed: false, skipped: true, ok: true };
    } else {
      if (!isSeller) {
         console.warn("[escrow-release] Caller is buyer attempting to trigger ship. Forbidden. Skipping.");
         return jsonResponse({ error: "You cannot mark an item shipped as the buyer." }, 403);
      }
      console.log(`[escrow-release] Step 1 (ship): executing as seller (${sellerEmail})`);
      const shipResult = await performAction(escrowId, "ship", basicAuth, sellerEmail);
      steps.ship = { executed: true, skipped: false, ok: shipResult.ok, error: shipResult.error };
      if (!shipResult.ok) {
        console.error("[escrow-release] Step 1 (ship) failed:", shipResult.httpStatus, shipResult.error);
        return jsonResponse({
          escrowId,
          status: "ship_failed",
          steps,
          error: `Ship action failed (${shipResult.httpStatus}): ${shipResult.error}`,
        }, 502);
      }
      console.log("[escrow-release] Step 1 (ship): success");
    }

    // ── Step 2: Receive (as buyer) ──────────────────────────────────────────
    if (currentItemStatus.received || currentItemStatus.accepted) {
      console.log("[escrow-release] Step 2 (receive): already done, skipping");
      steps.receive = { executed: false, skipped: true, ok: true };
    } else {
      if (!isBuyer) {
         console.warn("[escrow-release] Caller is seller attempting to trigger receive. Forbidden. Skipping.");
         return jsonResponse({ error: "You cannot mark an item received as the seller." }, 403);
      }
      console.log(`[escrow-release] Step 2 (receive): executing as buyer (${buyerEmail})`);
      const receiveResult = await performAction(escrowId, "receive", basicAuth, buyerEmail);
      steps.receive = { executed: true, skipped: false, ok: receiveResult.ok, error: receiveResult.error };
      if (!receiveResult.ok) {
        console.error("[escrow-release] Step 2 (receive) failed:", receiveResult.httpStatus, receiveResult.error);
        return jsonResponse({
          escrowId,
          status: "receive_failed",
          steps,
          error: `Receive action failed (${receiveResult.httpStatus}): ${receiveResult.error}`,
        }, 502);
      }
      console.log("[escrow-release] Step 2 (receive): success");
    }

    // ── Step 3: Accept (as buyer) ───────────────────────────────────────────
    if (currentItemStatus.accepted) {
      console.log("[escrow-release] Step 3 (accept): already done, skipping");
      steps.accept = { executed: false, skipped: true, ok: true };
    } else {
      if (!isBuyer) {
         console.warn("[escrow-release] Caller is seller attempting to accept. Forbidden. Returning early.");
         // We do not fail the request if it's just the seller marking shipped. They are just finishing stage 1.
      } else {
        console.log(`[escrow-release] Step 3 (accept): attempting as buyer (${buyerEmail})`);
        const acceptResult = await performAction(escrowId, "accept", basicAuth, buyerEmail);
        steps.accept = { executed: true, skipped: false, ok: acceptResult.ok, error: acceptResult.error };
        if (!acceptResult.ok) {
          console.warn(`[escrow-release] Step 3 (accept) failed (expected if partner account): ${acceptResult.httpStatus}`, acceptResult.error);
        } else {
          console.log("[escrow-release] Step 3 (accept): success — funds will be disbursed");
        }
      }
    }

    // ── Fetch final status ──────────────────────────────────────────────────
    const finalRes = await fetch(
      `${ESCROW_API_BASE_URL}/transaction/${encodeURIComponent(escrowId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`,
        },
      },
    );

    let finalItemStatus: Record<string, boolean> = {};
    let finalScheduleStatus: Record<string, boolean> = {};
    let finalParties: Array<{ role: string; customer: string; agreed: boolean }> = [];
    let finalDerivedStatus = "unknown";

    if (finalRes.ok) {
      const finalData = await finalRes.json();
      finalItemStatus = finalData.items?.[0]?.status ?? {};
      finalScheduleStatus = finalData.items?.[0]?.schedule?.[0]?.status ?? {};
      finalParties = (finalData.parties ?? []).map((p: Record<string, unknown>) => ({
        role: p.role,
        customer: p.customer,
        agreed: p.agreed,
      }));
      const allAgreed = finalParties.length > 0 && finalParties.every((p) => p.agreed === true);
      finalDerivedStatus = deriveStatus(finalItemStatus, finalScheduleStatus, allAgreed);
    }

    // ── Update the payment record in Supabase ───────────────────────────────
    // If accepted (released), mark as "released". If only received/shipped, mark as "held".
    const dbStatus = finalItemStatus.accepted ? "released" : "held";
    const { error: dbError } = await supabaseAdmin
      .from("payments")
      .update({ status: dbStatus })
      .eq("id", paymentId);

    if (dbError) {
      // FATAL: Escrow.com shows released but our DB still shows 'held' — desynchronized.
      // Return 500 so the caller knows the outcome, and log for manual reconciliation.
      console.error(`[escrow-release] CRITICAL — DB desync for payment ${paymentId} / escrow ${escrowId}: ${dbError.message}`);
      return jsonResponse({
        error: "Funds were released on Escrow.com but the payment record could not be updated. Contact support.",
        escrow_id: escrowId,
        payment_id: paymentId,
        escrow_status: finalDerivedStatus,
      }, 500);
    }

    console.log(`[escrow-release] Complete: escrowId=${escrowId}, status=${finalDerivedStatus}, dbStatus=${dbStatus}`);

    return jsonResponse({
      escrowId,
      status: finalDerivedStatus,
      steps,
      itemStatus: finalItemStatus,
      scheduleStatus: finalScheduleStatus,
      parties: finalParties,
      // If accept failed, note that auto-release will occur after inspection period
      ...(steps.accept.executed && !steps.accept.ok
        ? {
            note: "The 'accept' action could not be performed (Escrow.com restricts this for partner accounts). Funds will be released automatically after the inspection period (3 days) unless the buyer rejects.",
          }
        : {}),
    });
  } catch (err: unknown) {
    console.error("[escrow-release] Unexpected:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "An unexpected error occurred." }, 500);
  }
});
