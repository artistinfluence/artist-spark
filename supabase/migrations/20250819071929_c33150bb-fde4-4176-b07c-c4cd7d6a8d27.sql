
-- Grant admin role to Jared (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT 'f112706b-7004-4bba-ad9c-36b0644815c3'::uuid, 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = 'f112706b-7004-4bba-ad9c-36b0644815c3'::uuid
    AND role = 'admin'::app_role
);
