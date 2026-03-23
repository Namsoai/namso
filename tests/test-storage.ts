import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNTI5MTAsImV4cCI6MjA4OTcyODkxMH0.9IWzYlAsSVAOj3pa_sM5MdYUTgutsZAEmlSX_8K8TV4";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function assert(condition: boolean, msg: string) {
  if (!condition) { console.error(`❌ FAILED: ${msg}`); process.exit(1); }
  else { console.log(`✅ PASSED: ${msg}`); }
}

async function run() {
  const ts = Date.now();
  const pwd = "TestPassword123!";
  
  // Create Business (Client), Freelancer, and Unrelated User
  const { data: bUser } = await adminClient.auth.admin.createUser({ email: `business_${ts}@test.com`, password: pwd, email_confirm: true, user_metadata: { role: 'business' } });
  const { data: fUser } = await adminClient.auth.admin.createUser({ email: `freelancer_${ts}@test.com`, password: pwd, email_confirm: true, user_metadata: { role: 'freelancer' } });
  const { data: uUser } = await adminClient.auth.admin.createUser({ email: `unrelated_${ts}@test.com`, password: pwd, email_confirm: true, user_metadata: { role: 'business' } });

  // Wait for triggers
  await new Promise(r => setTimeout(r, 1000));

  const clientBuyer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const clientFreelancer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const clientUnrelated = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  await clientBuyer.auth.signInWithPassword({ email: `business_${ts}@test.com`, password: pwd });
  await clientFreelancer.auth.signInWithPassword({ email: `freelancer_${ts}@test.com`, password: pwd });
  await clientUnrelated.auth.signInWithPassword({ email: `unrelated_${ts}@test.com`, password: pwd });

  // Business creates a task
  const { data: task } = await clientBuyer.from("tasks").insert({
    title: "Storage Test App", description: "Testing explicit bucket locks", budget: 100, category: "Writing", client_id: bUser.user!.id
  }).select().single();

  assert(!!task, "Business task created");

  const taskId = task.id;
  const freelancerId = fUser.user!.id;
  const path = `${freelancerId}/${taskId}/${ts}-file.txt`;

  // 1. FREELANCER UPLOAD
  const fileBlob = new Blob(["Secret submission"], { type: "text/plain" });
  const { error: uploadErr } = await clientFreelancer.storage.from("task-files").upload(path, fileBlob);
  assert(!uploadErr, `Freelancer uploaded securely to ${path}. Msg: ${uploadErr?.message}`);

  // 2. FREELANCER DOWNLOAD (Owner read)
  const { data: ownerDl, error: ownerErr } = await clientFreelancer.storage.from("task-files").download(path);
  assert(!ownerErr && !!ownerDl, "Freelancer can read their own upload");

  // 3. BUSINESS DOWNLOAD (Client read)
  const { data: clientDl, error: clientErr } = await clientBuyer.storage.from("task-files").download(path);
  assert(!clientErr && !!clientDl, "Business Client can successfully read the file through relational join RLS");

  // 4. UNRELATED USER DENIED
  const { error: unrelatedErr } = await clientUnrelated.storage.from("task-files").download(path);
  assert(!!unrelatedErr, "Unrelated user correctly DENIED access to file.");

  // 5. ADMIN READ
  const { data: adminDl, error: adminErr } = await adminClient.storage.from("task-files").download(path);
  assert(!adminErr && !!adminDl, "Admin service role can download the file.");

  console.log("Cleaning up users...");
  await adminClient.auth.admin.deleteUser(bUser.user!.id);
  await adminClient.auth.admin.deleteUser(fUser.user!.id);
  await adminClient.auth.admin.deleteUser(uUser.user!.id);
  console.log("Done.");
}

run();
