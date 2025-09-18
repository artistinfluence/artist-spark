-- Add function to calculate repost limit based on followers
CREATE OR REPLACE FUNCTION public.calculate_repost_limit(follower_count integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
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

-- Add computed column for monthly_repost_limit to members table
ALTER TABLE public.members 
ADD COLUMN computed_monthly_repost_limit integer 
GENERATED ALWAYS AS (calculate_repost_limit(COALESCE(soundcloud_followers, 0))) STORED;

-- Update repost_credit_wallet to use computed limits
-- Add trigger to sync wallet monthly_grant with computed limit
CREATE OR REPLACE FUNCTION public.sync_wallet_monthly_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Update wallet monthly_grant to match member's computed limit
  UPDATE repost_credit_wallet 
  SET monthly_grant = NEW.computed_monthly_repost_limit,
      cap = NEW.computed_monthly_repost_limit
  WHERE member_id = NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-update wallet when member data changes
CREATE TRIGGER sync_member_wallet_limits
  AFTER UPDATE OF soundcloud_followers ON members
  FOR EACH ROW
  EXECUTE FUNCTION sync_wallet_monthly_grant();