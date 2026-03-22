import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Namso <onboarding@resend.dev>";
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

// Global Template Version
const TEMPLATE_VERSION = "v1.0.0";

// Standard brand wrapper
function brandHtml(title: string, content: string, ctaHtml: string = "") {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background-color: #0f172a; padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
        .content { padding: 32px; color: #334155; line-height: 1.6; font-size: 16px; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background-color: #3b82f6; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 24px; }
        .data-box { background-color: #f1f5f9; padding: 16px; border-left: 4px solid #cbd5e1; margin: 16px 0; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Namso Connect</h1>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color:#0f172a;">${title}</h2>
          ${content}
          ${ctaHtml ? `<div style="text-align: center;">${ctaHtml}</div>` : ""}
        </div>
        <div class="footer">
          <p>You received this email because of an update on your Namso account.</p>
          <p>© ${new Date().getFullYear()} Namso Connect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  try {
    const payload = await req.json();

    // ─── 0. DEV PREVIEW MODE ────────────────────────────────────────────────
    if (payload.previewOnly) {
      const { renderType, renderPayload, renderName } = payload;
      // @ts-ignore
      const t = generateTemplate(renderType, renderPayload || {}, renderName || "User");
      return new Response(t.html, { headers: { "Content-Type": "text/html" } });
    }

    // ─── 0.5 CRON SELF-HEALING QUEUE ────────────────────────────────────────
    if (payload.cron) {
      const batchSize = payload.limit || 10;
      const { data: claimedRows, error: claimErr } = await supabaseAdmin.rpc("claim_notification_deliveries", { p_limit: batchSize });
      
      if (claimErr || !claimedRows || claimedRows.length === 0) {
        return jsonResponse({ message: "Cron finished processing.", count: 0 }, 200);
      }

      console.log(`[cron] Claimed ${claimedRows.length} payloads for atomic execution.`);
      const results = [];
      for (const row of claimedRows) {
        // Sequentially await to respect provider rate limits cleanly, though promise.all is possible
        results.push(await executeDelivery(row.delivery_id));
      }

      return jsonResponse({ message: "Cron cycle complete", processed: claimedRows.length, results }, 200);
    }

    // ─── 1. EXTRACT SINGLE DELIVERY ID ──────────────────────────────────────────────
    let deliveryId: string | undefined;
    if (payload.type === "INSERT" && payload.table === "notification_deliveries") {
      deliveryId = payload.record?.id;
    } else if (payload.deliveryId) {
      deliveryId = payload.deliveryId;
    }
    if (!deliveryId) return jsonResponse({ error: "Missing delivery ID." }, 400);

    // ─── 2. LOCK SINGLE ROW (Webhooks only) ──────────────────────────────────────────────────────────
    const { data: delivery, error: lockErr } = await supabaseAdmin
      .from("notification_deliveries")
      .update({ status: "processing", attempted_at: new Date().toISOString() })
      .eq("id", deliveryId)
      .eq("status", "pending")
      .select()
      .single();

    if (lockErr || !delivery) {
      return jsonResponse({ message: "Skipped or already claimed" }, 200);
    }

    // Process the individual delivery
    const resInfo = await executeDelivery(deliveryId);
    return jsonResponse(resInfo, resInfo.error ? 500 : 200);

  } catch (error: any) {
    console.error("[process-notifications] Fatal Exception:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});

async function executeDelivery(deliveryId: string) {
  try {
    // ─── 3. FETCH NOTIFICATION ───────────────────────────────────────────────
    const { data: notification, error: notifErr } = await supabaseAdmin
      .from("notifications")
      .select(`
        *,
        profiles (
          id, email, full_name, role,
          notification_preferences ( email_enabled )
        )
      `)
      .eq("id", (await supabaseAdmin.from("notification_deliveries").select("notification_id").eq("id", deliveryId).single()).data?.notification_id)
      .single();

    if (notifErr || !notification || !notification.profiles) {
      await fallbackFail(deliveryId, "Notification or Profile not found.");
      return { deliveryId, error: "Data missing" };
    }

    const profile = Array.isArray(notification.profiles) ? notification.profiles[0] : notification.profiles;
    const recipientEmail = profile.email;
    const recipientName = profile.full_name || "User";
    
    // Evaluate Email Preferences (Opt-out gate)
    const prefsRaw = profile.notification_preferences;
    const prefs = Array.isArray(prefsRaw) ? prefsRaw[0] : prefsRaw;
    if (prefs && prefs.email_enabled === false) {
      await fallbackFail(deliveryId, "User Preference: Opted out of emails");
      return { deliveryId, message: "User opted out of emails" };
    }

    // ─── 4. TEMPLATE GENERATION ──────────────────────────────────────────────
    let templateOutput;
    try {
      // @ts-ignore
      templateOutput = generateTemplate(notification.type, notification.payload || {}, recipientName, notification);
    } catch (tplErr: any) {
      console.error(`[process-notifications] Template validation failed for ${deliveryId}:`, tplErr.message);
      await fallbackFail(deliveryId, `Template validation failed: ${tplErr.message}`);
      return { deliveryId, error: tplErr.message };
    }

    // ─── 5. DISPATCH TO RESEND ───────────────────────────────────────────────
    if (!resendApiKey) {
      await fallbackFail(deliveryId, "Missing RESEND_API_KEY environment variable.");
      return { deliveryId, error: "Missing RESEND_API_KEY" };
    }

    const resendPayload = {
      from: resendFromEmail,
      to: [recipientEmail],
      subject: templateOutput.subject,
      html: templateOutput.html,
      text: templateOutput.text,
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json();
    
    if (!resendRes.ok) {
      await fallbackFail(deliveryId, `Resend Error: ${JSON.stringify(resendData)}`);
      return { deliveryId, error: "Resend format rejection" };
    }

    // SUCCESS: Mark as SENT (Not 'delivered' yet - that is governed by webhooks)
    await supabaseAdmin
      .from("notification_deliveries")
      .update({
        status: "sent",
        provider_message_id: resendData.id,
        template_name: templateOutput.templateName,
        template_version: TEMPLATE_VERSION,
        error: null // clear previous errors if retried
      })
      .eq("id", deliveryId);

    return { deliveryId, message: "Delivery sent successfully", provider_id: resendData.id };

  } catch (error: any) {
    console.error(`[process-notifications] Execution Exception for ${deliveryId}:`, error);
    await fallbackFail(deliveryId, `Runtime fault: ${error.message}`);
    return { deliveryId, error: error.message };
  }
}

/** Helper to strictly validate payload keys */
function requireKeys(payload: any, keys: string[], templateName: string) {
  for (const k of keys) {
    if (payload[k] === undefined || payload[k] === null) {
      throw new Error(`Template [${templateName}] missing required payload key: '${k}'`);
    }
  }
}

/** Central Template Generation Mapping */
function generateTemplate(type: string, p: any, recipientName: string, fallbackNotif?: any) {
  let subject = "Update from Namso";
  let html = "";
  let text = "";
  let templateName = type;

  // Domain URL dynamically for CTA links (Assume VITE_FRONTEND_URL exists or default)
  const appUrl = Deno.env.get("VITE_FRONTEND_URL") || "https://namso.com";

  switch (type) {
    case "escrow_created":
      requireKeys(p, ["task_title", "escrow_id"], type);
      subject = "Escrow Transaction Initiated";
      text = `Hi ${recipientName},\n\nA new escrow transaction (${p.escrow_id}) has been initialized for task: "${p.task_title}". Both parties will be notified once funds are secured.\n\nThank you,\nNamso Connect`;
      html = brandHtml(
        "Escrow Initiated", 
        `<p>Hi ${recipientName},</p>
         <p>A new secure escrow transaction has been formally initialized for the task:</p>
         <div class="data-box"><strong>Task:</strong> ${p.task_title}<br/><strong>Escrow ID:</strong> ${p.escrow_id}</div>
         <p>No further action is required until the funds are fully secured by the payment gateway.</p>`
      );
      break;

    case "escrow_funded":
      requireKeys(p, ["task_title", "amount", "currency", "task_id"], type);
      subject = "Escrow Funded & Secured";
      text = `Hi ${recipientName},\n\nGreat news! The escrow for "${p.task_title}" has been successfully funded with ${p.amount} ${p.currency}. Work can now safely begin.\n\nView Task: ${appUrl}/tasks/${p.task_id}`;
      html = brandHtml(
        "Escrow Successfully Funded",
        `<p>Hi ${recipientName},</p>
         <p>The funds for your task have been secured in our escrow vault. The freelancer is now clear to begin the work.</p>
         <div class="data-box"><strong>Task:</strong> ${p.task_title}<br/><strong>Secured Amount:</strong> ${p.amount} ${p.currency}</div>`,
        `<a href="${appUrl}/tasks/${p.task_id}" class="btn">View Task Hub</a>`
      );
      break;

    case "escrow_released":
      requireKeys(p, ["task_title", "amount", "currency", "task_id"], type);
      subject = "Payment Released!";
      text = `Hi ${recipientName},\n\nThe escrow funds (${p.amount} ${p.currency}) for "${p.task_title}" have been officially released. The transfer is on its way to the recipient.\n\nView Task: ${appUrl}/tasks/${p.task_id}`;
      html = brandHtml(
        "Payment Released",
        `<p>Hi ${recipientName},</p>
         <p>The client has approved the work and authorized the release of the escrow funds. The transfer process has started.</p>
         <div class="data-box"><strong>Task:</strong> ${p.task_title}<br/><strong>Released Amount:</strong> ${p.amount} ${p.currency}</div>`,
        `<a href="${appUrl}/tasks/${p.task_id}" class="btn">View Task Hub</a>`
      );
      break;

    case "dispute_opened":
      requireKeys(p, ["payment_id"], type);
      subject = "Action Required: Dispute Opened";
      text = `Hi ${recipientName},\n\nA dispute has been raised regarding your recent task. Escrow funds are frozen while an admin investigates.\n\nReason: ${p.reason || 'No reason provided'}`;
      html = brandHtml(
        "Dispute Opened",
        `<p>Hi ${recipientName},</p>
         <p>A formal dispute has been initiated for an active escrow. All funds are securely frozen while our moderation team investigates the claim.</p>
         ${p.reason ? `<div class="data-box"><strong>Dispute Reason provided:</strong><br/>${p.reason}</div>` : ''}
         <p>A Namso administrator will contact you shortly if further evidence is required.</p>`
      );
      break;

    case "refund_requested":
      requireKeys(p, ["payment_id"], type);
      subject = "Escrow Refund Requested";
      text = `Hi ${recipientName},\n\nThe client has requested a full refund for the escrow funds in a task. Funds are frozen until resolution.`;
      html = brandHtml(
        "Refund Requested",
        `<p>Hi ${recipientName},</p>
         <p>The client has officially requested a refund for the escrow deposit. The funds are frozen while an administrator reviews the request.</p>
         <p>We will email you the final outcome once the review concludes.</p>`
      );
      break;

    case "dispute_resolved":
      requireKeys(p, ["payment_id"], type);
      subject = "Dispute Concluded";
      text = `Hi ${recipientName},\n\nThe dispute on your task has been formally resolved by administration. Please check your dashboard for the final outcome.`;
      html = brandHtml(
        "Dispute Resolved",
        `<p>Hi ${recipientName},</p>
         <p>A Namso Administrator has concluded the investigation regarding your dispute.</p>
         <p>The final financial transition has been enforced on the escrow funds.</p>`,
        `<a href="${appUrl}" class="btn">View Dashboard</a>`
      );
      break;

    case "refund_issued":
      requireKeys(p, ["payment_id"], type);
      subject = "Escrow Refund Completed";
      text = `Hi ${recipientName},\n\nThe refund request was approved and the funds have been successfully returned to the original payment source.`;
      html = brandHtml(
        "Refund Completed",
        `<p>Hi ${recipientName},</p>
         <p>The escrow deposit has been formally returned to the client's original payment method. The task lifecycle is now concluded.</p>`,
        `<a href="${appUrl}" class="btn">View Account</a>`
      );
      break;

    case "freelancer_approved":
      subject = "Your Namso Profile is Approved!";
      text = `Hi ${recipientName},\n\nCongratulations! Your freelancer profile has been verified and approved. You can now bid on tasks and accept escrow payments.\n\nLogin: ${appUrl}/login`;
      html = brandHtml(
        "Profile Approved!",
        `<p>Hi ${recipientName},</p>
         <p>Congratulations! Our operations team has verified your credentials and your Freelancer account is now proudly <strong>Active</strong>.</p>
         <p>You can now browse available tasks, submit applications, and secure payments via our escrow system.</p>`,
        `<a href="${appUrl}/login" class="btn">Login to Namso</a>`
      );
      break;

    case "cancellation_confirmed":
      requireKeys(p, ["payment_id"], type);
      subject = "Escrow Cancelled";
      text = `Hi ${recipientName},\n\nThe pending escrow initialization was aborted by the client. No funds were captured.`;
      html = brandHtml(
        "Escrow Cancelled",
        `<p>Hi ${recipientName},</p>
         <p>A pending escrow transaction for a task was successfully cancelled by the client before funds were captured.</p>`
      );
      break;

    default:
      // Graceful fallback for generic notifications
      templateName = "fallback_generic";
      subject = fallbackNotif?.title || "New Update from Namso";
      const pureMessage = fallbackNotif?.message || "There is a new update on your account.";
      const link = fallbackNotif?.link;
      text = `Hi ${recipientName},\n\n${pureMessage}\n\n${link ? appUrl + link : appUrl}`;
      html = brandHtml(
        subject,
        `<p>Hi ${recipientName},</p><p>${pureMessage}</p>`,
        link ? `<a href="${appUrl}${link}" class="btn">View Details</a>` : ""
      );
      break;
  }

  return { subject, html, text, templateName };
}

async function fallbackFail(deliveryId: string, errorMsg: string) {
  const { data: current } = await supabaseAdmin
    .from("notification_deliveries")
    .select("attempt_count, max_attempts")
    .eq("id", deliveryId)
    .single();

  const attempt = (current?.attempt_count || 0) + 1;
  const max = current?.max_attempts || 5;

  if (attempt >= max) {
    // Escalate to Dead-Letter Queue
    await supabaseAdmin
      .from("notification_deliveries")
      .update({ 
        status: "dead_letter", 
        error: errorMsg, 
        dead_letter_reason: "Max attempts exceeded automatically", 
        attempt_count: attempt,
        last_attempted_at: new Date().toISOString()
      })
      .eq("id", deliveryId);
  } else {
    // Compute bounded exponential backoff
    let retryMin = 5;
    if (attempt === 2) retryMin = 15;
    if (attempt === 3) retryMin = 60;
    if (attempt === 4) retryMin = 360;

    const nextRetryAt = new Date(Date.now() + retryMin * 60000).toISOString();

    await supabaseAdmin
      .from("notification_deliveries")
      .update({ 
        status: "failed", 
        error: errorMsg, 
        attempt_count: attempt,
        last_attempted_at: new Date().toISOString(),
        next_retry_at: nextRetryAt
      })
      .eq("id", deliveryId);
  }
}
