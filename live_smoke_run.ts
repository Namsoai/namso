/**
 * live_smoke_run.ts
 * Idempotent E2E smoke test for the full dispute → resolve lifecycle.
 *
 * Run with:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx live_smoke_run.ts
 *
 * Schema ground truth (verified against migrations):
 *   - freelancer_applications: NO user_id column. Matched by email.
 *   - analytics_events: column is `event_name`, NOT `event_type`.
 *     open_dispute emits 'escrow_disputed'; resolve_dispute emits 'escrow_resolved'.
 *     payment_id lives inside `properties` JSONB, not a top-level column.
 *   - notifications: NO task_id column. Cleanup via payload->>'payment_id'.
 *   - notification_deliveries: linked via notification_id FK (ON DELETE CASCADE from notifications),
 *     so deleting notifications auto-cascades deliveries.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const anonKey    = process.env.VITE_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error("❌ Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function createTempUser(email: string, role: "business" | "freelancer" | "admin") {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: "SmokePassword123!",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);

  // Wait for the DB trigger to create the profile row
  await new Promise((r) => setTimeout(r, 1200));

  // Update profile — columns that actually exist: account_status, role
  await adminClient.from("profiles").update({ account_status: "active", role }).eq("id", data.user.id);

  // freelancer_applications has NO user_id — match by email
  if (role === "freelancer") {
    await adminClient
      .from("freelancer_applications")
      .update({ status: "approved" })
      .eq("email", email);
  }

  if (role === "admin") {
    await adminClient.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
  }

  // Sign in to get a real JWT so RPCs see auth.uid() correctly
  const tempClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: session, error: signInErr } = await tempClient.auth.signInWithPassword({
    email,
    password: "SmokePassword123!",
  });
  if (signInErr || !session.session) throw new Error(`signIn failed: ${signInErr?.message}`);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
  });

  return { id: data.user.id, email, client: authClient };
}

async function run() {
  const RUN_ID = `smoke_${Date.now()}`;
  console.log(`\n🚀 Starting Smoke Run: ${RUN_ID}\n`);

  let clientUser: Awaited<ReturnType<typeof createTempUser>> | null = null;
  let flUser:     Awaited<ReturnType<typeof createTempUser>> | null = null;
  let adminUser:  Awaited<ReturnType<typeof createTempUser>> | null = null;
  let taskId:   string | null = null;
  let escrowId: string | null = null;

  try {
    // ── 1. CREATE IDENTITIES ───────────────────────────────────────────────
    console.log("→ 1. Creating identities");
    clientUser = await createTempUser(`client_${RUN_ID}@test.com`, "business");
    flUser     = await createTempUser(`fl_${RUN_ID}@test.com`, "freelancer");
    adminUser  = await createTempUser(`admin_${RUN_ID}@test.com`, "admin");
    console.log("  ✓ Identities created and authenticated");

    // ── 2. TASK CREATION ──────────────────────────────────────────────────
    console.log("→ 2. Creating task");
    const { data: task, error: taskErr } = await clientUser.client
      .from("tasks")
      .insert({
        client_id:   clientUser.id,
        title:       `Smoke Test Task ${RUN_ID}`,
        description: "Integration smoke test — safe to delete",
        budget:      1000,
        category:    "Development",
        deadline:    new Date(Date.now() + 86400000).toISOString(),
        status:      "open",
      })
      .select()
      .single();
    assert(!taskErr && task != null, `Task insert failed: ${taskErr?.message}`);
    taskId = task.id;
    console.log(`  ✓ Task: ${taskId}`);

    // ── 3. ASSIGNMENT + ESCROW IN 'held' STATUS ────────────────────────────
    // open_dispute RPC validates status == 'held', so we seed it correctly.
    console.log("→ 3. Assigning task and seeding escrow (held)");
    await adminClient
      .from("tasks")
      .update({ status: "in_progress", freelancer_id: flUser.id, assignment_status: "accepted" })
      .eq("id", taskId);

    escrowId = crypto.randomUUID();
    const { error: payErr } = await adminClient.from("payments").insert({
      id:       escrowId,
      task_id:  taskId,
      payer_id: clientUser.id,
      payee_id: flUser.id,
      amount:   1000,
      currency: "EUR",
      status:   "held",
    });
    assert(!payErr, `Payment insert failed: ${payErr?.message}`);
    console.log(`  ✓ Escrow seeded as 'held': ${escrowId}`);

    // ── 4. CLIENT OPENS DISPUTE (RPC) ─────────────────────────────────────
    console.log("→ 4. Client opens dispute");
    const { error: dispErr } = await clientUser.client.rpc("open_dispute", {
      p_payment_id: escrowId,
      p_reason:     "Smoke test dispute",
    });
    assert(!dispErr, `open_dispute RPC failed: ${dispErr?.message}`);

    const { data: afterDispute } = await adminClient
      .from("payments").select("status").eq("id", escrowId).single();
    assert(afterDispute?.status === "disputed", `Expected 'disputed', got '${afterDispute?.status}'`);
    console.log("  ✓ Status → disputed");

    // ── 5. AUDIT LOG WRITTEN ──────────────────────────────────────────────
    console.log("→ 5. Checking audit log");
    const { data: auditsAfterDispute } = await adminClient
      .from("escrow_audit_logs").select("action").eq("payment_id", escrowId);
    assert(
      auditsAfterDispute !== null && auditsAfterDispute.length >= 1,
      `Audit log must have >= 1 entry after open_dispute`
    );
    console.log(`  ✓ Audit entries: ${auditsAfterDispute.length}`);

    // ── 6. ADMIN RESOLVES → REFUND ────────────────────────────────────────
    console.log("→ 6. Admin resolves dispute (refund)");
    const { error: resErr } = await adminUser.client.rpc("resolve_dispute", {
      p_payment_id: escrowId,
      p_outcome:    "refund",
      p_resolution: "Smoke test resolution",
    });
    assert(!resErr, `resolve_dispute RPC failed: ${resErr?.message}`);

    const { data: afterResolve } = await adminClient
      .from("payments").select("status").eq("id", escrowId).single();
    assert(
      afterResolve?.status === "refund_completed",
      `Expected 'refund_completed', got '${afterResolve?.status}'`
    );
    console.log("  ✓ Status → refund_completed");

    // ── 7. ANALYTICS ASSERTIONS ────────────────────────────────────────────
    // Schema: analytics_events(event_name TEXT, properties JSONB).
    // payment_id is inside properties, NOT a top-level column.
    // open_dispute  → event_name = 'escrow_disputed'
    // resolve_dispute → event_name = 'escrow_resolved'
    console.log("→ 7. Checking analytics events");
    const { data: events } = await adminClient
      .from("analytics_events")
      .select("event_name, properties")
      .or(`event_name.eq.escrow_disputed,event_name.eq.escrow_resolved`)
      .eq("user_id", clientUser.id)
      .gte("occurred_at", new Date(Date.now() - 300000).toISOString()); // last 5 minutes

    const names = (events ?? []).map((e: any) => e.event_name);
    assert(
      names.includes("escrow_disputed"),
      `Expected 'escrow_disputed' event. Found: [${names.join(", ")}]`
    );
    // resolve_dispute emits 'escrow_resolved' (not 'escrow_refunded' — verified in migration 0026)
    const { data: adminEvents } = await adminClient
      .from("analytics_events")
      .select("event_name")
      .eq("event_name", "escrow_resolved")
      .gte("occurred_at", new Date(Date.now() - 60000).toISOString());
    assert(
      (adminEvents ?? []).length >= 1,
      `Expected 'escrow_resolved' event from resolve_dispute`
    );
    console.log(`  ✓ Analytics events confirmed: ${names.join(", ")}, escrow_resolved`);

    // ── 8. FULL AUDIT TRAIL ────────────────────────────────────────────────
    const { data: finalAudits } = await adminClient
      .from("escrow_audit_logs").select("action").eq("payment_id", escrowId);
    assert(
      finalAudits !== null && finalAudits.length >= 2,
      `Expected >= 2 audit rows (open_dispute + resolve_dispute), found ${finalAudits?.length}`
    );
    const auditActions = finalAudits.map((a: any) => a.action);
    assert(auditActions.includes("open_dispute"),    "Missing open_dispute audit entry");
    assert(auditActions.includes("resolve_dispute"), "Missing resolve_dispute audit entry");
    console.log(`  ✓ Audit trail: ${auditActions.join(", ")}`);

    console.log(`\n✅ SMOKE RUN PASSED — ${RUN_ID}\n`);

  } catch (err: any) {
    console.error(`\n❌ SMOKE RUN FAILED: ${err.message}\n`);
    process.exitCode = 1;

  } finally {
    console.log("→ Cleanup: removing smoke data");

    if (escrowId) {
      // Delete analytics events that reference this payment via properties JSONB
      // We filter by user + recency rather than a payment_id column (which doesn't exist)
      if (clientUser?.id) {
        await adminClient
          .from("analytics_events")
          .delete()
          .in("event_name", ["escrow_disputed", "escrow_resolved"])
          .eq("user_id", clientUser.id);
      }

      // Delete audit logs (have a real payment_id FK)
      await adminClient.from("escrow_audit_logs").delete().eq("payment_id", escrowId);

      // notifications has NO task_id column — match via payload->>'payment_id'
      // We use a Postgres filter on the JSONB field
      const { data: notifs } = await adminClient
        .from("notifications")
        .select("id")
        .filter("payload->>payment_id", "eq", escrowId);
      const notifIds = (notifs ?? []).map((n: any) => n.id);
      if (notifIds.length > 0) {
        // notification_deliveries CASCADE deletes when notification is deleted (FK ON DELETE CASCADE)
        await adminClient.from("notifications").delete().in("id", notifIds);
      }

      await adminClient.from("payments").delete().eq("id", escrowId);
    }

    if (taskId) {
      await adminClient.from("tasks").delete().eq("id", taskId);
    }

    // Delete auth users last — cascades profiles & user_roles
    if (clientUser?.id) await adminClient.auth.admin.deleteUser(clientUser.id);
    if (flUser?.id)     await adminClient.auth.admin.deleteUser(flUser.id);
    if (adminUser?.id)  await adminClient.auth.admin.deleteUser(adminUser.id);

    console.log("  ♻️  Smoke debris cleared\n");
  }
}

run();
