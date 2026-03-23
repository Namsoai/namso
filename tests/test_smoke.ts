import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSmokeTests() {
  console.log("=== Phase 7 Smoke Tests ===");
  const suffix = Date.now();
  let userId: string | null = null;
  
  try {
    const { data: user, error: userErr } = await adminClient.auth.admin.createUser({
      email: `smoke_${suffix}@test.com`,
      password: "password123!",
      email_confirm: true
    });
    if (userErr) throw userErr;
    userId = user.user.id;
    
    // Wait for profile trigger
    await new Promise(r => setTimeout(r, 1000));
    console.log(`✅ Created test user: smoke_${suffix}@test.com`);
    
    // Explicitly force profile to active so edge functions let it pass
    await adminClient.from('profiles').update({ account_status: 'active' }).eq('id', userId);
    
    console.log("Firing `escrow_funded` via Postgres Insert...");
    const { data: notif, error: notifErr } = await adminClient.from("notifications").insert({
      user_id: userId,
      title: "Funding Secured",
      message: "Test funding message",
      type: "escrow_funded",
      payload: { task_title: "Phase 7 Smoke Mission", amount: 5000, currency: "EUR", task_id: "task_smoke_" + suffix }
    }).select().single();
    if (notifErr) throw notifErr;
    
    console.log(`✅ Notification Registered: ${notif.id}. Waiting 5 seconds for webhook propagation...`);
    
    // Give async webhook / cron time to hit Resend and update the DB
    await new Promise(r => setTimeout(r, 5000));
    
    const { data: deliveries, error: delivErr } = await adminClient.from("notification_deliveries")
      .select("*").eq("notification_id", notif.id);
      
    if (delivErr) throw delivErr;
    
    if (deliveries && deliveries.length > 0) {
      console.log("📦 Delivery Ledger Output:");
      console.log(JSON.stringify(deliveries[0], null, 2));
      
      if (deliveries[0].status === "sent") {
        console.log("✅ CRITICAL TEST PASSED: Edge function rendered HTML and achieved SENT status at Resend.");
      } else if (deliveries[0].status === "pending") {
        console.log("❌ CRITICAL ERROR: Edge function was not triggered by Postgres. Hook missing?");
      }
    } else {
      console.log("❌ DELIVERY LEDGER EMPTY: The DB trigger `enqueue_notification_delivery` failed to map the outbox row.");
    }
    
  } catch(e) {
    console.error("Test execution failed:", e);
  } finally {
    if (userId) {
      await adminClient.auth.admin.deleteUser(userId);
      console.log("🧹 Test user purged.");
    }
  }
}

runSmokeTests();
