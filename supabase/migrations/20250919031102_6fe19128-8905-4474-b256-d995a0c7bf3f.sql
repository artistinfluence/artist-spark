-- Port group column tags from members to genre subgenres
DO $$
DECLARE
    electronic_id UUID;
    max_order INTEGER;
BEGIN
    -- Get Electronic family ID
    SELECT id INTO electronic_id FROM public.genre_families WHERE name = 'Electronic' LIMIT 1;
    
    -- Get the current maximum order index for electronic subgenres
    SELECT COALESCE(MAX(order_index), 0) INTO max_order 
    FROM public.subgenres 
    WHERE family_id = electronic_id;

    -- Add all group tags as electronic subgenres
    INSERT INTO public.subgenres (name, family_id, patterns, order_index, active) VALUES
        ('Afro House', electronic_id, ARRAY['afro house', 'afro', 'african house'], max_order + 1, true),
        ('Bass House', electronic_id, ARRAY['bass house', 'house bass', 'heavy house'], max_order + 2, true),
        ('Beats', electronic_id, ARRAY['beats', 'instrumental beats', 'hip hop beats'], max_order + 3, true),
        ('Dance', electronic_id, ARRAY['dance', 'dance music', 'edm'], max_order + 4, true),
        ('Dance Pop', electronic_id, ARRAY['dance pop', 'pop dance', 'commercial dance'], max_order + 5, true),
        ('Dubstep Emerging', electronic_id, ARRAY['dubstep emerging', 'new dubstep', 'upcoming dubstep'], max_order + 6, true),
        ('Dubstep Established', electronic_id, ARRAY['dubstep established', 'mainstream dubstep', 'popular dubstep'], max_order + 7, true),
        ('Future World', electronic_id, ARRAY['future world', 'world fusion', 'ethnic electronic'], max_order + 8, true),
        ('Hard Dance', electronic_id, ARRAY['hard dance', 'hardcore dance', 'hard electronic'], max_order + 9, true),
        ('Hard Drum & Bass', electronic_id, ARRAY['hard drum and bass', 'hard dnb', 'heavy dnb'], max_order + 10, true),
        ('Hard Groove', electronic_id, ARRAY['hard groove', 'groove house', 'driving house'], max_order + 11, true),
        ('Internet Sounds', electronic_id, ARRAY['internet sounds', 'online music', 'digital culture'], max_order + 12, true),
        ('Mainstage', electronic_id, ARRAY['mainstage', 'festival', 'big room'], max_order + 13, true),
        ('Melodic Bass', electronic_id, ARRAY['melodic bass', 'melodic dubstep', 'emotional bass'], max_order + 14, true),
        ('Melodic Drum & Bass', electronic_id, ARRAY['melodic drum and bass', 'melodic dnb', 'liquid melodic'], max_order + 15, true),
        ('Phonk', electronic_id, ARRAY['phonk', 'drift phonk', 'memphis rap'], max_order + 16, true),
        ('Pop Electronic', electronic_id, ARRAY['pop', 'electronic pop', 'synth pop'], max_order + 17, true),
        ('Rap Electronic', electronic_id, ARRAY['rap', 'electronic rap', 'trap rap'], max_order + 18, true),
        ('Tearout', electronic_id, ARRAY['tearout', 'tearout dubstep', 'aggressive dubstep'], max_order + 19, true),
        ('Tech House Established', electronic_id, ARRAY['tech house established', 'mainstream tech house', 'commercial tech house'], max_order + 20, true),
        ('Trap Emerging', electronic_id, ARRAY['trap emerging', 'new trap', 'upcoming trap'], max_order + 21, true),
        ('Trap Established', electronic_id, ARRAY['trap established', 'mainstream trap', 'popular trap'], max_order + 22, true),
        ('Wonk Bass Emerging', electronic_id, ARRAY['wonk bass emerging', 'experimental bass', 'weird bass'], max_order + 23, true)
    ON CONFLICT (family_id, name) DO NOTHING;

END $$;