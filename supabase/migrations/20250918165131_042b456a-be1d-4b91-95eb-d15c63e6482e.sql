-- Add indexes for follower sync efficiency
CREATE INDEX IF NOT EXISTS idx_members_soundcloud_url ON public.members(soundcloud_url) WHERE soundcloud_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_last_classified_at ON public.members(last_classified_at);

-- Add column to track last follower sync
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_follower_sync_at TIMESTAMP WITH TIME ZONE;