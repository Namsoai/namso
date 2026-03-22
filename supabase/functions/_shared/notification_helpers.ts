import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.32.0";

/**
 * Inserts a structured notification into the Database and immediately schedules it 
 * in the Delivery Ledger to trigger the async processing pipeline seamlessly.
 */
export async function sendDeliveryNotification(
  supabaseAdmin: SupabaseClient,
  userId: string,
  type: string,
  title: string,
  message: string,
  link: string,
  payload: Record<string, unknown>
) {
  try {
    // 1. Insert the Native Notification Row
    const { data: notif, error: notifErr } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        payload,
      })
      .select("id")
      .single();

    if (notifErr || !notif) {
      console.error(`[NotificationHelper] Failed to spawn Notification for ${type}:`, notifErr);
      return false;
    }

    // 2. Insert the pending Delivery Ledger Row
    const { data: delivery, error: delErr } = await supabaseAdmin
      .from("notification_deliveries")
      .insert({
        notification_id: notif.id,
        channel: "email",
        status: "pending",
      })
      .select("id")
      .single();

    if (delErr || !delivery) {
      console.error(`[NotificationHelper] Failed to spawn Delivery Ledger for ${type}:`, delErr);
      return false;
    }

    // 3. Intelligently Ping the Process Pipeline
    // This allows seamless local and cloud Webhook bridging natively without relying exclusively on pg_net migrations.
    const projectUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (projectUrl && anonKey) {
      // Fire and forget (We don't await because it's purely async trigger mechanism)
      // Deno Deploy allows dangling promises if they resolve before the v8 isolate freezes,
      // but to be perfectly safe, we'll await a fast timeout or just await the HTTP response header.
      try {
        await fetch(`${projectUrl}/functions/v1/process-notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ deliveryId: delivery.id }),
        }).then(res => res.text()).catch(e => console.error("Ping error:", e));
      } catch (err) {
        console.error("[NotificationHelper] Pipeline Ping gracefully dropped:", err);
      }
    }

    return true;
  } catch (err) {
    console.error("[NotificationHelper] Fatal wrapper exception:", err);
    return false;
  }
}
