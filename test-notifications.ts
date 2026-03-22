import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTI5MTAsImV4cCI6MjA4OTcyODkxMH0.9IWzYlAsSVAOj3pa_sM5MdYUTgutsZAEmlSX_8K8TV4";

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("=== Phase 2 Notification E2E ===");
  const ts = Date.now();
  const testEmail = `test_notification_${ts}@namso-testing.com`;

  // 1. Create a dummy user
  const { data: user, error: userErr } = await adminClient.auth.admin.createUser({ 
    email: testEmail, 
    password: "Password123!", 
    email_confirm: true,
    user_metadata: { role: 'freelancer', full_name: 'Webhook Tester' }
  });
  if (userErr) throw new Error("User creation failed: " + userErr.message);

  const userId = user.user.id;
  console.log("✅ Created mock recipient:", testEmail);

  // Wait for handle_new_user and handle_new_user_preference triggers
  await new Promise(r => setTimeout(r, 1000));

  // 2. Insert into notifications
  const { data: notif, error: notifErr } = await adminClient.from("notifications").insert({
    user_id: userId,
    title: "Test Application Received",
    message: "We have securely received your Phase 2 application test.",
    type: "freelancer_app_received",
    link: "/admin/applications",
    payload: { freelancer_name: "Webhook Tester", testing_suite: "Phase 2" }
  }).select().single();
  if (notifErr) throw new Error("Notification insert failed: " + notifErr.message);

  console.log("✅ Successfully inserted into `notifications`:", notif.id);

  // 3. Insert into notification_deliveries (Pending)
  const { data: delivery, error: delErr } = await adminClient.from("notification_deliveries").insert({
    notification_id: notif.id,
    channel: "email",
    status: "pending"
  }).select().single();
  if (delErr) throw new Error("Delivery ledger insert failed: " + delErr.message);

  console.log("✅ Successfully inserted into `notification_deliveries`:", delivery.id);

  // 4. Ping process-notifications directly
  console.log("🚀 Invoking `process-notifications` over Edge Gateway...");
  const whRes = await fetch(`${SUPABASE_URL}/functions/v1/process-notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deliveryId: delivery.id })
  });

  const raw = await whRes.text();
  console.log("Edge Payload:", raw);

  // 5. Query delivery state natively
  const { data: updatedDelivery } = await adminClient.from("notification_deliveries").select("*").eq("id", delivery.id).single();
  console.log("Final Database Delivery Status:", updatedDelivery.status);
  console.log("Ledger Error Log:", updatedDelivery.error);

  // Cleanup
  await adminClient.auth.admin.deleteUser(userId);
  console.log("✅ E2E Audit Complete!");
}

run();
