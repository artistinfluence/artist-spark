import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";

// Import email templates
import { SubmissionConfirmationEmail } from './_templates/submission-confirmation.tsx';
import { SupportConfirmationEmail } from './_templates/support-confirmation.tsx';
import { WelcomeAdmissionEmail } from './_templates/welcome-admission.tsx';
import { InquiryRejectionEmail } from './_templates/inquiry-rejection.tsx';
import { TrackingLinkEmail } from './_templates/tracking-link.tsx';
import { RequestLiveLinkEmail } from './_templates/request-live-link.tsx';
import { ReconnectInfluencePlannerEmail } from './_templates/reconnect-influence-planner.tsx';
import { SubmissionRejectedEmail } from './_templates/submission-rejected.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  template: string;
  data: Record<string, any>;
  userId?: string;
  notificationData?: {
    title: string;
    message: string;
    type: string;
    action_url?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { to, template, data, userId, notificationData }: EmailRequest = await req.json();

    console.log(`Sending ${template} email to ${to}`, { data });

    // Get email template and render
    let emailComponent;
    let subject = '';

    switch (template) {
      case 'submission-confirmation':
        emailComponent = React.createElement(SubmissionConfirmationEmail, data);
        subject = 'Submission Received';
        break;
      case 'support-confirmation':
        emailComponent = React.createElement(SupportConfirmationEmail, data);
        subject = 'SoundCloud Groups // Support Confirmation';
        break;
      case 'welcome-admission':
        emailComponent = React.createElement(WelcomeAdmissionEmail, data);
        subject = 'Welcome to Our SoundCloud Groups 👏';
        break;
      case 'inquiry-rejection':
        emailComponent = React.createElement(InquiryRejectionEmail, data);
        subject = 'Your Inquiry Status // Artist Influence SoundCloud Groups';
        break;
      case 'tracking-link':
        emailComponent = React.createElement(TrackingLinkEmail, data);
        subject = `Your Support Link // ${data.memberName}`;
        break;
      case 'request-live-link':
        emailComponent = React.createElement(RequestLiveLinkEmail, data);
        subject = 'Please Send Your Live Link';
        break;
      case 'reconnect-influence-planner':
        emailComponent = React.createElement(ReconnectInfluencePlannerEmail, data);
        subject = '[Artist Influence] ‼️ Reconnect to stay in our SoundCloud repost network 🔁';
        break;
      case 'submission-rejected':
        emailComponent = React.createElement(SubmissionRejectedEmail, data);
        subject = 'Submission: Not Approved';
        break;
      default:
        throw new Error(`Unknown email template: ${template}`);
    }

    // Render the email HTML
    const html = await renderAsync(emailComponent);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'Artist Influence <notifications@artistinfluence.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create in-app notification if userId and notificationData provided
    if (userId && notificationData) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          action_url: notificationData.action_url,
          metadata: { email_sent: true, template: template }
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
      } else {
        console.log('In-app notification created successfully');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      notificationCreated: !!(userId && notificationData)
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        template: req.url 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);