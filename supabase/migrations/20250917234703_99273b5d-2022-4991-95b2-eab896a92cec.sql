-- Fix security linter warnings for analytics enhancements

-- Fix function search path for security compliance
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.member_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.revenue_summary;
END;
$$;

-- Secure materialized views by adding RLS policies to prevent direct API access
ALTER TABLE public.member_performance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_summary ENABLE ROW LEVEL SECURITY;

-- Only allow ops to access materialized views directly
CREATE POLICY "Ops can view member performance summary" ON public.member_performance_summary
    FOR SELECT USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );

CREATE POLICY "Ops can view revenue summary" ON public.revenue_summary
    FOR SELECT USING (
        has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    );