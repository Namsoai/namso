import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  try {
    // Optionally verify webhook signature using Svix using RESEND_WEBHOOK_SECRET
    // For now, we trust the incoming shape and secure the route at the project level
    
    const payload = await req.json();
    console.log(`[resend-webhook] Received type: ${payload.type}`);

    const resendMsgId = payload.data?.email_id;
    if (!resendMsgId) {
      return new Response(JSON.stringify({ error: "Missing email_id" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    let newStatus = "sent";
    let errorMsg = null;
    let deliveredAt = null;

    if (payload.type === "email.delivered") {
      newStatus = "delivered";
      deliveredAt = new Date().toISOString();
    } else if (payload.type === "email.bounced") {
      newStatus = "bounced";
      errorMsg = "Bounced: " + (payload.data?.reason || "Unknown reason");
    } else if (payload.type === "email.complained") {
      newStatus = "bounced";
      errorMsg = "Complaint filed by user";
    }

    if (newStatus === "delivered" || newStatus === "bounced") {
      const { error } = await supabaseAdmin
        .from("notification_deliveries")
        .update({ 
          status: newStatus,
          error: errorMsg,
          delivered_at: deliveredAt,
          updated_at: new Date().toISOString()
        })
        .eq("provider_message_id", resendMsgId);

      if (error) {
        console.error("[resend-webhook] DB Update Error:", error);
      } else {
        console.log(`[resend-webhook] Ledger updated to ${newStatus} for msg ${resendMsgId}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[resend-webhook] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
