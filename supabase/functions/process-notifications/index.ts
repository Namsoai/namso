import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

// A basic HTML response helper
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Namso <onboarding@resend.dev>";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  try {
    const payload = await req.json();

    // Support both Supabase Database Webhooks and direct Edge Function invokes
    // A DB Webhook will have `type`, `record`, `table`.
    let deliveryId: string | undefined;

    if (payload.type === "INSERT" && payload.table === "notification_deliveries") {
      deliveryId = payload.record?.id;
    } else if (payload.deliveryId) {
      deliveryId = payload.deliveryId;
    }

    if (!deliveryId) {
      return jsonResponse({ error: "Missing delivery ID." }, 400);
    }

    // 1. Idempotency Lock: Atomically claim the delivery row
    const { data: delivery, error: lockErr } = await supabaseAdmin
      .from("notification_deliveries")
      .update({ status: "processing", attempted_at: new Date().toISOString() })
      .eq("id", deliveryId)
      .eq("status", "pending")
      .select()
      .single();

    if (lockErr || !delivery) {
      console.log(`[process-notifications] Delivery ${deliveryId} skipped (already processing/sent)`);
      return jsonResponse({ message: "Skipped or already claimed" }, 200);
    }

    // 2. Fetch Notification and User Preferences
    // We join the profiles table, and then join notification_preferences through profiles.
    const { data: notification, error: notifErr } = await supabaseAdmin
      .from("notifications")
      .select(`
        *,
        profiles (
          id, email, full_name, role,
          notification_preferences ( email_enabled )
        )
      `)
      .eq("id", delivery.notification_id)
      .single();

    if (notifErr || !notification || !notification.profiles) {
      console.error("[process-notifications] Fetch Error:", notifErr);
      await fallbackFail(deliveryId, "Notification or Profile not found.");
      return jsonResponse({ error: "Data missing" }, 404);
    }

    // Because profile is essentially a generic object here, TS needs coercion depending on SDK version
    const profile = Array.isArray(notification.profiles) ? notification.profiles[0] : notification.profiles;
    const recipientEmail = profile.email;
    const recipientName = profile.full_name || "User";
    
    // Preferences is nested inside the profile join
    const prefsRaw = profile.notification_preferences;
    const prefs = Array.isArray(prefsRaw) ? prefsRaw[0] : prefsRaw;

    // Evaluate Email Preferences (Opt-out gate)
    if (prefs && prefs.email_enabled === false) {
      await bypassOptOut(deliveryId);
      return jsonResponse({ message: "User opted out of emails" }, 200);
    }

    // 3. Template Mapping
    const type = notification.type;
    const p = notification.payload || {};

    let subject = "Namso Notification";
    let htmlMsg = `<p>${notification.message}</p>`;

    // Robust template dictionary matching user instructions
    if (type === "freelancer_app_received") {
      subject = "New Freelancer Application";
      htmlMsg = `
        <h3>New Application</h3>
        <p>You have received a new application from ${p.freelancer_name}.</p>
        <p><a href="https://example.com/admin/freelancers">Review Application</a></p>
      `;
    } else if (type === "freelancer_approved") {
      subject = "Your Application is Approved!";
      htmlMsg = `
        <h3>Welcome to Namso!</h3>
        <p>Hi ${recipientName}, your freelancer profile is now active. You can start accepting tasks immediately.</p>
      `;
    } else if (type === "escrow_created") {
      subject = "Escrow Transaction Initiated";
      htmlMsg = `
        <h3>Escrow Created</h3>
        <p>A new Escrow transaction (${p.escrow_id}) has been created for task ${p.task_title}. Both parties will be notified upon funding.</p>
      `;
    } else {
      // Fallback
      subject = notification.title || "New Update from Namso";
      htmlMsg = `<p>${notification.message}</p><p><a href="https://example.com${notification.link}">View Details</a></p>`;
    }

    // 4. Dispatch to Resend
    if (!resendApiKey) {
      await fallbackFail(deliveryId, "Missing RESEND_API_KEY environment variable.");
      return jsonResponse({ error: "Missing RESEND_API_KEY" }, 500);
    }

    console.log(`[process-notifications] Routing email to ${recipientEmail} for type: ${type}`);
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [recipientEmail],
        subject: subject,
        html: htmlMsg,
      }),
    });

    const resendData = await resendRes.json();
    
    // 5. Finalize State
    if (!resendRes.ok) {
      console.error("[process-notifications] Resend API Failed:", resendData);
      await fallbackFail(deliveryId, `Resend Error: ${JSON.stringify(resendData)}`);
      return jsonResponse({ error: "Resend failed" }, 502);
    }

    // Success Update
    await supabaseAdmin
      .from("notification_deliveries")
      .update({
        status: "sent",
        provider_message_id: resendData.id,
        delivered_at: new Date().toISOString()
      })
      .eq("id", deliveryId);

    return jsonResponse({ message: "Delivery successful", provider_id: resendData.id }, 200);

  } catch (error: any) {
    console.error("[process-notifications] Fatal Exception:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});

/** Ledger recovery failure marker */
async function fallbackFail(deliveryId: string, errorMsg: string) {
  await supabaseAdmin
    .from("notification_deliveries")
    .update({ status: "failed", error: errorMsg })
    .eq("id", deliveryId);
}

/** Soft-bypass failure marker */
async function bypassOptOut(deliveryId: string) {
  // We mark it 'sent' or 'skipped' based on schema limits. 'sent' with null provider_id signifies opt-out bypass if missing 'skipped'.
  await supabaseAdmin
    .from("notification_deliveries")
    .update({ status: "failed", error: "User Preference: Opted out of emails" })
    .eq("id", deliveryId);
}
