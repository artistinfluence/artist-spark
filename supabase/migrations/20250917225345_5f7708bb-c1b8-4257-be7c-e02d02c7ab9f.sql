-- Analytics and Business Intelligence Database Enhancements
-- Create tables and views to support advanced analytics and reporting

-- Analytics aggregation table for pre-calculated metrics
CREATE TABLE public.analytics_aggregations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    dimensions JSONB DEFAULT '{}',
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    granularity TEXT NOT NULL DEFAULT 'daily', -- hourly, daily, weekly, monthly
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reporting configurations for custom reports and scheduled exports
CREATE TABLE public.reporting_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    report_type TEXT NOT NULL, -- revenue, members, campaigns, queue, custom
    config JSONB NOT NULL DEFAULT '{}', -- filters, metrics, formatting options
    schedule_type TEXT DEFAULT 'manual', -- manual, daily, weekly, monthly
    schedule_config JSONB DEFAULT '{}', -- cron expression, recipients, etc.
    format TEXT DEFAULT 'csv', -- csv, pdf, json, excel
    created_by UUID,
    enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics events for tracking user interactions and behavior
CREATE TABLE public.analytics_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    session_id TEXT,
    event_type TEXT NOT NULL, -- page_view, click, form_submit, export, etc.
    event_name TEXT NOT NULL,
    properties JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}', -- user_agent, ip, referrer, etc.
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Member cohort analysis table
CREATE TABLE public.member_cohorts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_month DATE NOT NULL, -- first month of member activity
    member_id UUID NOT NULL,
    months_active INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- array of active months relative to cohort_month
    last_activity_at TIMESTAMP WITH TIME ZONE,
    total_submissions INTEGER DEFAULT 0,
    total_supports INTEGER DEFAULT 0,
    total_credits_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_aggregations_metric_period ON public.analytics_aggregations(metric_name, period_start, period_end);
CREATE INDEX idx_analytics_aggregations_granularity ON public.analytics_aggregations(granularity, calculated_at);
CREATE INDEX idx_reporting_configurations_schedule ON public.reporting_configurations(schedule_type, enabled, last_run_at);
CREATE INDEX idx_analytics_events_type_timestamp ON public.analytics_events(event_type, timestamp);
CREATE INDEX idx_analytics_events_user_session ON public.analytics_events(user_id, session_id);
CREATE INDEX idx_member_cohorts_month ON public.member_cohorts(cohort_month);
CREATE INDEX idx_member_cohorts_member ON public.member_cohorts(member_id);

-- Enable Row Level Security
ALTER TABLE public.analytics_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_cohorts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics tables
CREATE POLICY "Ops can view all analytics aggregations" ON public.analytics_aggregations
    FOR SELECT USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );

CREATE POLICY "System can manage analytics aggregations" ON public.analytics_aggregations
    FOR ALL USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    )
    WITH CHECK (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );

CREATE POLICY "Ops can manage reporting configurations" ON public.reporting_configurations
    FOR ALL USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    )
    WITH CHECK (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );

CREATE POLICY "System can create analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true); -- Allow system to track events

CREATE POLICY "Ops can view analytics events" ON public.analytics_events
    FOR SELECT USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );

CREATE POLICY "Ops can view member cohorts" ON public.member_cohorts
    FOR SELECT USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );

CREATE POLICY "System can manage member cohorts" ON public.member_cohorts
    FOR ALL USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    )
    WITH CHECK (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );

-- Add updated_at triggers
CREATE TRIGGER update_reporting_configurations_updated_at
    BEFORE UPDATE ON public.reporting_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_member_cohorts_updated_at
    BEFORE UPDATE ON public.member_cohorts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create materialized views for common analytics queries
CREATE MATERIALIZED VIEW public.member_performance_summary AS
SELECT 
    m.id as member_id,
    m.name,
    m.status,
    m.size_tier,
    COUNT(s.id) as total_submissions,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_submissions,
    COUNT(CASE WHEN s.status = 'rejected' THEN 1 END) as rejected_submissions,
    COUNT(CASE WHEN s.status = 'pending' THEN 1 END) as pending_submissions,
    COALESCE(AVG(CASE WHEN s.status = 'approved' THEN s.expected_reach_planned END), 0) as avg_reach,
    COUNT(qa.id) as total_queue_assignments,
    COUNT(CASE WHEN qa.status = 'completed' THEN 1 END) as completed_assignments,
    m.net_credits,
    EXTRACT(EPOCH FROM (now() - m.created_at))/86400 as days_since_joined
FROM public.members m
LEFT JOIN public.submissions s ON s.member_id = m.id
LEFT JOIN public.queue_assignments qa ON qa.supporter_id = m.id
GROUP BY m.id, m.name, m.status, m.size_tier, m.net_credits, m.created_at;

-- Create index on materialized view
CREATE INDEX idx_member_performance_summary_member_id ON public.member_performance_summary(member_id);

-- Revenue analytics materialized view
CREATE MATERIALIZED VIEW public.revenue_summary AS
SELECT 
    DATE_TRUNC('month', c.created_at) as month,
    COUNT(c.id) as total_campaigns,
    SUM(c.price_usd) as total_revenue,
    AVG(c.price_usd) as avg_campaign_value,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_campaigns,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_campaigns,
    SUM(c.goal_reposts) as total_goal_reposts,
    COUNT(DISTINCT c.client_id) as unique_clients
FROM public.campaigns c
WHERE c.price_usd IS NOT NULL
GROUP BY DATE_TRUNC('month', c.created_at)
ORDER BY month DESC;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.member_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.revenue_summary;
END;
$$;