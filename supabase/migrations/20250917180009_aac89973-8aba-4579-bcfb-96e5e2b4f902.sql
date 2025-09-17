-- Phase 1: Data Architecture Foundation - Complete System Overhaul
-- This migration establishes the foundation for the new campaign and queue management system

-- Create enhanced enums for the new system
CREATE TYPE public.campaign_status AS ENUM ('intake', 'draft', 'scheduled', 'live', 'completed', 'paused');
CREATE TYPE public.schedule_status AS ENUM ('pending', 'scheduled', 'completed', 'failed', 'cancelled');
CREATE TYPE public.connection_status AS ENUM ('linked', 'reconnect', 'disconnected', 'error');
CREATE TYPE public.automation_status AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- Enhanced members table with tier-based credits and follower tracking
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS soundcloud_handle TEXT,
ADD COLUMN IF NOT EXISTS spotify_handle TEXT,
ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS credits_monthly_grant INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS credits_cap INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS last_grant_at TIMESTAMP WITH TIME ZONE;

-- Update existing members to have initial credit balance
UPDATE public.members 
SET credits_balance = CASE 
  WHEN soundcloud_followers < 100000 THEN 1
  WHEN soundcloud_followers < 500000 THEN 2  
  WHEN soundcloud_followers < 10000000 THEN 3
  ELSE 3
END,
credits_monthly_grant = CASE 
  WHEN soundcloud_followers < 100000 THEN 1
  WHEN soundcloud_followers < 500000 THEN 2
  WHEN soundcloud_followers < 10000000 THEN 3 
  ELSE 3
END,
last_grant_at = date_trunc('month', CURRENT_DATE)
WHERE credits_balance IS NULL;

-- Member accounts table for platform connections
CREATE TABLE public.member_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('soundcloud', 'spotify')),
  handle TEXT NOT NULL,
  follower_count INTEGER DEFAULT 0,
  status public.connection_status DEFAULT 'linked',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  connection_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, platform)
);

-- Member genres many-to-many relationship
CREATE TABLE public.member_genres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  genre_family_id UUID REFERENCES public.genre_families(id) ON DELETE CASCADE,
  subgenre_id UUID REFERENCES public.subgenres(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, genre_family_id, subgenre_id)
);

-- Avoid list items for per-member exclusions
CREATE TABLE public.avoid_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  avoided_handle TEXT NOT NULL,
  platform TEXT DEFAULT 'soundcloud',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, avoided_handle, platform)
);

-- Repost credit wallet for tracking balances
CREATE TABLE public.repost_credit_wallet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 1,
  monthly_grant INTEGER NOT NULL DEFAULT 1,
  cap INTEGER NOT NULL DEFAULT 3,
  last_granted_at TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT positive_balance CHECK (balance >= 0),
  CONSTRAINT valid_cap CHECK (cap >= monthly_grant),
  CONSTRAINT balance_within_cap CHECK (balance <= cap)
);

-- Repost credit ledger for full audit trail
CREATE TABLE public.repost_credit_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT, -- 'schedule', 'manual', 'monthly_grant', 'refund'
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Campaigns table for paid campaign pipeline
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.soundcloud_clients(id),
  artist_name TEXT NOT NULL,
  track_name TEXT NOT NULL,
  track_url TEXT NOT NULL,
  goal_reposts INTEGER DEFAULT 0,
  price_usd DECIMAL(10,2),
  status public.campaign_status DEFAULT 'intake',
  start_date DATE,
  end_date DATE,
  ip_tracking_url TEXT,
  baseline_captured_at TIMESTAMP WITH TIME ZONE,
  attribution_end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced submissions table with IP integration
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS ip_tracking_url TEXT,
ADD COLUMN IF NOT EXISTS ip_schedule_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS credits_consumed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS auto_shifted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shift_reason TEXT;

-- Target proposals for shared target builder results
CREATE TABLE public.target_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('campaign', 'submission')),
  parent_id UUID NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  proposed_targets JSONB NOT NULL DEFAULT '[]',
  total_capacity INTEGER DEFAULT 0,
  estimated_credits INTEGER DEFAULT 0,
  conflicts JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

-- Schedules table for IP schedule tracking
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_schedule_id TEXT UNIQUE,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('campaign', 'submission')),
  parent_id UUID NOT NULL,
  target_handle TEXT NOT NULL,
  member_account_id UUID REFERENCES public.member_accounts(id),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status public.schedule_status DEFAULT 'pending',
  proof_url TEXT,
  credits_allocated INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Attribution snapshots for daily metrics collection
CREATE TABLE public.attribution_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('campaign', 'submission')),
  parent_id UUID NOT NULL,
  day_index INTEGER NOT NULL, -- 0 = baseline, 1 = day 1, etc.
  snapshot_date DATE NOT NULL,
  plays INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0, -- if tracking artist page
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  collection_source TEXT DEFAULT 'scraper',
  metadata JSONB DEFAULT '{}',
  UNIQUE(parent_type, parent_id, day_index)
);

-- Integration status for connection health monitoring  
CREATE TABLE public.integration_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_handle TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'soundcloud',
  member_account_id UUID REFERENCES public.member_accounts(id),
  status public.connection_status DEFAULT 'linked',
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_success_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  last_error_message TEXT,
  reconnect_sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(account_handle, platform)
);

