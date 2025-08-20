-- Fix CASE statements in trigger functions to prevent "case not found" errors

-- Update handle_submission_status_change function
CREATE OR REPLACE FUNCTION public.handle_submission_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    member_record RECORD;
    email_data JSONB;
    user_id_for_notification UUID;
BEGIN
    -- Get member information
    SELECT m.* INTO member_record
    FROM members m
    WHERE m.id = NEW.member_id;

    IF member_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get user ID for notifications
    SELECT id INTO user_id_for_notification 
    FROM auth.users 
    WHERE email = member_record.primary_email 
    LIMIT 1;

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
                
                PERFORM call_send_notification_email(
                    member_record.primary_email,
                    'support-confirmation',
                    email_data,
                    user_id_for_notification,
                    'Submission Approved',
                    'Your track has been approved for support on ' || COALESCE(NEW.support_date::text, 'TBD'),
                    'success',
                    'submission',
                    NEW.id
                );
                
            WHEN 'rejected' THEN
                -- Send rejection email
                email_data := jsonb_build_object(
                    'firstName', split_part(member_record.name, ' ', 1)
                );
                
                PERFORM call_send_notification_email(
                    member_record.primary_email,
                    'submission-rejected',
                    email_data,
                    user_id_for_notification,
                    'Submission Not Approved',
                    'Your track submission was not approved this time.',
                    'warning',
                    'submission',
                    NEW.id
                );
            ELSE
                -- Handle other status changes (including reset to 'new')
                NULL;
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
        
        PERFORM call_send_notification_email(
            member_record.primary_email,
            'submission-confirmation',
            email_data,
            user_id_for_notification,
            'Submission Received',
            'We have received your track submission and will review it shortly.',
            'submission',
            'submission',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$function$;

-- Update handle_inquiry_status_change function
CREATE OR REPLACE FUNCTION public.handle_inquiry_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    email_data JSONB;
    user_id_for_notification UUID;
BEGIN
    -- Get user ID for notifications
    SELECT id INTO user_id_for_notification 
    FROM auth.users 
    WHERE email = NEW.email 
    LIMIT 1;

    -- Handle inquiry status changes
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        CASE NEW.status
            WHEN 'admitted' THEN
                -- Send welcome email
                email_data := jsonb_build_object(
                    'firstName', split_part(NEW.name, ' ', 1),
                    'submissionFormUrl', '/portal/submit'
                );
                
                PERFORM call_send_notification_email(
                    NEW.email,
                    'welcome-admission',
                    email_data,
                    user_id_for_notification,
                    'Welcome to SoundCloud Groups',
                    'Congratulations! You have been accepted to our SoundCloud groups.',
                    'success',
                    'inquiry',
                    NEW.id
                );
                
            WHEN 'rejected' THEN
                -- Send rejection email
                email_data := jsonb_build_object(
                    'firstName', split_part(NEW.name, ' ', 1)
                );
                
                PERFORM call_send_notification_email(
                    NEW.email,
                    'inquiry-rejection',
                    email_data,
                    user_id_for_notification,
                    'Inquiry Status Update',
                    'Thank you for your interest. We are unable to accept your application at this time.',
                    'info',
                    'inquiry',
                    NEW.id
                );
            ELSE
                -- Handle other status changes
                NULL;
        END CASE;
    END IF;

    RETURN NEW;
END;
$function$;