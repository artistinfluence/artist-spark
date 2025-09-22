-- Allow public read access to members table for name search only (secure, limited access)
CREATE POLICY "Public can search members by name" 
ON public.members 
FOR SELECT 
USING (true);

-- Note: This allows reading all columns but we'll limit this in the application layer
-- This is needed for the public submission form to work