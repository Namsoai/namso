import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const templatesToTest = [
  { type: "escrow_created", payload: { task_title: "Build an AI App", escrow_id: "esc_12345" } },
  { type: "escrow_funded", payload: { task_title: "Build an AI App", amount: 1500, currency: "EUR", task_id: "task_123" } },
  { type: "escrow_released", payload: { task_title: "Build an AI App", amount: 1500, currency: "EUR", task_id: "task_123" } },
  { type: "dispute_opened", payload: { payment_id: "pay_1", reason: "The freelancer missed the deadline." } },
  { type: "refund_requested", payload: { payment_id: "pay_2" } },
  { type: "dispute_resolved", payload: { payment_id: "pay_1" } },
  { type: "refund_issued", payload: { payment_id: "pay_2" } },
  { type: "freelancer_approved", payload: {} },
  { type: "cancellation_confirmed", payload: { payment_id: "pay_3" } }
];

async function generatePreviews() {
  const outDir = path.join(process.cwd(), '.preview_emails');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  console.log("Generating HTML reviews via Edge Function...");

  for (const t of templatesToTest) {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/process-notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        previewOnly: true,
        renderType: t.type,
        renderPayload: t.payload,
        renderName: "Alex User"
      })
    });

    if (!res.ok) {
      console.error(`❌ Failed to render ${t.type}:`, await res.text());
      continue;
    }

    const html = await res.text();
    const filePath = path.join(outDir, `${t.type}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`✅ Rendered ${t.type}.html`);
  }
  
  console.log(`\nAll previews saved to ./${path.relative(process.cwd(), outDir)}/`);
  console.log(`You can open these directly in your browser to inspect the branding matrices.`);
}

generatePreviews();
