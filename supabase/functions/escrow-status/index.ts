/**
 * escrow-status Edge Function
 *
 * Fetches the current status of an Escrow.com transaction.
 * The ESCROW_API_KEY and ESCROW_PLATFORM_EMAIL are server-side only.
 *
 * Endpoint: GET https://api.escrow.com/2017-09-01/transaction/{id}
 * Auth:     Basic base64(ESCROW_PLATFORM_EMAIL:ESCROW_API_KEY)
 *
 * Expected query param: ?escrowId=<transaction_id>
 *
 * Returns:
 *   {
 *     escrowId,        – the transaction ID
 *     status,          – simplified frontend status string
 *     itemStatus,      – raw Escrow.com item-level boolean flags
 *     scheduleStatus,  – raw Escrow.com schedule-level status (secured, etc.)
 *     parties,         – array of { role, customer, agreed }
 *     paymentUrl,      – URL for buyer to fund (if not yet funded)
 *     description,     – transaction description
 *     currency,        – transaction currency
 *     escrowItemId     – the Escrow.com item ID
 *   }
 *
 * Status mapping (derived from Escrow.com boolean flags):
 *   canceled items[0].status.canceled === true     → "cancelled"
 *   rejected  items[0].status.rejected === true    → "rejected"
 *   accepted  items[0].status.accepted === true    → "released"
 *   received  items[0].status.received === true    → "in_inspection"
 *   shipped   items[0].status.shipped === true     → "shipped"
 *   secured   schedule[0].status.secured === true  → "funded"
 *   allAgreed all parties[].agreed === true        → "awaiting_payment"
 *   else                                           → "awaiting_agreement"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Escrow.com API base URL — reads from env to allow sandbox/production switching
// Set ESCROW_API_BASE_URL in Supabase secrets:
//   Sandbox:    https://api.escrow-sandbox.com/2017-09-01 (default)
//   Production: https://api.escrow.com/2017-09-01
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

/**
 * Derive a simple frontend status string from Escrow.com's per-item boolean flags.
 * Escrow.com has NO top-level status field — status lives on items[].status and
 * items[].schedule[].status as boolean flags.
 *
 * Priority order (first match wins):
 *   canceled → rejected → accepted (released) → received (inspection) →
 *   shipped → secured (funded) → all agreed (awaiting payment) → awaiting agreement
 */
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

    // Get escrowId from query string
    const url = new URL(req.url);
    const escrowId = url.searchParams.get("escrowId");
    if (!escrowId) {
      return jsonResponse({ error: "Missing required query param: escrowId." }, 400);
    }

    // ── Enforce Identity & Ownership securely ────────────────────────────────
    const { data: payment, error: pError } = await supabaseAdmin
      .from("payments")
      .select("payer_id, payee_id")
      .eq("escrow_id", escrowId)
      .single();

    if (pError || !payment) {
      return jsonResponse({ error: "Payment record not found for this Escrow ID." }, 404);
    }

    if (user.id !== payment.payer_id && user.id !== payment.payee_id) {
       return jsonResponse({ error: "Unauthorized: You are not a party to this transaction." }, 403);
    }

    // ── Call Escrow.com sandbox API ──────────────────────────────────────────
    // GET /transaction/{id}
    // Auth: Basic base64(platform_email:api_key)
    const basicAuth = btoa(`${escrowPlatformEmail}:${escrowApiKey}`);

    console.log(`[escrow-status] Fetching transaction ${escrowId}`);

    const escrowRes = await fetch(
      `${ESCROW_API_BASE_URL}/transaction/${encodeURIComponent(escrowId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`,
        },
      },
    );

    if (!escrowRes.ok) {
      const errText = await escrowRes.text();
      console.error("[escrow-status] Escrow.com error:", escrowRes.status, errText);
      return jsonResponse(
        { error: `Escrow.com error (${escrowRes.status}): ${errText}` },
        502,
      );
    }

    // ── Parse Escrow.com response ───────────────────────────────────────────
    // Response shape:
    //   {
    //     id: number,
    //     description: string,
    //     currency: string,
    //     items: [{
    //       id: number,
    //       status: { shipped, received, accepted, rejected, canceled, ... },  ← all booleans
    //       schedule: [{ amount, status: { secured: boolean }, ... }],
    //       ...
    //     }],
    //     parties: [{ role, customer, agreed: boolean }],
    //   }
    //
    // There is NO top-level "status" field.
    const data = await escrowRes.json();

    // Extract per-item status booleans
    const itemStatus: Record<string, boolean> = data.items?.[0]?.status ?? {};
    const scheduleStatus: Record<string, boolean> = data.items?.[0]?.schedule?.[0]?.status ?? {};
    const escrowItemId: string = data.items?.[0]?.id ? String(data.items[0].id) : "";

    // Extract party info
    const parties = (data.parties ?? []).map((p: Record<string, unknown>) => ({
      role: p.role,
      customer: p.customer,
      agreed: p.agreed,
    }));
    const allAgreed = parties.length > 0 && parties.every((p: { agreed: unknown }) => p.agreed === true);

    // Derive simplified status
    const status = deriveStatus(itemStatus, scheduleStatus, allAgreed);

    // Payment URL (for buyer to fund if not yet secured) — respects sandbox/production env
    const escrowWebDomain = ESCROW_API_BASE_URL.replace("api.", "www.").replace("/2017-09-01", "");
    const paymentUrl = `${escrowWebDomain}/transactions/${escrowId}/payment`;

    console.log(`[escrow-status] Transaction ${escrowId}: status=${status}, item=${JSON.stringify(itemStatus)}, secured=${scheduleStatus.secured}`);

    return jsonResponse({
      escrowId,
      escrowItemId,
      status,
      itemStatus,
      scheduleStatus,
      parties,
      paymentUrl,
      description: data.description ?? "",
      currency: data.currency ?? "",
    });
  } catch (err: unknown) {
    console.error("[escrow-status] Unexpected:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "An unexpected error occurred." }, 500);
  }
});
