import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  applicationId: string;
  userId: string;
  notificationType: 'approved' | 'review_needed' | 'rejected';
  message?: string;
  reviewComments?: string;
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
    const { applicationId, userId, notificationType, message, reviewComments }: NotificationRequest = await req.json();

    console.log("Processing innovation hub notification:", { applicationId, userId, notificationType });

    // Get user profile and application details
    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    const { data: application } = await supabaseClient
      .from('innovation_hub_applications')
      .select('title, project_description, innovation_type, status')
      .eq('id', applicationId)
      .single();

    if (!userProfile || !application) {
      throw new Error('User or application not found');
    }

    // Prepare email content based on notification type
    let subject: string;
    let htmlContent: string;

    switch (notificationType) {
      case 'approved':
        subject = `🎉 Your Innovation Hub Application has been Approved!`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Congratulations!</h1>
            <p>Dear ${userProfile.full_name || 'Innovator'},</p>
            
            <p>We are excited to inform you that your Innovation Hub application "<strong>${application.title}</strong>" has been <strong>approved</strong>!</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #059669; margin-top: 0;">What's Next?</h2>
              <ul style="line-height: 1.8;">
                <li>You now have access to the NUST Technovation Centre facilities</li>
                <li>Visit the centre during operating hours to begin working on your project</li>
                <li>Connect with mentors and other innovators</li>
                <li>Access our resources and equipment</li>
              </ul>
            </div>
            
            <p><strong>Project Details:</strong></p>
            <ul>
              <li><strong>Title:</strong> ${application.title}</li>
              <li><strong>Innovation Type:</strong> ${application.innovation_type || 'N/A'}</li>
            </ul>
            
            ${message ? `<p><strong>Additional Notes:</strong> ${message}</p>` : ''}
            
            <p>We look forward to seeing your innovation come to life!</p>
            
            <p>Best regards,<br><strong>NUST Technovation Centre Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              If you have any questions, please contact us at the Technovation Centre.
            </p>
          </div>
        `;
        break;

      case 'review_needed':
        subject = `📋 Action Required: Document Review for Your Innovation Hub Application`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Document Review Required</h1>
            <p>Dear ${userProfile.full_name || 'Innovator'},</p>
            
            <p>Thank you for your Innovation Hub application "<strong>${application.title}</strong>".</p>
            
            <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h2 style="color: #d97706; margin-top: 0;">Action Required</h2>
              <p>We have reviewed your application and need some additional information or documentation before we can proceed.</p>
              
              ${reviewComments ? `
                <div style="background-color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
                  <strong>Review Comments:</strong>
                  <p style="margin: 10px 0 0 0;">${reviewComments}</p>
                </div>
              ` : ''}
            </div>
            
            <p><strong>What to do next:</strong></p>
            <ol style="line-height: 1.8;">
              <li>Review the comments above carefully</li>
              <li>Log in to your account on the Innovation Hub portal</li>
              <li>Upload the required documents or make the necessary changes</li>
              <li>Submit your updated application for review</li>
            </ol>
            
            <p>Once you've addressed the review comments, we'll process your application promptly.</p>
            
            ${message ? `<p><strong>Additional Information:</strong> ${message}</p>` : ''}
            
            <p>Best regards,<br><strong>NUST Technovation Centre Team</strong></p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              If you have any questions about the review comments, please contact us at the Technovation Centre.
            </p>
          </div>
        `;
        break;

      case 'rejected':
        subject = `Application Update: ${application.title}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Application Status Update</h1>
            <p>Dear ${userProfile.full_name || 'Innovator'},</p>
            
            <p>Thank you for your interest in the NUST Innovation Hub and for submitting your application "<strong>${application.title}</strong>".</p>
            
            <p>After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
            
            ${reviewComments ? `
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <strong>Feedback:</strong>
                <p style="margin: 10px 0 0 0;">${reviewComments}</p>
              </div>
            ` : ''}
            
            <p>We encourage you to:</p>
            <ul style="line-height: 1.8;">
              <li>Review our feedback carefully</li>
              <li>Refine your innovation concept</li>
              <li>Consider reapplying in the future</li>
            </ul>
            
            ${message ? `<p><strong>Additional Information:</strong> ${message}</p>` : ''}
            
            <p>We appreciate your interest in innovation and wish you the best in your future endeavors.</p>
            
            <p>Best regards,<br><strong>NUST Technovation Centre Team</strong></p>
          </div>
        `;
        break;

      default:
        throw new Error('Unknown notification type');
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "NUST Technovation Centre <onboarding@resend.dev>",
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
    console.error("Error in send-innovation-notifications function:", error);
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
