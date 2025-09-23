-- Add submission_id column to campaign_receipt_links table
ALTER TABLE public.campaign_receipt_links 
ADD COLUMN submission_id UUID REFERENCES public.submissions(id);

-- Add constraint that either campaign_id OR submission_id must be set (not both)
ALTER TABLE public.campaign_receipt_links 
ADD CONSTRAINT campaign_receipt_links_parent_check 
CHECK (
  (campaign_id IS NOT NULL AND submission_id IS NULL) OR 
  (campaign_id IS NULL AND submission_id IS NOT NULL)
);

-- Update RLS policies to handle submission access
DROP POLICY IF EXISTS "Ops can manage all campaign receipt links" ON public.campaign_receipt_links;

CREATE POLICY "Ops can manage all receipt links" 
ON public.campaign_receipt_links 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Allow members to view receipt links for their own submissions
CREATE POLICY "Members can view their own submission receipt links" 
ON public.campaign_receipt_links 
FOR SELECT 
USING (
  submission_id IS NOT NULL AND 
  submission_id IN (
    SELECT id FROM public.submissions 
    WHERE member_id = get_member_id_for_user(auth.uid())
  )
);