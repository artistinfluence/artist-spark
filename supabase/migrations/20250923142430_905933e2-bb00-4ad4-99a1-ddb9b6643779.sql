-- Create campaign_receipt_links table for managing influence planner receipts
CREATE TABLE public.campaign_receipt_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  supporter_name TEXT NOT NULL,
  supporter_handle TEXT NOT NULL,
  reach_amount INTEGER NOT NULL DEFAULT 0,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_receipt_links ENABLE ROW LEVEL SECURITY;

-- Create policies for ops to manage campaign receipt links
CREATE POLICY "Ops can manage all campaign receipt links" 
ON public.campaign_receipt_links 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_campaign_receipt_links_updated_at
BEFORE UPDATE ON public.campaign_receipt_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();