import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
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
      console.error("[approve-freelancer] Missing env vars");
      return jsonResponse({ error: "Server misconfigured: missing environment variables." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized: no auth header." }, 401);
    }

    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (callerError || !caller) {
      console.error("[approve-freelancer] Auth failed:", callerError?.message);
      return jsonResponse({ error: "Unauthorized: invalid token." }, 401);
    }

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return jsonResponse({ error: "Forbidden: admin role required." }, 403);
    }

    const { applicationId, email, makeAdmin } = await req.json();
    if (!email) {
      return jsonResponse({ error: "Missing email in request body." }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log(`[approve-freelancer] email=${normalizedEmail}, applicationId=${applicationId}`);

    // Fetch application
    if (applicationId) {
      const { data: application, error: appError } = await supabaseAdmin
        .from("freelancer_applications")
        .select("first_name, last_name, status")
        .eq("id", applicationId)
        .single();

      if (appError || !application) {
        console.error("[approve-freelancer] App not found:", appError?.message);
        return jsonResponse({ error: "Application not found." }, 404);
      }

      if (application.status === "approved") {
        console.log("[approve-freelancer] Already approved");
        return jsonResponse({ success: true, message: "This application has already been approved." });
      }
    }

    // Find the user by email
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!existingUser) {
      return jsonResponse({ error: "No user account found for this email. The freelancer may not have completed signup." }, 404);
    }

    // Update profile: set account_status to active
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ account_status: "active" })
      .eq("id", existingUser.id);

    if (profileError) {
      console.error("[approve-freelancer] Profile update failed:", profileError.message);
      return jsonResponse({ error: `Failed to activate account: ${profileError.message}` }, 500);
    }

    console.log(`[approve-freelancer] Account activated for user ${existingUser.id}`);

    // Assign admin role if requested
    if (makeAdmin) {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: existingUser.id, role: "admin" },
        { onConflict: "user_id,role" }
      );
      console.log("[approve-freelancer] Admin role assigned");
    }

    // Update application status
    if (applicationId) {
      const { error: updateError } = await supabaseAdmin
        .from("freelancer_applications")
        .update({
          status: "approved",
          reviewed_by: caller.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) {
        console.error("[approve-freelancer] Status update failed:", updateError.message);
      } else {
        console.log("[approve-freelancer] Application status → approved");
      }
    }

    return jsonResponse({
      success: true,
      message: `Application approved. ${normalizedEmail} can now log in with their password.`,
    });
  } catch (error) {
    console.error("[approve-freelancer] Unexpected:", error);
    return jsonResponse({ error: error.message || "An unexpected error occurred." }, 500);
  }
});
