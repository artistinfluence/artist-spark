-- Create admin account for jared@artistinfluence.com
-- First insert a test user role (this will be linked to auth user after signup)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'jared@artistinfluence.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create helper functions for role checking
CREATE OR REPLACE FUNCTION public.check_user_is_member(_user_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE _user_email = ANY(emails)
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.get_member_for_user(_user_email text)
RETURNS TABLE(
  id uuid,
  name text,
  primary_email text,
  emails text[],
  status member_status,
  size_tier size_tier,
  monthly_submission_limit integer,
  submissions_this_month integer,
  net_credits integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT m.id, m.name, m.primary_email, m.emails, m.status, m.size_tier, 
         m.monthly_submission_limit, m.submissions_this_month, m.net_credits
  FROM public.members m
  WHERE _user_email = ANY(m.emails)
  LIMIT 1
$function$;

-- Create some test data
-- Insert test member records
INSERT INTO public.members (name, primary_email, emails, status, size_tier, monthly_submission_limit) VALUES
('Test Artist One', 'artist1@test.com', '{"artist1@test.com", "artist1.alt@test.com"}', 'active', 'T2', 4),
('Test Artist Two', 'artist2@test.com', '{"artist2@test.com"}', 'active', 'T1', 4),
('Test Artist Three', 'artist3@test.com', '{"artist3@test.com"}', 'active', 'T3', 6)
ON CONFLICT DO NOTHING;

-- Insert test genre families
INSERT INTO public.genre_families (name, active) VALUES
('Electronic', true),
('Hip Hop', true),
('Rock', true)
ON CONFLICT DO NOTHING;

-- Insert test subgenres (linking to the genre families)
INSERT INTO public.subgenres (name, family_id, patterns, active, order_index)
SELECT 'House', gf.id, '{"house", "deep house", "tech house"}', true, 1
FROM public.genre_families gf WHERE gf.name = 'Electronic'
UNION ALL
SELECT 'Techno', gf.id, '{"techno", "minimal techno"}', true, 2
FROM public.genre_families gf WHERE gf.name = 'Electronic'
UNION ALL
SELECT 'Trap', gf.id, '{"trap", "trap music"}', true, 1
FROM public.genre_families gf WHERE gf.name = 'Hip Hop'
ON CONFLICT DO NOTHING;