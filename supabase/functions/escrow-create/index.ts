/**
 * escrow-create Edge Function
 *
 * Creates an escrow transaction on Escrow.com sandbox.
 * The ESCROW_API_KEY and ESCROW_PLATFORM_EMAIL are server-side only.
 *
 * Endpoint: POST https://api.escrow-sandbox.com/2017-09-01/transaction
 * Auth:     Basic base64(ESCROW_PLATFORM_EMAIL:ESCROW_API_KEY)
 *
 * Expected request body (from frontend):
 *   { taskId, paymentId, amount, currency, buyerEmail, sellerEmail, description }
 *
 * Note: For testing, the escrow amount is hardcoded to 1 EUR regardless of `amount`.
 *       Remove the override once ready for production.
 *
 * Returns:
 *   { escrowId, escrowItemId, status, paymentUrl, parties, itemStatus, scheduleStatus }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: verify caller is a logged-in user ─────────────────────────────
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
      taskId: z.string().uuid(),
      paymentId: z.string().uuid(),
      currency: z.enum(["EUR", "USD", "GBP"]).optional().default("EUR"),
      deliveryTime: z.object({
        value: z.number().optional(),
        unit: z.string().optional()
      }).optional(),
    });

    const parseResult = RequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return jsonResponse({ error: "Invalid payload.", issues: parseResult.error.issues }, 400);
    }
    const { taskId, paymentId, currency, deliveryTime } = parseResult.data;

    // ── Fetch DB Authoritative Sources ──────────────────────────────────────
    const { data: payment, error: pError } = await supabaseAdmin
      .from("payments")
      .select("*, task:tasks(*)")
      .eq("id", paymentId)
      .single();

    if (pError || !payment) {
      return jsonResponse({ error: "Payment not found or invalid ID." }, 404);
    }
    if (payment.payer_id !== user.id) {
       return jsonResponse({ error: "Unauthorized: Only the task owner can fund this escrow." }, 403);
    }
    if (payment.status !== "pending" && payment.status !== "held") {
       return jsonResponse({ error: "Illegal state transition. Payment is not awaiting escrow." }, 400);
    }
    if (payment.escrow_id) {
       return jsonResponse({ error: "Idempotency failed: Escrow is already generated for this payment." }, 400);
    }

    // Explicitly verify emails via absolute administrative identity
    const { data: buyerObj } = await supabaseAdmin.auth.admin.getUserById(payment.payer_id);
    const { data: sellerObj } = await supabaseAdmin.auth.admin.getUserById(payment.payee_id);
    const buyerEmail = buyerObj?.user?.email;
    const sellerEmail = sellerObj?.user?.email;

    if (!buyerEmail || !sellerEmail) {
       return jsonResponse({ error: "Missing validated user emails for parties." }, 400);
    }

    const description = payment.task?.title ? `Task Payment: ${payment.task.title}` : `Payment for task ${taskId}`;
    const dbAmount = Number(payment.amount);

    // ── Pre-compute and Map Currency ─────────────────────────────────────────
    const currencyMap: Record<string, string> = {
      EUR: "euro",
      USD: "usd",
      GBP: "gbp",
    };
    const reqCurrency = currency ? currencyMap[currency.toUpperCase()] || "euro" : "euro";
    
    // Enforce static exchange rates exactly as the frontend
    let computedAmount = dbAmount;
    if (reqCurrency === "usd") computedAmount *= 1.08;
    if (reqCurrency === "gbp") computedAmount *= 0.85;

    // Delivery time mapping for inspection period (default 3 days = 259200 seconds)
    // Escrow.com requires seconds
    let inspectionPeriod = 259200; 
    if (deliveryTime && deliveryTime.value) {
      inspectionPeriod = deliveryTime.value * 24 * 60 * 60; // Convert days to seconds
    }

    // Amount MUST be rounded to 2 decimals
    const escrowAmount = Math.round(computedAmount * 100) / 100;
    const escrowCurrency = reqCurrency;

    const escrowPayload = {
      parties: [
        {
          role: "buyer",
          customer: buyerEmail,
        },
        {
          role: "seller",
          customer: sellerEmail,
        },
      ],
      currency: escrowCurrency,
      description: description ?? `Payment for task ${taskId}`,
      items: [
        {
          title: description ?? `Task ${taskId}`,
          description: description ?? "AI marketplace task delivery",
          type: "general_merchandise",
          inspection_period: inspectionPeriod,
          quantity: 1,
          schedule: [
            {
              amount: escrowAmount,
              payer_customer: buyerEmail,
              beneficiary_customer: sellerEmail,
            },
          ],
        },
      ],
    };

    // ── Call Escrow.com sandbox API ──────────────────────────────────────────
    // Auth: Basic base64(platform_email:api_key)
    // The platform account authenticates — NOT the buyer/seller.
    const basicAuth = btoa(`${escrowPlatformEmail}:${escrowApiKey}`);

    console.log(`[escrow-create] Creating transaction for task=${taskId}, buyer=${buyerEmail}, seller=${sellerEmail}, amount=${escrowAmount} ${escrowCurrency}`);

    const escrowRes = await fetch(`${ESCROW_API_BASE_URL}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify(escrowPayload),
    });

    if (!escrowRes.ok) {
      const errText = await escrowRes.text();
      console.error("[escrow-create] Escrow.com error:", escrowRes.status, errText);
      return jsonResponse(
        { error: `Escrow.com error (${escrowRes.status}): ${errText}` },
        502
      );
    }

    // ── Parse Escrow.com response ───────────────────────────────────────────
    // Escrow.com returns HTTP 201 on success.
    // Response shape (key fields):
    //   {
    //     id: number,                          ← transaction ID
    //     items: [{ id: number, status: { shipped, received, accepted, ... }, schedule: [{ status: { secured } }] }],
    //     parties: [{ customer, agreed, role }],
    //     currency, description, creation_date
    //   }
    // There is NO top-level "status" field. Status is derived from per-item booleans.
    const escrowData = await escrowRes.json();

    const escrowId: string = String(escrowData.id ?? "");
    if (!escrowId || escrowId === "") {
      console.error("[escrow-create] No transaction ID in response:", JSON.stringify(escrowData));
      return jsonResponse({ error: "Escrow.com did not return a transaction ID." }, 502);
    }

    // Extract the item ID (needed for per-item actions later)
    const escrowItemId: string = escrowData.items?.[0]?.id
      ? String(escrowData.items[0].id)
      : "";

    // Extract status booleans from the first item
    const itemStatus = escrowData.items?.[0]?.status ?? {};
    const scheduleStatus = escrowData.items?.[0]?.schedule?.[0]?.status ?? {};
    const partiesInfo = (escrowData.parties ?? []).map((p: Record<string, unknown>) => ({
      role: p.role,
      customer: p.customer,
      agreed: p.agreed,
    }));

    // Derive a simple status for our frontend
    // On creation: no party has funded, seller hasn't shipped — status is "awaiting_agreement"
    // (because seller needs to agree before buyer can fund)
    const allAgreed = partiesInfo.every((p: { agreed: unknown }) => p.agreed === true);
    let derivedStatus = "awaiting_agreement";
    if (itemStatus.accepted) derivedStatus = "released";
    else if (itemStatus.received) derivedStatus = "in_inspection";
    else if (itemStatus.shipped) derivedStatus = "shipped";
    else if (scheduleStatus.secured) derivedStatus = "funded";
    else if (allAgreed) derivedStatus = "awaiting_payment";

    // Construct the buyer payment URL — derived from ESCROW_API_BASE_URL so sandbox/production is respected
    const escrowWebDomain = ESCROW_API_BASE_URL.replace("api.", "www.").replace("/2017-09-01", "");
    const paymentUrl = `${escrowWebDomain}/transactions/${escrowId}/payment`;

    console.log(`[escrow-create] Transaction created: id=${escrowId}, itemId=${escrowItemId}, status=${derivedStatus}`);

    // ── Persist escrow_id on the payment row ──────────────────────────────
    const { error: dbError } = await supabaseAdmin
      .from("payments")
      .update({ escrow_id: escrowId, status: "held" })
      .eq("id", paymentId);

    if (dbError) {
      // FATAL: the escrow was created on Escrow.com but we cannot persist the reference.
      // Return 500 with the orphaned escrowId so support can manually reconcile.
      console.error(`[escrow-create] CRITICAL — orphaned escrow ${escrowId}: ${dbError.message}`);
      return jsonResponse({
        error: "Escrow was created on Escrow.com but could not be saved. Contact support.",
        orphaned_escrow_id: escrowId,
      }, 500);
    }

    return jsonResponse({
      escrowId,
      escrowItemId,
      status: derivedStatus,
      paymentUrl,
      parties: partiesInfo,
      itemStatus,
      scheduleStatus,
    }, 201);
  } catch (err: unknown) {
    console.error("[escrow-create] Unexpected:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "An unexpected error occurred." }, 500);
  }
});
