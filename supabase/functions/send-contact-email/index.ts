import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN");
if (!ALLOWED_ORIGIN) throw new Error("Missing ALLOWED_ORIGIN");

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Notify all admins
    const { data: adminRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminRoles?.length) {
      const notifications = adminRoles.map((r) => ({
        user_id: r.user_id,
        title: "New Contact Message",
        message: `From ${name} (${email}): ${subject}`,
        type: "contact_message",
        link: "/admin/messages",
      }));
      await supabaseAdmin.from("notifications").insert(notifications);
      console.log(`[send-contact-email] Notified ${adminRoles.length} admin(s)`);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("[send-contact-email] Error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});
