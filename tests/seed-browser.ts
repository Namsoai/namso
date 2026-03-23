import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const pwd = "Password123!";
  const _bUser = await adminClient.auth.admin.createUser({ email: `live_e2e_business@test.com`, password: pwd, email_confirm: true, user_metadata: { role: 'business', full_name: 'Live Business' } });
  const _fUser = await adminClient.auth.admin.createUser({ email: `live_e2e_freelancer@test.com`, password: pwd, email_confirm: true, user_metadata: { role: 'freelancer', full_name: 'Live Freelancer' } });
  
  await new Promise(r => setTimeout(r, 1000));
  console.log("Seeded live UI actors.");
}
run();
