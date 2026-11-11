import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["student", "staff", "lecturer", "security"];

interface RegisterRequest {
  email: string;
  fullName: string;
  idCode: string;
  phone?: string;
  role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify caller JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require admin role
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", claimsData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate input
    const body: RegisterRequest = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const fullName = (body.fullName || "").trim();
    const idCode = (body.idCode || "").trim();
    const phone = (body.phone || "").trim() || null;
    const role = ALLOWED_ROLES.includes(body.role || "") ? body.role! : "student";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "A valid email address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!fullName || fullName.length < 2 || fullName.length > 120) {
      return new Response(JSON.stringify({ error: "Full name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!idCode || idCode.length > 64) {
      return new Response(JSON.stringify({ error: "A valid ID code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if a profile already exists with this email or ID code
    const { data: existing } = await supabaseAdmin
      .from("user_profiles")
      .select("id, email, code")
      .or(`email.eq.${email},code.eq.${idCode}`)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "A user with this email or ID code already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the auth user with a random temporary password (confirmed, so they can use the reset link)
    const tempPassword = crypto.randomUUID() + "Aa1!";
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !newUser.user) {
      console.error("Error creating auth user:", createError);
      return new Response(
        JSON.stringify({ error: createError?.message || "Failed to create user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    // Create/update the profile (a trigger may already have created a basic row)
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          phone,
          code: idCode,
          role,
          approval_status: "approved",
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Roll back the auth user so we don't leave orphaned accounts
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Failed to create user profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign the role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    if (roleError) {
      console.error("Error assigning role:", roleError);
    }

    // Generate a password-setup link (recovery link lets them choose their own password)
    const origin = req.headers.get("origin") || "https://nust-dev-reserve.lovable.app";
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Error generating setup link:", linkError);
      return new Response(
        JSON.stringify({ error: "User created but failed to generate setup link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const setupLink = linkData.properties.action_link;

    // Send the invitation email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a365d; margin: 0;">NUST Technovation Centre</h1>
          <p style="color: #666; margin-top: 4px;">Innovation and Business Development (IBD)</p>
        </div>
        <p>Dear <strong>${fullName}</strong>,</p>
        <p>Welcome! Your ID card has been registered at the <strong>NUST Technovation Centre</strong> (Prof Makhurane Building, National University of Science and Technology, Bulawayo).</p>
        <p>To access the Centre's services — including room bookings, project tracking, and the Innovation Hub — please create your login profile by setting your email and password.</p>
        <div style="background-color: #f0f7ff; border-left: 4px solid #1a365d; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your registered details:</strong></p>
          <p style="margin: 8px 0 0 0;">Email: ${email}<br/>ID Number: ${idCode}</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${setupLink}" style="background-color: #1a365d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Create My Login Profile</a>
        </div>
        <p style="color: #666; font-size: 14px;">Once your password is set, you can log in using your email and password, or by scanning your ID card at the Centre.</p>
        <p style="color: #666; font-size: 14px;">If you did not expect this registration, please contact the IBD office.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Kind regards,<br/><strong>Innovation and Business Development (IBD) Team</strong><br/>National University of Science and Technology (NUST)<br/>Prof Makhurane Building, P.O. Box AC 939, Ascot, Bulawayo, Zimbabwe</p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "NUST Technovation Centre <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to NUST Technovation Centre — Create Your Login Profile",
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      return new Response(
        JSON.stringify({
          success: true,
          userId,
          warning: "User created but the invitation email failed to send",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Registered scanned user and sent invitation:", { userId, email });

    return new Response(
      JSON.stringify({ success: true, userId, message: "User registered and invitation email sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-register-scanned-user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
