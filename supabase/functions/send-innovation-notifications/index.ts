import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  applicationId?: string;
  userId: string;
  notificationType: 'application_received' | 'approved' | 'review_needed' | 'rejected';
  message?: string;
  reviewComments?: string;
  // For application_received, pass data directly
  applicantName?: string;
  applicantEmail?: string;
  projectTitle?: string;
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
    const { applicationId, userId, notificationType, message, reviewComments, applicantName, applicantEmail, projectTitle }: NotificationRequest = await req.json();

    console.log("Processing innovation hub notification:", { applicationId, userId, notificationType });

    // Authorization: For status change notifications (approved, rejected, review_needed), require admin role
    if (notificationType !== 'application_received') {
      const { data: adminRole, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', authenticatedUserId)
        .eq('role', 'admin')
        .single();

      if (roleError || !adminRole) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin role required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // For application_received, verify the authenticated user matches the userId
      if (authenticatedUserId !== userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Can only send notifications for your own applications' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    let userEmail = applicantEmail;
    let userName = applicantName;
    let appTitle = projectTitle;

    // For status change notifications, fetch from database
    if (notificationType !== 'application_received' && applicationId) {
      const { data: userProfile } = await supabaseClient
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      const { data: application } = await supabaseClient
        .from('innovation_hub_applications')
        .select('title, full_name, email, project_description, innovation_type, status')
        .eq('id', applicationId)
        .single();

      if (!userProfile && !application) {
        throw new Error('User or application not found');
      }

      userEmail = application?.email || userProfile?.email;
      userName = application?.full_name || userProfile?.full_name || 'Innovator';
      appTitle = application?.title;
    }

    if (!userEmail) {
      throw new Error('No email address found');
    }

    // Prepare email content based on notification type
    let subject: string;
    let htmlContent: string;

    switch (notificationType) {
      case 'application_received':
        subject = 'NUST Innovation Hub - Application Received';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1a365d; margin: 0;">NATIONAL UNIVERSITY OF SCIENCE AND TECHNOLOGY</h2>
              <p style="color: #4a5568; margin: 5px 0;">Innovation and Business Development (IBD)</p>
            </div>
            
            <p style="color: #2d3748;">Dear ${userName},</p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              Thank you for submitting your application to join the Innovation Hub at the National University of Science and Technology (NUST) under the Innovation and Business Development (IBD) unit.
            </p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              We acknowledge receipt of your application titled "<strong>${appTitle}</strong>" and sincerely appreciate your interest in advancing innovation through our platform.
            </p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              Your application is currently under review by our technical and strategic teams. You will be notified of the outcome within the next <strong>5–10 working days</strong>. Should any additional information or clarification be required during the review process, we will be in touch.
            </p>
            
            <div style="background-color: #f7fafc; border-left: 4px solid #3182ce; padding: 15px; margin: 20px 0;">
              <p style="color: #2d3748; margin: 0; line-height: 1.6;">
                <strong>Interim Access:</strong> While your project is under review, your application grants you interim access to selected resources and equipment under the Innovation and Business Development (IBD) unit. In particular, you will be granted access to the <strong>Software Development Centre (SDC)</strong>, which is to be used strictly for the advancement and development of your proposed project. Please note that all lab rules, protocols, and usage policies will apply during this period.
              </p>
            </div>
            
            <p style="color: #2d3748; line-height: 1.6;">
              If you have any questions or need further assistance, feel free to contact us.
            </p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              We look forward to seeing your innovation grow and to potentially working with you more closely in the future.
            </p>
            
            <p style="color: #2d3748; margin-top: 30px;">
              Warm regards,<br><br>
              <strong>Innovation Lead - IBD</strong><br>
              National University of Science and Technology
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 12px; line-height: 1.6;">
              <strong>Disclaimer:</strong> <a href="https://www.nust.ac.zw/index.php/e-mail-disclaimer.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/e-mail-disclaimer.html</a><br>
              <strong>Privacy Notice:</strong> <a href="https://www.nust.ac.zw/index.php/privacy-notice.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/privacy-notice.html</a>
            </p>
          </div>
        `;
        break;

      case 'approved':
        subject = `NUST Innovation Hub - Application Approved!`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1a365d; margin: 0;">NATIONAL UNIVERSITY OF SCIENCE AND TECHNOLOGY</h2>
              <p style="color: #4a5568; margin: 5px 0;">Innovation and Business Development (IBD)</p>
            </div>
            
            <p style="color: #2d3748;">Dear ${userName},</p>
            
            <div style="background-color: #c6f6d5; border-left: 4px solid #38a169; padding: 15px; margin: 20px 0;">
              <p style="color: #276749; margin: 0; font-weight: bold;">
                Congratulations! Your application has been APPROVED!
              </p>
            </div>
            
            <p style="color: #2d3748; line-height: 1.6;">
              We are pleased to inform you that your application titled "<strong>${appTitle}</strong>" to join the Innovation Hub has been reviewed and approved by our technical and strategic teams.
            </p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              You now have full access to the Innovation Hub facilities, including:
            </p>
            <ul style="color: #2d3748; line-height: 1.8;">
              <li>Software Development Centre (SDC)</li>
              <li>Prototyping facilities</li>
              <li>Meeting and collaboration spaces</li>
              <li>Mentorship and technical support</li>
            </ul>
            
            ${reviewComments ? `
            <div style="background-color: #f7fafc; border-left: 4px solid #3182ce; padding: 15px; margin: 20px 0;">
              <p style="color: #2d3748; margin: 0;"><strong>Additional Notes:</strong></p>
              <p style="color: #4a5568; margin: 10px 0 0 0;">${reviewComments}</p>
            </div>
            ` : ''}
            
            <p style="color: #2d3748; line-height: 1.6;">
              Please visit the IBD office to complete your onboarding and receive your access credentials.
            </p>
            
            <p style="color: #2d3748; margin-top: 30px;">
              Warm regards,<br><br>
              <strong>Innovation Lead - IBD</strong><br>
              National University of Science and Technology
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 12px; line-height: 1.6;">
              <strong>Disclaimer:</strong> <a href="https://www.nust.ac.zw/index.php/e-mail-disclaimer.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/e-mail-disclaimer.html</a><br>
              <strong>Privacy Notice:</strong> <a href="https://www.nust.ac.zw/index.php/privacy-notice.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/privacy-notice.html</a>
            </p>
          </div>
        `;
        break;

      case 'review_needed':
        subject = 'NUST Innovation Hub - Additional Information Required';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1a365d; margin: 0;">NATIONAL UNIVERSITY OF SCIENCE AND TECHNOLOGY</h2>
              <p style="color: #4a5568; margin: 5px 0;">Innovation and Business Development (IBD)</p>
            </div>
            
            <p style="color: #2d3748;">Dear ${userName},</p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              Thank you for your application titled "<strong>${appTitle}</strong>" to the Innovation Hub.
            </p>
            
            <div style="background-color: #fefcbf; border-left: 4px solid #d69e2e; padding: 15px; margin: 20px 0;">
              <p style="color: #744210; margin: 0; font-weight: bold;">
                Action Required: Additional Information/Documents Needed
              </p>
            </div>
            
            <p style="color: #2d3748; line-height: 1.6;">
              After reviewing your application, our team requires additional information or clarification before we can proceed with the final decision.
            </p>
            
            ${reviewComments ? `
            <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: #2d3748; margin: 0 0 10px 0;"><strong>Reviewer Comments:</strong></p>
              <p style="color: #4a5568; margin: 0; white-space: pre-line;">${reviewComments}</p>
            </div>
            ` : ''}
            
            <p style="color: #2d3748; line-height: 1.6;">
              Please address the above requirements and update your application or contact us with the requested information within <strong>7 working days</strong>.
            </p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              You can update your application by logging into the Technovation Centre portal or by contacting the IBD office directly.
            </p>
            
            <p style="color: #2d3748; margin-top: 30px;">
              Warm regards,<br><br>
              <strong>Innovation Lead - IBD</strong><br>
              National University of Science and Technology
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 12px; line-height: 1.6;">
              <strong>Disclaimer:</strong> <a href="https://www.nust.ac.zw/index.php/e-mail-disclaimer.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/e-mail-disclaimer.html</a><br>
              <strong>Privacy Notice:</strong> <a href="https://www.nust.ac.zw/index.php/privacy-notice.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/privacy-notice.html</a>
            </p>
          </div>
        `;
        break;

      case 'rejected':
        subject = 'NUST Innovation Hub - Application Update';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1a365d; margin: 0;">NATIONAL UNIVERSITY OF SCIENCE AND TECHNOLOGY</h2>
              <p style="color: #4a5568; margin: 5px 0;">Innovation and Business Development (IBD)</p>
            </div>
            
            <p style="color: #2d3748;">Dear ${userName},</p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              Thank you for your application titled "<strong>${appTitle}</strong>" to the Innovation Hub.
            </p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              After careful review by our technical and strategic teams, we regret to inform you that your application has not been approved at this time.
            </p>
            
            ${reviewComments ? `
            <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: #2d3748; margin: 0 0 10px 0;"><strong>Feedback from Reviewers:</strong></p>
              <p style="color: #4a5568; margin: 0; white-space: pre-line;">${reviewComments}</p>
            </div>
            ` : ''}
            
            <p style="color: #2d3748; line-height: 1.6;">
              We encourage you to address the feedback provided and consider reapplying in the future. If you have any questions about this decision or would like guidance on strengthening your application, please don't hesitate to contact us.
            </p>
            
            <p style="color: #2d3748; line-height: 1.6;">
              We appreciate your interest in the Innovation Hub and wish you success in your innovative endeavors.
            </p>
            
            <p style="color: #2d3748; margin-top: 30px;">
              Warm regards,<br><br>
              <strong>Innovation Lead - IBD</strong><br>
              National University of Science and Technology
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #718096; font-size: 12px; line-height: 1.6;">
              <strong>Disclaimer:</strong> <a href="https://www.nust.ac.zw/index.php/e-mail-disclaimer.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/e-mail-disclaimer.html</a><br>
              <strong>Privacy Notice:</strong> <a href="https://www.nust.ac.zw/index.php/privacy-notice.html" style="color: #3182ce;">https://www.nust.ac.zw/index.php/privacy-notice.html</a>
            </p>
          </div>
        `;
        break;

      default:
        throw new Error('Unknown notification type');
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "NUST Innovation Hub <onboarding@resend.dev>",
      to: [userEmail],
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
