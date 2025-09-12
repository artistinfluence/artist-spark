-- Create SoundCloud clients table
CREATE TABLE public.soundcloud_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_info JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  member_id UUID, -- Link to existing members if applicable
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SoundCloud campaigns table
CREATE TABLE public.soundcloud_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.soundcloud_clients(id),
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  track_url TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'Reposts', -- Reposts, Hyppedit, Followers, etc.
  status TEXT NOT NULL DEFAULT 'Pending', -- Active, Complete, Unreleased, Pending, Cancelled
  goals BIGINT DEFAULT 0, -- Target metrics (plays, reposts, etc.)
  remaining_metrics BIGINT DEFAULT 0,
  start_date DATE,
  submission_date DATE DEFAULT CURRENT_DATE,
  sales_price DECIMAL(10,2),
  invoice_status TEXT DEFAULT 'TBD', -- TBD, Sent, Paid, N/A, Pending
  receipt_url TEXT,
  playlist_url TEXT,
  salesperson_id UUID, -- Could reference user_id from auth.users
  notes TEXT,
  metadata JSONB DEFAULT '{}', -- For additional flexible data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign automations table
CREATE TABLE public.campaign_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_name TEXT NOT NULL,
  campaign_id UUID REFERENCES public.soundcloud_campaigns(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  trigger_type TEXT NOT NULL, -- email, slack, form_processing, etc.
  scheduled_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  result JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.soundcloud_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soundcloud_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_automations ENABLE ROW LEVEL SECURITY;

-- Create policies for soundcloud_clients
CREATE POLICY "Ops can manage all soundcloud clients" 
ON public.soundcloud_clients 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create policies for soundcloud_campaigns
CREATE POLICY "Ops can manage all soundcloud campaigns" 
ON public.soundcloud_campaigns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create policies for campaign_automations
CREATE POLICY "Ops can view campaign automations" 
ON public.campaign_automations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "System can manage campaign automations" 
ON public.campaign_automations 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_soundcloud_campaigns_client_id ON public.soundcloud_campaigns(client_id);
CREATE INDEX idx_soundcloud_campaigns_status ON public.soundcloud_campaigns(status);
CREATE INDEX idx_soundcloud_campaigns_campaign_type ON public.soundcloud_campaigns(campaign_type);
CREATE INDEX idx_soundcloud_campaigns_start_date ON public.soundcloud_campaigns(start_date);
CREATE INDEX idx_campaign_automations_campaign_id ON public.campaign_automations(campaign_id);
CREATE INDEX idx_campaign_automations_status ON public.campaign_automations(status);

-- Create triggers for updated_at
CREATE TRIGGER update_soundcloud_clients_updated_at
BEFORE UPDATE ON public.soundcloud_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_soundcloud_campaigns_updated_at
BEFORE UPDATE ON public.soundcloud_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_automations_updated_at
BEFORE UPDATE ON public.campaign_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();