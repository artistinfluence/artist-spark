-- Add classification metadata fields to members table
ALTER TABLE public.members 
ADD COLUMN last_classified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN classification_source TEXT CHECK (classification_source IN ('auto', 'manual')) DEFAULT 'auto',
ADD COLUMN spotify_genres_updated_at TIMESTAMP WITH TIME ZONE;