-- Add manual repost credit override columns to members table
ALTER TABLE public.members 
ADD COLUMN manual_monthly_repost_override integer,
ADD COLUMN override_reason text,
ADD COLUMN override_set_by uuid,
ADD COLUMN override_set_at timestamp with time zone;

-- Update the calculate_repost_limit function to check for manual overrides first
CREATE OR REPLACE FUNCTION public.calculate_repost_limit(follower_count integer, manual_override integer DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
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

-- Update the computed column to use manual override
ALTER TABLE public.members 
DROP COLUMN computed_monthly_repost_limit;

ALTER TABLE public.members 
ADD COLUMN computed_monthly_repost_limit integer 
GENERATED ALWAYS AS (
  CASE 
    WHEN manual_monthly_repost_override IS NOT NULL THEN manual_monthly_repost_override
    ELSE calculate_repost_limit(COALESCE(soundcloud_followers, followers, 0))
  END
) STORED;