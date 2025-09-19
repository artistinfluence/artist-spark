-- Clean up and reorganize genres properly, handling duplicates correctly
DO $$
DECLARE
    electronic_id UUID;
    rock_id UUID;
BEGIN
    -- Get Electronic and Rock family IDs
    SELECT id INTO electronic_id FROM public.genre_families WHERE name = 'Electronic' LIMIT 1;
    SELECT id INTO rock_id FROM public.genre_families WHERE name = 'Rock' LIMIT 1;

    -- Remove duplicate subgenres by keeping only the first one created for each name
    DELETE FROM public.subgenres s1
    WHERE s1.id NOT IN (
        SELECT DISTINCT ON (s2.name) s2.id 
        FROM public.subgenres s2 
        ORDER BY s2.name, s2.created_at ASC
    );

    -- Now move all non-rock subgenres to Electronic family
    UPDATE public.subgenres 
    SET family_id = electronic_id 
    WHERE family_id != rock_id;

    -- Remove unused genre families, keeping only Electronic and Rock
    DELETE FROM public.genre_families 
    WHERE name NOT IN ('Electronic', 'Rock');

    -- Add comprehensive electronic subgenres
    INSERT INTO public.subgenres (name, family_id, patterns, order_index, active) VALUES
        ('Drum & Bass', electronic_id, ARRAY['drum and bass', 'dnb', 'liquid dnb'], 5, true),
        ('Ambient', electronic_id, ARRAY['ambient', 'ambient electronic', 'atmospheric'], 8, true),
        ('Synthwave', electronic_id, ARRAY['synthwave', 'retrowave', 'outrun'], 9, true),
        ('Electronica', electronic_id, ARRAY['electronica', 'idm', 'intelligent dance music'], 10, true),
        ('Downtempo', electronic_id, ARRAY['downtempo', 'chillout', 'trip hop'], 11, true),
        ('Hardstyle', electronic_id, ARRAY['hardstyle', 'hardcore', 'hard dance'], 12, true),
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
        ('Melodic Dubstep', electronic_id, ARRAY['melodic dubstep', 'melodic bass'], 30, true),
        ('Lofi', electronic_id, ARRAY['lofi', 'lo-fi', 'chill beats'], 31, true),
        ('Vaporwave', electronic_id, ARRAY['vaporwave', 'vapor', 'aesthetic'], 32, true),
        ('Experimental', electronic_id, ARRAY['experimental', 'avant-garde', 'sound design'], 33, true)
    ON CONFLICT (family_id, name) DO NOTHING;

    -- Add rock subgenres
    INSERT INTO public.subgenres (name, family_id, patterns, order_index, active) VALUES
        ('Hard Rock', rock_id, ARRAY['hard rock', 'classic rock'], 5, true),
        ('Punk Rock', rock_id, ARRAY['punk', 'punk rock', 'hardcore punk'], 6, true),
        ('Metal', rock_id, ARRAY['metal', 'heavy metal', 'death metal'], 7, true),
        ('Grunge', rock_id, ARRAY['grunge', 'seattle sound'], 8, true),
        ('Psychedelic Rock', rock_id, ARRAY['psychedelic', 'psych rock', 'acid rock'], 9, true),
        ('Blues Rock', rock_id, ARRAY['blues rock', 'blues'], 10, true)
    ON CONFLICT (family_id, name) DO NOTHING;

END $$;