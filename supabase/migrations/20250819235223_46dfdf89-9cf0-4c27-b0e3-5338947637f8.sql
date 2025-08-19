-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION send_notification_email(
  email_to TEXT,
  template_name TEXT,
  template_data JSONB DEFAULT '{}',
  notification_title TEXT DEFAULT NULL,
  notification_message TEXT DEFAULT NULL,
  notification_type notification_type DEFAULT 'info',
  target_user_id UUID DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- This function will be called by triggers to send emails via the edge function
  -- The actual email sending will be handled by the edge function
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'to', email_to,
      'template', template_name,
      'data', template_data,
      'userId', target_user_id,
      'notificationData', CASE 
        WHEN notification_title IS NOT NULL THEN 
          jsonb_build_object(
            'title', notification_title,
            'message', notification_message,
            'type', notification_type
          )
        ELSE NULL
      END
    )
  );
END;
$$;

-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION handle_submission_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  member_record RECORD;
  email_data JSONB;
BEGIN
  -- Get member information
  SELECT m.*, u.email as user_email 
  INTO member_record
  FROM members m
  LEFT JOIN auth.users u ON u.id::text = ANY(m.emails)
  WHERE m.id = NEW.member_id;

  IF member_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Handle different status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        -- Send support confirmation email
        email_data := jsonb_build_object(
          'firstName', split_part(member_record.name, ' ', 1),
          'confirmDate', COALESCE(NEW.support_date::text, 'TBD'),
          'songName', COALESCE(NEW.artist_name, 'Your Track')
        );
        
        PERFORM send_notification_email(
          member_record.primary_email,
          'support-confirmation',
          email_data,
          'Submission Approved',
          'Your track has been approved for support on ' || COALESCE(NEW.support_date::text, 'TBD'),
          'success',
          (SELECT id FROM auth.users WHERE email = member_record.primary_email LIMIT 1)
        );
        
      WHEN 'rejected' THEN
        -- Send rejection email
        email_data := jsonb_build_object(
          'firstName', split_part(member_record.name, ' ', 1)
        );
        
        PERFORM send_notification_email(
          member_record.primary_email,
          'submission-rejected',
          email_data,
          'Submission Not Approved',
          'Your track submission was not approved this time.',
          'warning',
          (SELECT id FROM auth.users WHERE email = member_record.primary_email LIMIT 1)
        );
    END CASE;
  END IF;

  -- Send confirmation email for new submissions
  IF TG_OP = 'INSERT' THEN
    email_data := jsonb_build_object(
      'firstName', split_part(member_record.name, ' ', 1),
      'songName', COALESCE(NEW.artist_name, 'Your Track'),
      'submissionUrl', NEW.track_url,
      'dateRequested', COALESCE(NEW.support_date::text, 'TBD')
    );
    
    PERFORM send_notification_email(
      member_record.primary_email,
      'submission-confirmation',
      email_data,
      'Submission Received',
      'We have received your track submission and will review it shortly.',
      'submission',
      (SELECT id FROM auth.users WHERE email = member_record.primary_email LIMIT 1)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fix security warnings by setting proper search_path for functions  
CREATE OR REPLACE FUNCTION handle_inquiry_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  email_data JSONB;
BEGIN
  -- Handle inquiry status changes
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'admitted' THEN
        -- Send welcome email
        email_data := jsonb_build_object(
          'firstName', split_part(NEW.name, ' ', 1),
          'submissionFormUrl', '/portal/submit'
        );
        
        PERFORM send_notification_email(
          NEW.email,
          'welcome-admission',
          email_data,
          'Welcome to SoundCloud Groups',
          'Congratulations! You have been accepted to our SoundCloud groups.',
          'success',
          (SELECT id FROM auth.users WHERE email = NEW.email LIMIT 1)
        );
        
      WHEN 'rejected' THEN
        -- Send rejection email
        email_data := jsonb_build_object(
          'firstName', split_part(NEW.name, ' ', 1)
        );
        
        PERFORM send_notification_email(
          NEW.email,
          'inquiry-rejection',
          email_data,
          'Inquiry Status Update',
          'Thank you for your interest. We are unable to accept your application at this time.',
          'info',
          (SELECT id FROM auth.users WHERE email = NEW.email LIMIT 1)
        );
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;