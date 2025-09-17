-- Fix function security and add analytics tracking
-- Replace the function with proper search path
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