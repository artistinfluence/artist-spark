-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.calculate_repost_limit(follower_count integer, manual_override integer DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Use manual override if set
  IF manual_override IS NOT NULL THEN
    RETURN manual_override;
  END IF;
  
  -- Otherwise use follower-based calculation
  IF follower_count < 100000 THEN
    RETURN 1;
  ELSIF follower_count < 500000 THEN
    RETURN 2;
  ELSIF follower_count < 5000000 THEN
    RETURN 3;
  ELSE
    RETURN 3; -- Max limit for 5M+ followers
  END IF;
END;
$function$;