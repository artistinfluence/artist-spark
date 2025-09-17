-- Create scraping history and analytics tables

-- Table for tracking all scraping operations
CREATE TABLE public.scraping_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL, -- 'profile' or 'track'
  target_url TEXT NOT NULL,
  target_handle TEXT,
  platform TEXT NOT NULL DEFAULT 'soundcloud',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'timeout'
  data_scraped JSONB DEFAULT '{}',
  error_message TEXT,
  response_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for storing individual track metrics over time
CREATE TABLE public.track_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_url TEXT NOT NULL,
  track_title TEXT,
  artist_handle TEXT,
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0, 
  repost_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT DEFAULT 'scraper'
);

-- Table for webhook configurations
CREATE TABLE public.webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_token TEXT,
  events JSONB DEFAULT '[]', -- array of event types to trigger
  enabled BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}',
  timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for communication platform integrations (Slack, Discord)
CREATE TABLE public.communication_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL, -- 'slack', 'discord'
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  channel TEXT,
  bot_token TEXT,
  enabled BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '[]', -- types of notifications to send
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scraping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scraping_history
CREATE POLICY "Ops can manage scraping history" 
  ON public.scraping_history 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- RLS Policies for track_metrics
CREATE POLICY "Ops can manage track metrics" 
  ON public.track_metrics 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- RLS Policies for webhook_configs
CREATE POLICY "Ops can manage webhook configs" 
  ON public.webhook_configs 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- RLS Policies for communication_integrations
CREATE POLICY "Ops can manage communication integrations" 
  ON public.communication_integrations 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Indexes for performance
CREATE INDEX idx_scraping_history_target_type ON public.scraping_history(target_type);
CREATE INDEX idx_scraping_history_status ON public.scraping_history(status);
CREATE INDEX idx_scraping_history_scraped_at ON public.scraping_history(scraped_at);
CREATE INDEX idx_track_metrics_track_url ON public.track_metrics(track_url);
CREATE INDEX idx_track_metrics_collected_at ON public.track_metrics(collected_at);

-- Create triggers for updated_at
CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON public.webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communication_integrations_updated_at
  BEFORE UPDATE ON public.communication_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();