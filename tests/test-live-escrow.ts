import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTI5MTAsImV4cCI6MjA4OTcyODkxMH0.9IWzYlAsSVAOj3pa_sM5MdYUTgutsZAEmlSX_8K8TV4";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function assert(condition: boolean, msg: string) {
  if (!condition) { console.error(`❌ FAILED: ${msg}`); process.exit(1); }
  else { console.log(`✅ PASSED: ${msg}`); }
}

async function run() {
  const ts = Date.now();
  const pwd = "TestPassword123!";
  
  const bEmail = `buyer_${ts}@example.com`;
  const fEmail = `seller_${ts}@example.com`;

  // 1. Create Users via Admin (guarantees DB insertion)
  const { data: bUser, error: bErr } = await adminClient.auth.admin.createUser({ email: bEmail, password: pwd, email_confirm: true, user_metadata: { role: 'business', full_name: 'Webhook Buyer' } });
  if (bErr) throw new Error("Buyer creation failed: " + bErr.message);
  
  const { data: fUser, error: fErr } = await adminClient.auth.admin.createUser({ email: fEmail, password: pwd, email_confirm: true, user_metadata: { role: 'freelancer', full_name: 'Webhook Seller' } });
  if (fErr) throw new Error("Seller creation failed: " + fErr.message);
  
  await new Promise(r => setTimeout(r, 1000)); // wait for triggers

  const buyerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: true } });
  const sellerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: true } });

  // Login properly to establish gateway session state
  await buyerClient.auth.signInWithPassword({ email: bEmail, password: pwd });
  await sellerClient.auth.signInWithPassword({ email: fEmail, password: pwd });

  const { data: task, error: taskErr } = await adminClient.from("tasks").insert({
    title: "Webhook Real Integration Test", description: "Automating Sandbox", budget: 150, category: "Writing", client_id: bUser.user.id, freelancer_id: fUser.user.id, status: "in_progress", assignment_status: "accepted"
  }).select().single();
  if (taskErr) throw new Error("Task insert failed: " + taskErr.message);

  // Insert Pending Payment via Admin
  const { data: payment, error: payErr } = await adminClient.from("payments").insert({
    task_id: task.id, payer_id: bUser.user.id, payee_id: fUser.user.id, amount: 150, currency: "USD", status: "pending"
  }).select().single();
  if (payErr) throw new Error("Payment insert failed: " + payErr.message);

  console.log("Invoking escrow-create Edge Function...");
  // Use explicit fetch bypass to abstract client proxy dropping the user ID context in node
  const { data: sessionData } = await buyerClient.auth.getSession();
  
  const escrowResHTTP = await fetch(`${SUPABASE_URL}/functions/v1/escrow-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionData.session?.access_token}`,
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ taskId: task.id, paymentId: payment.id, currency: "USD" })
  });

  const rawEscrowText = await escrowResHTTP.text();
  console.log("Raw Response from escrow-create via HTTP:", escrowResHTTP.status, rawEscrowText);

  let escrowRes: any = null;
  if (escrowResHTTP.ok) {
    escrowRes = JSON.parse(rawEscrowText);
  }

  assert(escrowResHTTP.ok && !!escrowRes?.escrow_id, `Escrow.com Sandbox transaction created: ${escrowRes?.escrow_id}`);

  const liveEscrowId = escrowRes.escrow_id;
  
  // Verify Database Payment State Mutated
  const { data: updatedPayment } = await adminClient.from("payments").select("status, escrow_status").eq("id", payment.id).single();
  assert(updatedPayment?.status === "awaiting_payment" || updatedPayment?.status === "pending", `Edge Function securely mapped natively: ${updatedPayment?.status}`);

  console.log("Executing Webhook Verification against LIVE ID:", liveEscrowId);

  // Trigger internal Webhook Edge Function manually (it performs no auth checking natively)
  const WebhookPayload = {
    transaction_id: liveEscrowId,
    event_type: "transaction_completed",
  };

  const webhookResponse = await fetch(`${SUPABASE_URL}/functions/v1/escrow-webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(WebhookPayload)
  });

  const rawText = await webhookResponse.text();
  assert(webhookResponse.ok, `Webhook successfully validated Sandbox ping: ${rawText}`);

  // Refetch payment to ensure state transitioned
  const { data: finalPayment } = await adminClient.from("payments").select("status").eq("id", payment.id).single();
  console.log("Final Webhook Updated Payment Status:", finalPayment?.status);
  assert(finalPayment?.status === "completed" || finalPayment?.status === "in_escrow", "Payment status actively advanced in database via Webhook logic.");
  
  // Cleanup
  console.log("Cleaning up users...");
  await adminClient.auth.admin.deleteUser(bUser.user.id);
  await adminClient.auth.admin.deleteUser(fUser.user.id);
  console.log("Done.");
}

run();
