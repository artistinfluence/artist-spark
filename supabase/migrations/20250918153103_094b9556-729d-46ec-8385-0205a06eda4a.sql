-- Phase 10: Create foundation tables for ML Analytics, Performance Monitoring, Security, and User Preferences

-- ML Predictions table for storing machine learning model outputs
CREATE TABLE public.ml_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  prediction_data JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Performance Metrics table for system monitoring
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  service_name TEXT NOT NULL,
  dimensions JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alert_threshold NUMERIC,
  status TEXT DEFAULT 'normal'
);

-- Audit Logs table for compliance tracking
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Preferences table for personalization
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preference_category TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_category, preference_key)
);

-- System Health Scores table
CREATE TABLE public.system_health_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_name TEXT NOT NULL,
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  status TEXT NOT NULL DEFAULT 'healthy',
  metrics JSONB DEFAULT '{}',
  last_check_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ML Predictions
CREATE POLICY "Ops can manage ML predictions"
ON public.ml_predictions
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- RLS Policies for Performance Metrics
CREATE POLICY "Ops can manage performance metrics"
ON public.performance_metrics
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- RLS Policies for Audit Logs
CREATE POLICY "Ops can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "System can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- RLS Policies for User Preferences
CREATE POLICY "Users can manage their own preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ops can view all user preferences"
ON public.user_preferences
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- RLS Policies for System Health Scores
CREATE POLICY "Ops can manage system health scores"
ON public.system_health_scores
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Create indexes for performance
CREATE INDEX idx_ml_predictions_model_type ON public.ml_predictions(model_name, prediction_type);
CREATE INDEX idx_ml_predictions_target ON public.ml_predictions(target_type, target_id);
CREATE INDEX idx_performance_metrics_name_time ON public.performance_metrics(metric_name, timestamp DESC);
CREATE INDEX idx_audit_logs_user_time ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action_time ON public.audit_logs(action, created_at DESC);
CREATE INDEX idx_user_preferences_lookup ON public.user_preferences(user_id, preference_category, preference_key);
CREATE INDEX idx_system_health_component ON public.system_health_scores(component_name, last_check_at DESC);

-- Create function to update user preferences timestamp
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically log critical actions
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _user_id UUID,
  _action TEXT,
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _details JSONB DEFAULT '{}',
  _risk_score INTEGER DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id, details, risk_score
  ) VALUES (
    _user_id, _action, _resource_type, _resource_id, _details, _risk_score
  );
END;
$$;