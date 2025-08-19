-- Add new fields to members table for external platform integration
ALTER TABLE public.members 
ADD COLUMN soundcloud_url TEXT,
ADD COLUMN spotify_url TEXT, 
ADD COLUMN soundcloud_followers INTEGER DEFAULT 0,
ADD COLUMN spotify_genres TEXT[] DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN public.members.soundcloud_url IS 'SoundCloud profile URL';
COMMENT ON COLUMN public.members.spotify_url IS 'Spotify artist profile URL';
COMMENT ON COLUMN public.members.soundcloud_followers IS 'SoundCloud-specific follower count';
COMMENT ON COLUMN public.members.spotify_genres IS 'Raw Spotify genre data for mapping';