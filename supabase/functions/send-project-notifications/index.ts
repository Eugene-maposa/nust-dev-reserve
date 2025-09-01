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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { projectId, userId, notificationType, message }: NotificationRequest = await req.json();

    console.log("Processing notification:", { projectId, userId, notificationType });

    // Get user profile and project details
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const { data: project } = await supabaseClient
      .from('projects')
      .select('title, status, current_trl_level, impact_level')
      .eq('id', projectId)
      .single();

    if (!userProfile || !project) {
      throw new Error('User or project not found');
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
          <p><strong>Impact Level:</strong> ${project.impact_level}</p>
          <p><strong>Current TRL Level:</strong> ${project.current_trl_level}</p>
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
          <p><strong>Current TRL Level:</strong> ${project.current_trl_level}/9</p>
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
          <p><strong>Current TRL Level:</strong> ${project.current_trl_level}/9</p>
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

    // Log notification in database
    const { error: notificationError } = await supabaseClient
      .from('project_notifications')
      .insert({
        project_id: projectId,
        user_id: userId,
        notification_type: notificationType,
        channel: 'email',
        message: message,
        status: emailResponse.error ? 'failed' : 'sent',
        sent_at: emailResponse.error ? null : new Date().toISOString(),
      });

    if (notificationError) {
      console.error("Error logging notification:", notificationError);
    }

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