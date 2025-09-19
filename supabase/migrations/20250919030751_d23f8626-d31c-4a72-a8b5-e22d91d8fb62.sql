-- Clean up and reorganize genres properly, handling duplicates
DO $$
DECLARE
    electronic_id UUID;
    rock_id UUID;
BEGIN
    -- Get Electronic and Rock family IDs
    SELECT id INTO electronic_id FROM public.genre_families WHERE name = 'Electronic' LIMIT 1;
    SELECT id INTO rock_id FROM public.genre_families WHERE name = 'Rock' LIMIT 1;

    -- First, remove duplicate subgenres (keep the one under Electronic if it exists)
    DELETE FROM public.subgenres s1
    WHERE EXISTS (
        SELECT 1 FROM public.subgenres s2 
        WHERE s1.name = s2.name 
        AND s1.id != s2.id 
        AND s2.family_id = electronic_id
    ) AND s1.family_id != electronic_id;

    -- Remove any remaining duplicates, keeping the first one
    DELETE FROM public.subgenres s1
    WHERE s1.id NOT IN (
        SELECT MIN(id) FROM public.subgenres s2 
        WHERE s2.name = s1.name 
        GROUP BY s2.name
    );

    -- Now move all non-rock subgenres to Electronic family
    UPDATE public.subgenres 
    SET family_id = electronic_id 
    WHERE family_id != rock_id AND family_id != electronic_id;

    -- Remove unused genre families, keeping only Electronic and Rock
    DELETE FROM public.genre_families 
    WHERE name NOT IN ('Electronic', 'Rock');

    -- Add comprehensive electronic subgenres (will be ignored if they exist due to ON CONFLICT)
    INSERT INTO public.subgenres (name, family_id, patterns, order_index, active) VALUES
        ('House', electronic_id, ARRAY['house', 'deep house', 'tech house', 'progressive house'], 1, true),
        ('Techno', electronic_id, ARRAY['techno', 'minimal techno', 'detroit techno'], 2, true),
        ('Trance', electronic_id, ARRAY['trance', 'uplifting trance', 'progressive trance'], 3, true),
        ('Dubstep', electronic_id, ARRAY['dubstep', 'bass music', 'wobble'], 4, true),
        ('Drum & Bass', electronic_id, ARRAY['drum and bass', 'dnb', 'liquid dnb'], 5, true),
        ('Future Bass', electronic_id, ARRAY['future bass', 'melodic dubstep', 'future'], 6, true),
        ('Trap', electronic_id, ARRAY['trap', 'electronic trap', 'trap music'], 7, true),
        ('Ambient', electronic_id, ARRAY['ambient', 'ambient electronic', 'atmospheric'], 8, true),
        ('Synthwave', electronic_id, ARRAY['synthwave', 'retrowave', 'outrun'], 9, true),
        ('Electronica', electronic_id, ARRAY['electronica', 'idm', 'intelligent dance music'], 10, true),
        ('Downtempo', electronic_id, ARRAY['downtempo', 'chillout', 'trip hop'], 11, true),
        ('Hardstyle', electronic_id, ARRAY['hardstyle', 'hardcore', 'hard dance'], 12, true),
        ('Progressive House', electronic_id, ARRAY['progressive house', 'prog house'], 13, true),
        ('Deep House', electronic_id, ARRAY['deep house', 'deep', 'house deep'], 14, true),
        ('Tech House', electronic_id, ARRAY['tech house', 'techno house'], 15, true),
        ('Minimal', electronic_id, ARRAY['minimal', 'minimal techno', 'micro house'], 16, true),
        ('Breakbeat', electronic_id, ARRAY['breakbeat', 'breaks', 'big beat'], 17, true),
        ('Garage', electronic_id, ARRAY['uk garage', 'garage', '2-step'], 18, true),
        ('Jungle', electronic_id, ARRAY['jungle', 'ragga jungle'], 19, true),
        ('Glitch', electronic_id, ARRAY['glitch', 'glitch hop', 'neurohop'], 20, true),
        ('Psytrance', electronic_id, ARRAY['psytrance', 'psychedelic trance', 'goa'], 21, true),
        ('Acid', electronic_id, ARRAY['acid house', 'acid techno', 'acid'], 22, true),
        ('Electro', electronic_id, ARRAY['electro', 'electro house', 'fidget'], 23, true),
        ('Chillstep', electronic_id, ARRAY['chillstep', 'melodic dubstep', 'chillout dubstep'], 24, true),
        ('Neurofunk', electronic_id, ARRAY['neurofunk', 'neuro', 'dark dnb'], 25, true),
        ('Liquid Funk', electronic_id, ARRAY['liquid funk', 'liquid dnb', 'smooth dnb'], 26, true),
        ('Hardstep', electronic_id, ARRAY['hardstep', 'hard dnb'], 27, true),
        ('Riddim', electronic_id, ARRAY['riddim', 'riddim dubstep'], 28, true),
        ('Bass Music', electronic_id, ARRAY['bass music', 'bass', 'heavy bass'], 29, true),
        ('Melodic Dubstep', electronic_id, ARRAY['melodic dubstep', 'melodic bass'], 30, true)
    ON CONFLICT (family_id, name) DO NOTHING;

    -- Add rock subgenres
    INSERT INTO public.subgenres (name, family_id, patterns, order_index, active) VALUES
        ('Alternative Rock', rock_id, ARRAY['alternative', 'alt rock', 'indie rock'], 1, true),
        ('Indie Rock', rock_id, ARRAY['indie', 'indie rock', 'independent'], 2, true),
        ('Progressive Rock', rock_id, ARRAY['prog rock', 'progressive', 'complex'], 3, true),
        ('Post Rock', rock_id, ARRAY['post rock', 'instrumental rock', 'ambient rock'], 4, true),
        ('Hard Rock', rock_id, ARRAY['hard rock', 'classic rock'], 5, true),
        ('Punk Rock', rock_id, ARRAY['punk', 'punk rock', 'hardcore punk'], 6, true),
        ('Metal', rock_id, ARRAY['metal', 'heavy metal', 'death metal'], 7, true),
        ('Grunge', rock_id, ARRAY['grunge', 'seattle sound'], 8, true),
        ('Psychedelic Rock', rock_id, ARRAY['psychedelic', 'psych rock', 'acid rock'], 9, true),
        ('Blues Rock', rock_id, ARRAY['blues rock', 'blues'], 10, true)
    ON CONFLICT (family_id, name) DO NOTHING;

END $$;