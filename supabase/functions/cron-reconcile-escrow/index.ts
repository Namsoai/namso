import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// A basic JSON response helper
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Mock API Gateway payload for Stripe/Escrow.com
 * In production, this would `fetch("https://api.stripe.com/v1/payment_intents/...")`
 */
async function fetchRemoteGatewayState(paymentId: string) {
  // Simulate network
  await new Promise(r => setTimeout(r, 200));
  
  // For demonstration, we simply pretend the remote gateway says "succeeded" (funded)
  // or "requires_payment_method" (pending) dynamically based on the UUID to simulate drift.
  const hash = paymentId.charCodeAt(0);
  if (hash % 3 === 0) return "succeeded"; // Mock: funds actually cleared!
  if (hash % 3 === 1) return "canceled";
  return "pending";
}

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Only execute if explicitly called by Cron or manually forced by UI
    if (!payload.cron && !payload.force_sync) {
      return jsonResponse({ message: "Sync ignored: Must be triggered via CRON payload or explicit force." }, 200);
    }

    console.log("[cron-reconcile-escrow] Wake up. Scanning for volatile trapped states...");

    // 1. Identify Stuck Rows
    // We look for payments trapped in "pending" status for > 15 minutes.
    // The webhook might have dropped, or the user abandoned checkout.
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
    
    const { data: stuckPayments, error: fetchErr } = await supabaseAdmin
      .from("payments")
      .select("id, status, updated_at")
      .eq("status", "pending")
      .lt("updated_at", fifteenMinsAgo)
      .limit(50); // Batch cap

    if (fetchErr || !stuckPayments) {
      return jsonResponse({ error: "Failed to pull stuck states." }, 500);
    }

    if (stuckPayments.length === 0) {
      return jsonResponse({ message: "Architecture is perfectly reconciled. Zero trapped operations found." }, 200);
    }

    console.log(`[cron-reconcile-escrow] Found ${stuckPayments.length} volatile pending escrows to verify.`);

    const results = [];

    // 2. Diff Local vs Remote Sequence
    for (const payment of stuckPayments) {
      const localState = payment.status;
      let remoteStateStr;
      
      try {
        remoteStateStr = await fetchRemoteGatewayState(payment.id);
      } catch (err: any) {
        // Network timeout fetching remote state
        await supabaseAdmin.from("reconciliation_logs").insert({
          payment_id: payment.id,
          local_state: localState,
          action_taken: 'ABORTED',
          error: `Network failure contacting Gateway API: ${err.message}`
        });
        results.push({ id: payment.id, status: 'error' });
        continue;
      }

      // 3. Compare and Reconcile gracefully
      // Warning: We adhere to the User's strict directive: "Do not auto-resolve every mismatch blindly. apply safe transition or log mismatch for operator review"
      
      if (localState === 'pending' && remoteStateStr === 'succeeded') {
        // Mismatch! The gateway actually secured the money, but our DB missed the webhook.
        // It is SAFE to auto-transition this forward to `funded` strictly via the Audit logger
        
        // Actually, we should ideally invoke our payment RPC, but for reconciliation, we might just flag it
        // and allow operators to click "Force Sync" in the UI. We will flag it.
        const { error: logErr } = await supabaseAdmin.from("reconciliation_logs").insert({
          payment_id: payment.id,
          local_state: localState,
          remote_state: remoteStateStr,
          action_taken: 'LOGGED_MISMATCH_ONLY',
          error: 'Critical drift detected: Remote Gateway reports Funds Secured.'
        });
        
        results.push({ id: payment.id, resolution: 'logged_for_review', drift: true });

      } else if (localState === 'pending' && remoteStateStr === 'canceled') {
        // Safe to kill
        await supabaseAdmin.from("reconciliation_logs").insert({
          payment_id: payment.id,
          local_state: localState,
          remote_state: remoteStateStr,
          action_taken: 'LOGGED_MISMATCH_ONLY',
          error: 'API reports Escrow interaction formally canceled.'
        });
        results.push({ id: payment.id, resolution: 'logged_for_review', drift: true });

      } else {
        // No drift. It's just a legitimately abandoned checkout sitting in pending.
        await supabaseAdmin.from("reconciliation_logs").insert({
          payment_id: payment.id,
          local_state: localState,
          remote_state: remoteStateStr,
          action_taken: 'VERIFIED_CLEAN',
          error: null
        });
        results.push({ id: payment.id, resolution: 'verified_clean', drift: false });
      }
    }

    return jsonResponse({ message: "Reconciliation cycle complete.", results }, 200);

  } catch (error: any) {
    console.error("[cron-reconcile-escrow] Fatal Exception:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
