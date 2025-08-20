import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';

// Import email templates
import { SubmissionConfirmationEmail } from './_templates/submission-confirmation.tsx';
import { SubmissionRejectedEmail } from './_templates/submission-rejected.tsx';
import { WelcomeAdmissionEmail } from './_templates/welcome-admission.tsx';
import { InquiryRejectionEmail } from './_templates/inquiry-rejection.tsx';
import { ReconnectInfluencePlannerEmail } from './_templates/reconnect-influence-planner.tsx';
import { RequestLiveLinkEmail } from './_templates/request-live-link.tsx';
import { TrackingLinkEmail } from './_templates/tracking-link.tsx';
import { SupportConfirmationEmail } from './_templates/support-confirmation.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

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
  relatedObjectType?: string;
  relatedObjectId?: string;
  testEmail?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('send-notification-email function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let emailLogId = null;
  let automationSuccess = false;
  let automationName = 'notification-emails';

  try {
    const {
      to,
      template,
      data,
      userId,
      notificationData,
      relatedObjectType,
      relatedObjectId,
      testEmail = false
    }: EmailRequest = await req.json();

    console.log('Processing email request:', {
      to: to.substring(0, 3) + '***',
      template,
      userId: userId?.substring(0, 8) + '***',
      hasNotificationData: !!notificationData,
      relatedObjectType,
      relatedObjectId: relatedObjectId?.substring(0, 8) + '***' || null,
      testEmail
    });

    // Set automation name based on template
    if (template.includes('submission')) {
      automationName = 'submission-status-emails';
    } else if (template.includes('inquiry')) {
      automationName = 'inquiry-status-emails';
    } else if (template.includes('queue')) {
      automationName = 'queue-assignment-emails';
    }

    // Select subject based on template
    let subject = '';
    switch (template) {
      case 'submission-confirmation':
        subject = 'Submission Received - Under Review';
        break;
      case 'submission-rejected':
        subject = 'Submission Update';
        break;
      case 'support-confirmation':
        subject = 'Your Track Has Been Approved!';
        break;
      case 'welcome-admission':
        subject = 'Welcome to SoundCloud Groups!';
        break;
      case 'inquiry-rejection':
        subject = 'Application Status Update';
        break;
      case 'reconnect-influence-planner':
        subject = 'Let\'s Reconnect - Artist Influence';
        break;
      case 'request-live-link':
        subject = 'Live Link Required';
        break;
      case 'tracking-link':
        subject = 'Your Tracking Link';
        break;
      default:
        subject = testEmail ? 'Test Email from SoundCloud Groups' : 'Notification';
    }

    // Create email log entry
    const { data: emailLogData, error: logError } = await supabase
      .from('email_logs')
      .insert({
        template_name: template,
        recipient_email: to,
        subject: subject,
        status: 'pending',
        related_object_type: relatedObjectType,
        related_object_id: relatedObjectId,
        user_id: userId,
        template_data: data,
        metadata: { testEmail }
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Failed to create email log:', logError);
    } else {
      emailLogId = emailLogData.id;
      console.log('Email log created:', emailLogId);
    }

    // Select and render template
    let emailElement;
    
    if (testEmail) {
      // Simple test email
      emailElement = React.createElement('div', {}, 
        React.createElement('h1', {}, 'Test Email'),
        React.createElement('p', {}, 'This is a test email from SoundCloud Groups automation system.'),
        React.createElement('p', {}, `Template: ${template}`),
        React.createElement('p', {}, `Sent at: ${new Date().toISOString()}`)
      );
    } else {
      switch (template) {
        case 'submission-confirmation':
          emailElement = React.createElement(SubmissionConfirmationEmail, data);
          break;
        case 'submission-rejected':
          emailElement = React.createElement(SubmissionRejectedEmail, data);
          break;
        case 'support-confirmation':
          emailElement = React.createElement(SupportConfirmationEmail, data);
          break;
        case 'welcome-admission':
          emailElement = React.createElement(WelcomeAdmissionEmail, data);
          break;
        case 'inquiry-rejection':
          emailElement = React.createElement(InquiryRejectionEmail, data);
          break;
        case 'reconnect-influence-planner':
          emailElement = React.createElement(ReconnectInfluencePlannerEmail, data);
          break;
        case 'request-live-link':
          emailElement = React.createElement(RequestLiveLinkEmail, data);
          break;
        case 'tracking-link':
          emailElement = React.createElement(TrackingLinkEmail, data);
          break;
        default:
          throw new Error(`Unknown template: ${template}`);
      }
    }

    // Render email HTML
    const emailHtml = await renderAsync(emailElement);
    console.log('Email HTML rendered successfully');

    // Send email via Resend
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: 'SoundCloud Groups <onboarding@resend.dev>', // Using verified domain temporarily
      to: [to],
      subject: subject,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      
      // Update email log with error
      if (emailLogId) {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: emailError.message || 'Unknown error'
          })
          .eq('id', emailLogId);
      }
      
      // Update automation health
      await supabase.rpc('update_automation_health', {
        _automation_name: automationName,
        _success: false,
        _error_message: emailError.message || 'Email sending failed'
      });
      
      throw emailError;
    }

    console.log('Email sent successfully:', emailResponse?.id);

    // Update email log with success
    if (emailLogId) {
      await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          resend_message_id: emailResponse?.id,
          sent_at: new Date().toISOString()
        })
        .eq('id', emailLogId);
    }

    automationSuccess = true;

    // Create notification if requested
    let notificationCreated = false;
    if (userId && notificationData) {
      try {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            action_url: notificationData.action_url
          });

        if (notificationError) {
          console.error('Notification creation error:', notificationError);
        } else {
          console.log('Notification created successfully');
          notificationCreated = true;
        }
      } catch (notifError) {
        console.error('Notification creation failed:', notifError);
      }
    }

    // Update automation health with success
    await supabase.rpc('update_automation_health', {
      _automation_name: automationName,
      _success: true
    });

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResponse?.id,
      notificationCreated,
      emailLogId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-notification-email function:', error);
    
    // Update email log with error if we have one
    if (emailLogId) {
      try {
        await supabase
          .from('email_logs')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error'
          })
          .eq('id', emailLogId);
      } catch (logUpdateError) {
        console.error('Failed to update email log with error:', logUpdateError);
      }
    }

    // Update automation health
    try {
      await supabase.rpc('update_automation_health', {
        _automation_name: automationName,
        _success: false,
        _error_message: error.message || 'Unknown error occurred'
      });
    } catch (healthUpdateError) {
      console.error('Failed to update automation health:', healthUpdateError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      emailLogId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);