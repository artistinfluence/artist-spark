-- Remove Spotify-related columns from members table
ALTER TABLE public.members 
DROP COLUMN IF EXISTS spotify_url,
DROP COLUMN IF EXISTS spotify_genres,
DROP COLUMN IF EXISTS spotify_genres_updated_at;

-- Add genre classification fields for manual assignment
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS genre_family_id UUID REFERENCES public.genre_families(id),
ADD COLUMN IF NOT EXISTS manual_genres TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS genre_notes TEXT;

-- Create member import history table for tracking bulk imports
CREATE TABLE IF NOT EXISTS public.member_import_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    imported_by UUID REFERENCES auth.users(id),
    filename TEXT,
    total_records INTEGER DEFAULT 0,
    successful_imports INTEGER DEFAULT 0,
    failed_imports INTEGER DEFAULT 0,
    import_data JSONB DEFAULT '{}',
    errors JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on import history table
ALTER TABLE public.member_import_history ENABLE ROW LEVEL SECURITY;

-- Create policy for import history
CREATE POLICY "Ops can manage import history" 
ON public.member_import_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));