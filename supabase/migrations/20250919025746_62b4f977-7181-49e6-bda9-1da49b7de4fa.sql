-- Create subgenres table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subgenres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  family_id UUID NOT NULL REFERENCES public.genre_families(id) ON DELETE CASCADE,
  patterns TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subgenres_family_id ON public.subgenres(family_id);
CREATE INDEX IF NOT EXISTS idx_subgenres_active ON public.subgenres(active);
CREATE INDEX IF NOT EXISTS idx_subgenres_order ON public.subgenres(family_id, order_index);

-- Enable RLS on subgenres table
ALTER TABLE public.subgenres ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subgenres
DO $$
BEGIN
  -- Policy for authenticated users to view subgenres
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subgenres' 
    AND policyname = 'Authenticated users can view subgenres'
  ) THEN
    CREATE POLICY "Authenticated users can view subgenres"
    ON public.subgenres
    FOR SELECT 
    TO authenticated
    USING (true);
  END IF;

  -- Policy for admins to manage subgenres
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subgenres' 
    AND policyname = 'Admins can manage subgenres'
  ) THEN
    CREATE POLICY "Admins can manage subgenres"
    ON public.subgenres
    FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$$;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_subgenres_updated_at
  BEFORE UPDATE ON public.subgenres
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample subgenres for existing genre families if they don't exist
INSERT INTO public.subgenres (name, family_id, patterns, order_index, active)
SELECT 
  subgenre_data.name,
  gf.id,
  subgenre_data.patterns,
  subgenre_data.order_index,
  true
FROM (
  VALUES 
    ('Deep House', ARRAY['deep house', 'deep', 'house deep'], 1),
    ('Tech House', ARRAY['tech house', 'techno house'], 2),
    ('Progressive House', ARRAY['progressive house', 'prog house'], 3),
    ('Techno', ARRAY['techno', 'detroit techno'], 1),
    ('Minimal Techno', ARRAY['minimal techno', 'minimal'], 2),
    ('Acid Techno', ARRAY['acid techno', 'acid'], 3),
    ('Dubstep', ARRAY['dubstep', 'dub step'], 1),
    ('Future Bass', ARRAY['future bass', 'future'], 2),
    ('Trap', ARRAY['trap', 'electronic trap'], 3)
) AS subgenre_data(name, patterns, order_index)
CROSS JOIN public.genre_families gf
WHERE 
  (gf.name ILIKE '%house%' AND subgenre_data.name LIKE '%House%')
  OR (gf.name ILIKE '%techno%' AND subgenre_data.name LIKE '%Techno%')
  OR (gf.name ILIKE '%bass%' AND subgenre_data.name IN ('Dubstep', 'Future Bass', 'Trap'))
  OR (gf.name ILIKE '%electronic%' AND subgenre_data.name IN ('Dubstep', 'Future Bass', 'Trap'))
ON CONFLICT DO NOTHING;