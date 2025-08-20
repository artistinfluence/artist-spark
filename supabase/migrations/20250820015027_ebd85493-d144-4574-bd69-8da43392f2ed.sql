-- Create email_logs table to track email automation history
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, bounced, delivered, opened
  error_message TEXT,
  resend_message_id TEXT,
  related_object_type TEXT, -- submission, inquiry, notification
  related_object_id UUID,
  user_id UUID, -- for tracking which user this email was sent to
  template_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email logs
CREATE POLICY "Ops can view all email logs" 
ON public.email_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Ops can manage email logs" 
ON public.email_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_template ON public.email_logs(template_name);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_related_object ON public.email_logs(related_object_type, related_object_id);

-- Create trigger for updated_at
CREATE TRIGGER update_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create automation_health table to track automation status
CREATE TABLE public.automation_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'healthy', -- healthy, warning, error, disabled
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_error_at TIMESTAMP WITH TIME ZONE,
  last_error_message TEXT,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_health ENABLE ROW LEVEL SECURITY;

-- Create policies for automation health
CREATE POLICY "Ops can view automation health" 
ON public.automation_health 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "System can manage automation health" 
ON public.automation_health 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_automation_health_updated_at
BEFORE UPDATE ON public.automation_health
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize automation health records
INSERT INTO public.automation_health (automation_name, status) VALUES 
('submission-status-emails', 'healthy'),
('inquiry-status-emails', 'healthy'),
('notification-emails', 'healthy'),
('queue-assignment-emails', 'healthy');

-- Function to update automation health
CREATE OR REPLACE FUNCTION public.update_automation_health(
  _automation_name TEXT,
  _success BOOLEAN,
  _error_message TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.automation_health (automation_name, status, last_run_at, success_count, total_runs)
  VALUES (_automation_name, CASE WHEN _success THEN 'healthy' ELSE 'error' END, now(), 1, 1)
  ON CONFLICT (automation_name) DO UPDATE SET
    status = CASE WHEN _success THEN 'healthy' ELSE 'error' END,
    last_run_at = now(),
    last_success_at = CASE WHEN _success THEN now() ELSE automation_health.last_success_at END,
    last_error_at = CASE WHEN NOT _success THEN now() ELSE automation_health.last_error_at END,
    last_error_message = CASE WHEN NOT _success THEN _error_message ELSE automation_health.last_error_message END,
    success_count = CASE WHEN _success THEN automation_health.success_count + 1 ELSE automation_health.success_count END,
    error_count = CASE WHEN NOT _success THEN automation_health.error_count + 1 ELSE automation_health.error_count END,
    total_runs = automation_health.total_runs + 1,
    updated_at = now();
END;
$$;