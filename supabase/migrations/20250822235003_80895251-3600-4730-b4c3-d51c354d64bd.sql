-- Add missing fields to submissions table for enhanced submission form
ALTER TABLE public.submissions 
ADD COLUMN track_name TEXT,
ADD COLUMN release_date DATE,
ADD COLUMN secondary_email TEXT,
ADD COLUMN alternative_url TEXT;