-- Automation templates for email templates with toggles
CREATE TABLE public.automation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '{}', -- describes available variables
  enabled BOOLEAN DEFAULT true,
  trigger_events TEXT[] DEFAULT '{}', -- events that can trigger this template
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automation logs for comprehensive email tracking
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_member_id UUID REFERENCES public.members(id),
  parent_type TEXT, -- 'campaign', 'submission', 'member', etc.
  parent_id UUID,
  status public.automation_status DEFAULT 'sent',
  provider_message_id TEXT,
  subject TEXT,
  variables_used JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initialize credit wallets for existing members
INSERT INTO public.repost_credit_wallet (member_id, balance, monthly_grant, last_granted_at)
SELECT 
  id,
  CASE 
    WHEN soundcloud_followers < 100000 THEN 1
    WHEN soundcloud_followers < 500000 THEN 2
    WHEN soundcloud_followers < 10000000 THEN 3
    ELSE 3
  END,
  CASE 
    WHEN soundcloud_followers < 100000 THEN 1
    WHEN soundcloud_followers < 500000 THEN 2
    WHEN soundcloud_followers < 10000000 THEN 3
    ELSE 3
  END,
  date_trunc('month', CURRENT_DATE)
FROM public.members
WHERE id NOT IN (SELECT member_id FROM public.repost_credit_wallet);

-- Create member accounts from existing data
INSERT INTO public.member_accounts (member_id, platform, handle, follower_count, status)
SELECT 
  id,
  'soundcloud',
  COALESCE(soundcloud_handle, REGEXP_REPLACE(soundcloud_url, '^https?://soundcloud\.com/([^/]+).*$', '\1')),
  soundcloud_followers,
  'linked'
FROM public.members
WHERE soundcloud_url IS NOT NULL
AND id NOT IN (SELECT member_id FROM public.member_accounts WHERE platform = 'soundcloud');

-- Add Spotify accounts where available
INSERT INTO public.member_accounts (member_id, platform, handle, follower_count, status)
SELECT 
  id,
  'spotify', 
  COALESCE(spotify_handle, REGEXP_REPLACE(spotify_url, '^https?://open\.spotify\.com/artist/([^/]+).*$', '\1')),
  0, -- We'll update this later via API
  'linked'
FROM public.members
WHERE spotify_url IS NOT NULL
AND id NOT IN (SELECT member_id FROM public.member_accounts WHERE platform = 'spotify');

-- Create integration status records
INSERT INTO public.integration_status (account_handle, platform, member_account_id, status, last_success_at)
SELECT 
  ma.handle,
  ma.platform,
  ma.id,
  ma.status,
  ma.last_synced_at
FROM public.member_accounts ma;

-- Insert default automation templates
INSERT INTO public.automation_templates (template_key, name, subject, body_html, variables, trigger_events)
VALUES 
(
  'reconnect_prompt',
  'Account Reconnection Required',
  'Action Required: Reconnect Your {{platform}} Account',
  '<p>Hi {{member_name}},</p><p>We need you to reconnect your {{platform}} account ({{account_handle}}) to continue participating in our repost network.</p><p><a href="{{reconnect_url}}">Reconnect Account</a></p>',
  '{"member_name": "Member display name", "platform": "Platform name", "account_handle": "Social media handle", "reconnect_url": "Reconnection link"}',
  ARRAY['account_disconnected', 'sync_failed']
),
(
  'tier_promotion',
  'Congratulations on Your Tier Promotion!', 
  'You''ve been promoted to {{new_tier}}!',
  '<p>Congratulations {{member_name}}!</p><p>Based on your growth, you''ve been promoted to {{new_tier}} tier. You now receive {{monthly_credits}} credits per month!</p>',
  '{"member_name": "Member display name", "new_tier": "New tier name", "monthly_credits": "Monthly credit allocation"}',
  ARRAY['tier_updated', 'follower_milestone']
),
(
  'campaign_tracking',
  'Your Campaign is Live - Track Progress',
  'Track Your {{campaign_type}} Campaign: {{track_name}}',
  '<p>Hi {{client_name}},</p><p>Your campaign for "{{track_name}}" by {{artist_name}} is now live!</p><p><a href="{{tracking_url}}">View Campaign Progress</a></p><p>Start Date: {{start_date}}</p>',
  '{"client_name": "Client name", "campaign_type": "Campaign type", "track_name": "Track title", "artist_name": "Artist name", "tracking_url": "Campaign tracking URL", "start_date": "Campaign start date"}',
  ARRAY['campaign_started']
),
(
  'weekly_performance_digest',
  'Weekly Campaign Performance Update',
  'Week {{week_number}} Update: {{campaign_name}}',
  '<p>Hi {{client_name}},</p><p>Here''s your weekly update for {{campaign_name}}:</p><ul><li>Plays: +{{delta_plays}}</li><li>Reposts: +{{delta_reposts}}</li><li>Likes: +{{delta_likes}}</li></ul><p><a href="{{tracking_url}}">View Full Report</a></p>',
  '{"client_name": "Client name", "campaign_name": "Campaign name", "week_number": "Week number", "delta_plays": "Play count change", "delta_reposts": "Repost count change", "delta_likes": "Like count change", "tracking_url": "Full report URL"}',
  ARRAY['weekly_digest']
);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER set_member_accounts_updated_at
  BEFORE UPDATE ON public.member_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_campaigns_updated_at  
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON public.schedules  
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_integration_status_updated_at
  BEFORE UPDATE ON public.integration_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_automation_templates_updated_at
  BEFORE UPDATE ON public.automation_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_repost_credit_wallet_updated_at
  BEFORE UPDATE ON public.repost_credit_wallet
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();