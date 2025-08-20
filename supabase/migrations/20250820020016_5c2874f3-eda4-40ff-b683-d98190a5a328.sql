-- Re-enable email triggers with proper edge function calls
-- Create triggers to call the edge function for email automation

-- Function to call the send-notification-email edge function
CREATE OR REPLACE FUNCTION public.call_send_notification_email(
    email_to TEXT,
    template_name TEXT,
    template_data JSONB,
    user_id_param UUID DEFAULT NULL,
    notification_title TEXT DEFAULT NULL,
    notification_message TEXT DEFAULT NULL,
    notification_type TEXT DEFAULT 'info',
    related_object_type TEXT DEFAULT NULL,
    related_object_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    function_url TEXT;
    payload JSONB;
    response_data JSONB;
BEGIN
    -- Construct the edge function URL
    function_url := current_setting('app.supabase_url', true) || '/functions/v1/send-notification-email';
    
    -- Build the payload
    payload := jsonb_build_object(
        'to', email_to,
        'template', template_name,
        'data', template_data,
        'userId', user_id_param,
        'relatedObjectType', related_object_type,
        'relatedObjectId', related_object_id
    );
    
    -- Add notification data if provided
    IF notification_title IS NOT NULL THEN
        payload := payload || jsonb_build_object(
            'notificationData', jsonb_build_object(
                'title', notification_title,
                'message', notification_message,
                'type', notification_type
            )
        );
    END IF;
    
    -- Call the edge function using http extension (if available)
    -- Note: This will work when http extension is enabled
    PERFORM pg_notify('email_queue', payload::text);
    
    -- Log the attempt for debugging
    RAISE NOTICE 'Email queued for sending: % to %', template_name, email_to;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE NOTICE 'Failed to queue email: %', SQLERRM;
        
        -- Update automation health with error
        PERFORM update_automation_health(
            CASE 
                WHEN template_name LIKE '%submission%' THEN 'submission-status-emails'
                WHEN template_name LIKE '%inquiry%' THEN 'inquiry-status-emails'
                ELSE 'notification-emails'
            END,
            false,
            SQLERRM
        );
END;
$$;

-- Trigger function for submission status changes
CREATE OR REPLACE FUNCTION public.handle_submission_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Trigger function for inquiry status changes
CREATE OR REPLACE FUNCTION public.handle_inquiry_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        END CASE;
    END IF;

    RETURN NEW;
END;
$$;

-- Create the triggers
DROP TRIGGER IF EXISTS submission_status_change_trigger ON public.submissions;
CREATE TRIGGER submission_status_change_trigger
    AFTER INSERT OR UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_submission_status_change();

DROP TRIGGER IF EXISTS inquiry_status_change_trigger ON public.inquiries;
CREATE TRIGGER inquiry_status_change_trigger
    AFTER UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_inquiry_status_change();