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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[resend-activation] Missing env vars");
      return jsonResponse({ error: "server_error", message: "Server misconfigured." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email } = await req.json();
    if (!email) {
      return jsonResponse({ error: "Email is required." }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`[resend-activation] Request for: ${normalizedEmail}`);

    // Check application status (case-insensitive)
    const { data: application } = await supabaseAdmin
      .from("freelancer_applications")
      .select("id, status, first_name, last_name")
      .ilike("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!application) {
      // Don't reveal whether an account exists
      return jsonResponse({ success: true, message: "If an approved account exists for this email, a new activation link has been sent." });
    }

    if (application.status === "pending") {
      return jsonResponse({ error: "not_ready", message: "Your application is still under review." });
    }

    if (application.status === "rejected") {
      return jsonResponse({ error: "rejected", message: "Your application was not approved. Please contact support." });
    }

    // Find existing user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("password_set")
        .eq("id", existingUser.id)
        .single();

      if (profile?.password_set === true) {
        return jsonResponse({ error: "already_active", message: "Your account is already active. Please log in instead." });
      }

      // Clean up unactivated user for fresh invite
      await supabaseAdmin.from("user_roles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("profiles").delete().eq("id", existingUser.id);
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    }

    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) throw new Error("Missing SITE_URL. Cannot safely redirect.");
    const redirectTo = `${siteUrl}/activate-account`;
    const fullName = `${application.first_name} ${application.last_name}`;

    console.log(`[resend-activation] Sending invite to ${normalizedEmail}, redirectTo=${redirectTo}`);

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: { user_type: "freelancer", full_name: fullName },
        redirectTo,
      }
    );

    if (inviteError) {
      console.error("[resend-activation] Invite failed:", inviteError.message);
      return jsonResponse({ error: "resend_failed", message: "Unable to send a new link. Please try again later." }, 500);
    }

    console.log(`[resend-activation] Invite sent to ${normalizedEmail}`);
    return jsonResponse({ success: true, message: "A new activation link has been sent to your email." });
  } catch (error) {
    console.error("[resend-activation] Unexpected:", error);
    return jsonResponse({ error: "server_error", message: "Something went wrong. Please try again later." }, 500);
  }
});
