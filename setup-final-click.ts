import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbqslsxaskrdxgoxtjoh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNsc3hhc2tyZHhnb3h0am9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE1MjkxMCwiZXhwIjoyMDg5NzI4OTEwfQ.yA2nppHnCUhXao1Fa_eUWGdbyoRG39e-S0EFvrkNAmI";
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const { data: users } = await adminClient.auth.admin.listUsers();
  const fUser = users.users.find(u => u.email === "live_e2e_freelancer@test.com");
  const bUser = users.users.find(u => u.email === "live_e2e_business@test.com");
  
  if (!fUser || !bUser) {
    console.log("Users not found, recreating them!");
    return;
  }

  // Find the exact task!
  const { data: tasks } = await adminClient.from("tasks").select("*").eq("title", "Live Test Task");
  const task = tasks?.[0];

  if (!task) {
    console.log("Task not found!");
    return;
  }

  // Update
  await adminClient.from("tasks").update({ freelancer_id: fUser.id, assignment_status: "accepted", status: "in_progress" }).eq("id", task.id);
  
  // Insert initial payment row so Escrow can trigger!
  const { data: p } = await adminClient.from("payments").select("*").eq("task_id", task.id);
  if (!p || p.length === 0) {
      await adminClient.from("payments").insert({
        task_id: task.id, payer_id: bUser.id, payee_id: fUser.id, amount: 100, currency: "USD", status: "pending"
      });
  }
  
  // Fake the submission to skip freelancer upload!
  await adminClient.from("task_submissions").insert({
    task_id: task.id, freelancer_id: fUser.id, file_url: "fake-url", message: "Here is the work!"
  });

  // Now the Business strictly just logs in, clicks task, and clicks FUND ESCROW!
  console.log("Assigned Task, Created Payment, Faked Submission. Ready for Business to CLICK Funding.");
}
run();
