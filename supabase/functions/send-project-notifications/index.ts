import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  projectId: string;
  userId: string;
  notificationType: 'progress_alert' | 'project_created' | 'stage_completed';
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authentication: Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authenticatedUserId = claimsData.user.id;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { projectId, userId, notificationType, message }: NotificationRequest = await req.json();

    console.log("Processing notification:", { projectId, userId, notificationType });

    // Authorization: Verify user owns the project OR is an admin
    const { data: project } = await supabaseClient
      .from('projects')
      .select('user_id, title, status, trl_level')
      .eq('id', projectId)
      .single();

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', authenticatedUserId)
      .eq('role', 'admin')
      .single();

    const isAdmin = !!adminRole;
    const isOwner = project.user_id === authenticatedUserId;

    if (!isAdmin && !isOwner) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Must be project owner or admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user profile and project details
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      throw new Error('User not found');
    }

    // Prepare email content based on notification type
    let subject: string;
    let htmlContent: string;

    switch (notificationType) {
      case 'project_created':
        subject = `Project Created: ${project.title}`;
        htmlContent = `
          <h1>Project Created Successfully!</h1>
          <p>Dear ${userProfile.full_name || 'User'},</p>
          <p>Your project "<strong>${project.title}</strong>" has been created successfully.</p>
          <p><strong>Current TRL Level:</strong> ${project.trl_level || 'Not set'}</p>
          <p>You can track your project progress through the dashboard.</p>
          <p>Best regards,<br>SDC Innovation Hub</p>
        `;
        break;

      case 'progress_alert':
        subject = `Progress Alert: ${project.title}`;
        htmlContent = `
          <h1>Project Progress Alert</h1>
          <p>Dear ${userProfile.full_name || 'User'},</p>
          <p>This is a progress reminder for your project "<strong>${project.title}</strong>".</p>
          <p>${message}</p>
          <p><strong>Current Status:</strong> ${project.status}</p>
          <p><strong>Current TRL Level:</strong> ${project.trl_level || 'Not set'}/9</p>
          <p>Please log in to your dashboard to update your project status.</p>
          <p>Best regards,<br>SDC Innovation Hub</p>
        `;
        break;

      case 'stage_completed':
        subject = `Stage Completed: ${project.title}`;
        htmlContent = `
          <h1>TRL Stage Completed!</h1>
          <p>Dear ${userProfile.full_name || 'User'},</p>
          <p>Congratulations! You have completed a new stage in your project "<strong>${project.title}</strong>".</p>
          <p>${message}</p>
          <p><strong>Current TRL Level:</strong> ${project.trl_level || 'Not set'}/9</p>
          <p>Keep up the great work on your innovation journey!</p>
          <p>Best regards,<br>SDC Innovation Hub</p>
        `;
        break;

      default:
        throw new Error('Unknown notification type');
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "SDC Innovation Hub <onboarding@resend.dev>",
      to: [userProfile.email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-project-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
