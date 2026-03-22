const { createClient } = require('@supabase/supabase-js');
const url = 'https://xbqslsxaskrdxgoxtjoh.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";
const db = createClient(url, key);

async function run() {
  const { data } = await db.from("notification_deliveries").select("*").order("created_at", { ascending: false }).limit(1);
  console.log(data[0].error);
}
run();
