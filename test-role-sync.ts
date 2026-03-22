import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function assert(condition: boolean, msg: string) {
  if (!condition) { console.error(`❌ FAILED: ${msg}`); process.exit(1); }
  else { console.log(`✅ PASSED: ${msg}`); }
}

async function run() {
  const ts = Date.now();
  const pwd = "TestPassword123!";
  
  // Create user
  const { data: user } = await adminClient.auth.admin.createUser({ email: `rolesync_${ts}@test.com`, password: pwd, email_confirm: true, user_metadata: { role: 'business' } });

  // Wait for initial handle_new_user trigger
  await new Promise(r => setTimeout(r, 1000));

  // Verify initial sync
  const { data: initialRole } = await adminClient.from('user_roles').select('role').eq('user_id', user.user!.id).single();
  assert(initialRole?.role === 'business', "Initial trigger populated user_roles perfectly");

  // Admin manually updates profiles.role
  const { error: updateErr } = await adminClient.from('profiles').update({ role: 'admin' }).eq('id', user.user!.id);
  assert(!updateErr, `Admin updated profile successfully`);

  // Wait for 0006_role_sync trigger
  await new Promise(r => setTimeout(r, 1000));

  // Verify sync
  const { data: syncedRole } = await adminClient.from('user_roles').select('role').eq('user_id', user.user!.id).single();
  assert(syncedRole?.role === 'admin', "Automatic synchronization trigger updated user_roles to match profiles.role");

  // Cleanup
  await adminClient.auth.admin.deleteUser(user.user!.id);
}

run();
