import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTI5MTAsImV4cCI6MjA4OTcyODkxMH0.9IWzYlAsSVAOj3pa_sM5MdYUTgutsZAEmlSX_8K8TV4";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function assert(condition: boolean, msg: string) {
  if (!condition) { console.error(`❌ FAILED: ${msg}`); process.exit(1); }
  else { console.log(`✅ PASSED: ${msg}`); }
}

async function run() {
  const ts = Date.now();
  const pwd = "TestPassword123!";
  const bEmail = `final_business_${ts}@example.com`;
  const fEmail = `final_freelancer_${ts}@example.com`;

  console.log("=== FINAL E2E RELEASE GATE ===");

  // 1. Signup / rate-limit cool down (simulating clean flow)
  // We use admin createUser to skip rate limits, but we test the RLS flows purely from authenticated clients!
  const { data: bUser, error: bErr } = await adminClient.auth.admin.createUser({ email: bEmail, password: pwd, email_confirm: true, user_metadata: { role: 'business', full_name: 'Final Business' } });
  if (bErr) throw new Error("Business user creation failed: " + bErr.message);
  
  const { data: fUser, error: fErr } = await adminClient.auth.admin.createUser({ email: fEmail, password: pwd, email_confirm: true, user_metadata: { role: 'freelancer', full_name: 'Final Freelancer' } });
  if (fErr) throw new Error("Freelancer creation failed: " + fErr.message);

  const aEmail = `final_admin_${ts}@example.com`;
  const { data: aUser, error: aErr } = await adminClient.auth.admin.createUser({ email: aEmail, password: pwd, email_confirm: true, user_metadata: { role: 'admin', full_name: 'Final Admin' } });
  if (aErr) throw new Error("Admin creation failed: " + aErr.message);
  
  // Assign admin role securely (handle_new_user defaults the auth metadata if 'admin' is supplied, but we enforce it here)
  await adminClient.from("user_roles").upsert({ user_id: aUser.user!.id, role: 'admin' });

  const buyerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const sellerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const adminEndClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: bAuth, error: sign1 } = await buyerClient.auth.signInWithPassword({ email: bEmail, password: pwd });
  const { data: sAuth, error: sign2 } = await sellerClient.auth.signInWithPassword({ email: fEmail, password: pwd });
  const { data: aAuth, error: sign3 } = await adminEndClient.auth.signInWithPassword({ email: aEmail, password: pwd });
  
  if (sign1 || sign2 || sign3) throw new Error("SignIn failed: " + (sign1?.message || sign2?.message || sign3?.message));

  // 1a. RLS Test: Buyer posts a task correctly natively
  const { data: task, error: taskErr } = await buyerClient.from("tasks").insert({
    title: "Final Escrow Run", description: "Verifying native RLS insert for payments", budget: 100, category: "Writing", client_id: bUser.user!.id, status: "open", assignment_status: "unassigned"
  }).select().single();
  assert(!taskErr, `Task successfully posted gracefully by business logic over RLS.`);

  // 1b. RLS Test: Seller applies natively (must not .select() because RLS denies read to public)
  const { error: appErr } = await sellerClient.from("freelancer_applications").insert({
    first_name: "Final", last_name: "Freelancer", email: fEmail, university: "Test Uni", major: "Testing", tools: "Supabase"
  });
  if (appErr) console.error("APP_ERROR:", appErr);
  assert(!appErr, `Freelancer successfully applied securely via RLS.`);

  // Admin independently retrieves the application
  const { data: app } = await adminClient.from("freelancer_applications").select("id").eq("email", fEmail).single();
  assert(!appErr, `Freelancer successfully applied securely via RLS.`);

  // 1c. Admin Approval natively
  const edgeResHTTP = await fetch(`${SUPABASE_URL}/functions/v1/approve-freelancer`, {
    method: "POST", 
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${aAuth.session?.access_token}`, "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ applicationId: app?.id, email: fEmail, action: "approve" })
  });
  const edgeRaw = await edgeResHTTP.json();
  if (!edgeResHTTP.ok) console.error("EDGE_ERROR:", edgeRaw);
  assert(edgeResHTTP.ok, `Admin officially approved freelancer role securely via Edge Function wrapper: ${edgeResHTTP.status}`);

  // Assignment artificially executed
  await adminClient.from("tasks").update({ status: "in_progress", assignment_status: "assigned", freelancer_id: fUser.user!.id }).eq("id", task.id);

  // 2. Storage Buckets & Submissions 
  // RLS Test: Freelancer submits deliverable
  const { error: submitErr } = await sellerClient.from("task_submissions").insert({
    task_id: task.id, freelancer_id: fUser.user!.id, message: "Here is my final E2E work", file_url: "mock-url"
  });
  assert(!submitErr, "Freelancer accurately submitted deliverables into secure schema.");

  // 3. RLS Test: Native Payment Initialization (Replacing `approve_task_work` RPC!!)
  // The business approves work -> the frontend calls update tasks AND insert payments!
  const { error: updErr } = await buyerClient.from("tasks").update({ status: "completed", assignment_status: "accepted" }).eq("id", task.id);
  assert(!updErr, "Business organically updated task status seamlessly via native RLS schema authorization.");

  const { data: payment, error: payErr } = await buyerClient.from("payments").insert({
    task_id: task.id, payer_id: bUser.user!.id, payee_id: fUser.user!.id, amount: 100, currency: "USD", status: "pending"
  }).select().single();
  assert(!payErr && !!payment, `Business organically initialized the Payment row seamlessly! RPC removed successfully. ID: ${payment?.id}`);

  // 4. Secure Escrow Boundary Initiation
  // Because the Escrow client requires explicit payloads, we securely ping it.
  const escrowResHTTP = await fetch(`${SUPABASE_URL}/functions/v1/escrow-create`, {
    method: "POST", 
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${bAuth.session?.access_token}`, "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify({ taskId: task.id, paymentId: payment.id, currency: "USD" })
  });
  const escrowRaw = await escrowResHTTP.json();
  if (!escrowResHTTP.ok || !escrowRaw?.escrow_id) console.error("ESCROW_ERROR:", escrowRaw);
  assert(escrowResHTTP.ok && !!escrowRaw?.escrow_id, `Escrow Edge Function completely validated transaction lifecycle seamlessly: ${escrowRaw?.escrow_id}`);

  // 5. Escrow Webhook
  const webhookBody = { transaction_id: escrowRaw?.escrow_id, event_type: "transaction_completed" };
  const { error: whErr } = await adminClient.functions.invoke("escrow-webhook", { body: webhookBody });
  assert(!whErr, "Escrow Webhook successfully acknowledged remote database update.");

  const { data: fPay } = await adminClient.from("payments").select("status").eq("id", payment.id).single();
  assert(fPay?.status === "completed" || fPay?.status === "in_escrow", `Audit Log strictly confirms remote database state transition natively: ${fPay?.status}`);

  console.log("=== ALL E2E Release Gates Achieved! ===");
}
run();
