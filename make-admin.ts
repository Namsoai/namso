import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const email = "admin_e2e@example.com";
  // Attempt to delete it first if it exists
  const { data: users } = await adminClient.auth.admin.listUsers();
  const existing = users.users.find(u => u.email === email);
  if (existing) {
     await adminClient.auth.admin.deleteUser(existing.id);
  }

  // Create admin user
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: "Super Admin" }
  });

  if (error) { console.error(error); process.exit(1); }

  await new Promise(r => setTimeout(r, 1000));
  
  // Set as admin
  await adminClient.from("profiles").update({ role: "admin" }).eq("id", data.user!.id);
  
  console.log("Admin seeded: admin_e2e@example.com / Password123!");
}
run();
