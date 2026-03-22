import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const escrowApiKey = Deno.env.get("ESCROW_API_KEY");
    const escrowPlatformEmail = Deno.env.get("ESCROW_PLATFORM_EMAIL");

    if (!supabaseUrl || !serviceRoleKey || !escrowApiKey || !escrowPlatformEmail) {
      return jsonResponse({ error: "Server misconfigured." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let payload: any = {};
    try {
      if (req.body) {
         payload = await req.json();
      }
    } catch(e) { 
         // ignore parsing err if totally empty body
    }
    
    // Accept transaction_id from JSON payload, or try query params as fallback
    let escrowId = payload.transaction_id || payload.escrow_id;
    if (!escrowId) {
      const url = new URL(req.url);
      escrowId = url.searchParams.get("transaction_id") || url.searchParams.get("escrowId");
    }

    if (!escrowId) {
      return jsonResponse({ error: "Missing transaction_id in webhook payload" }, 400);
    }

    escrowId = String(escrowId);

    console.log(`[escrow-webhook] Received ping for ${escrowId}`);

    // Call Escrow API actively to verify real state, ignoring webhook payload data entirely to prevent spoofing
    const basicAuth = btoa(`${escrowPlatformEmail}:${escrowApiKey}`);
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
        return jsonResponse({ error: "Escrow.com API fetch failed." }, 502);
    }

    const data = await escrowRes.json();
    const itemStatus: Record<string, boolean> = data.items?.[0]?.status ?? {};
    const scheduleStatus: Record<string, boolean> = data.items?.[0]?.schedule?.[0]?.status ?? {};
    const parties = (data.parties ?? []).map((p: any) => ({
      role: p.role,
      customer: p.customer,
      agreed: p.agreed,
    }));
    const allAgreed = parties.length > 0 && parties.every((p: any) => p.agreed === true);

    const derivedEscrowStatus = deriveStatus(itemStatus, scheduleStatus, allAgreed);

    // Map `derivedEscrowStatus` to `payments.status` enum 
    let paymentStatus = "pending";
    if (derivedEscrowStatus === "funded" || derivedEscrowStatus === "shipped" || derivedEscrowStatus === "in_inspection") {
        paymentStatus = "held";
    } else if (derivedEscrowStatus === "released") {
        paymentStatus = "released";
    } else if (derivedEscrowStatus === "cancelled" || derivedEscrowStatus === "rejected") {
        paymentStatus = "failed";
    }

    // Fetch existing payment status and ID to explicitly prevent backwards regressions and build audit logs
    const { data: currPayment, error: fetchErr } = await supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('escrow_id', escrowId)
        .single();
        
    if (fetchErr || !currPayment) {
        return jsonResponse({ error: "Linked payment entity not found" }, 404);
    }
    
    // Strict forward-only transition matrix
    const currentStatus = currPayment.status;
    const paymentId = currPayment.id;
    
    // Audit logging helper
    const logAudit = async (accepted: boolean, reason: string) => {
        await supabaseAdmin.from('escrow_audit_logs').insert({
            transaction_id: escrowId,
            payment_id: paymentId,
            old_status: currentStatus,
            requested_new_status: paymentStatus,
            accepted,
            reason
        });
    };
    const allowedTransitions: Record<string, string[]> = {
      "pending": ["held", "failed", "cancelled"],
      "held": ["released", "failed", "cancelled", "refunded", "disputed"],
      "released": [],
      "failed": [],
      "cancelled": [],
      "refunded": [],
      "disputed": ["released", "refunded"]
    };

    if (currentStatus !== paymentStatus) {
        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(paymentStatus)) {
            console.warn(`[escrow-webhook] Blocked illegal regression from ${currentStatus} to ${paymentStatus}`);
            await logAudit(false, "Blocked invalid state regression");
            return jsonResponse({ success: true, warning: "Ignored invalid regression state" }, 200);
        }
    }

    // Attempt idempotent update inside Postgres
    const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({ 
             escrow_status: derivedEscrowStatus,
             status: paymentStatus,
             updated_at: new Date().toISOString()
        })
        .eq('escrow_id', escrowId);

    if (updateError) {
        console.error("[escrow-webhook] Database update failed:", updateError);
        await logAudit(false, "Database Postgres update failure");
        return jsonResponse({ error: "Failed to sync Database schema bounds" }, 500);
    }

    await logAudit(true, `Successfully mapped external Escrow flag ${derivedEscrowStatus}`);

    console.log(`[escrow-webhook] Successfully mapped ${escrowId} to ${derivedEscrowStatus}`);
    return jsonResponse({ success: true, escrow_id: escrowId, synced_status: derivedEscrowStatus });
  } catch (err: any) {
    console.error("[escrow-webhook] Critical Error:", err);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
});
