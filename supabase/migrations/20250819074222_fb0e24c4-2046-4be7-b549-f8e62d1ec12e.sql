-- Add missing subgenres with correct family names
INSERT INTO public.subgenres (name, family_id, patterns, order_index) 
SELECT name, family_id, patterns, order_index
FROM (VALUES
  -- Electronic subgenres (skip House and Techno as they exist)
  ('Dubstep', (SELECT id FROM genre_families WHERE name = 'Electronic'), ARRAY['dubstep', 'bass music', 'wobble'], 1),
  ('Future Bass', (SELECT id FROM genre_families WHERE name = 'Electronic'), ARRAY['future bass', 'melodic dubstep', 'future'], 2),
  ('Trance', (SELECT id FROM genre_families WHERE name = 'Electronic'), ARRAY['trance', 'uplifting', 'progressive trance'], 3),
  
  -- Hip-Hop subgenres (using correct name "Hip-Hop", skip Trap as it exists)
  ('Boom Bap', (SELECT id FROM genre_families WHERE name = 'Hip-Hop'), ARRAY['boom bap', 'old school', 'classic hip hop'], 2),
  ('Cloud Rap', (SELECT id FROM genre_families WHERE name = 'Hip-Hop'), ARRAY['cloud rap', 'atmospheric', 'lo-fi rap'], 3),
  ('Drill', (SELECT id FROM genre_families WHERE name = 'Hip-Hop'), ARRAY['drill', 'chicago drill', 'uk drill'], 4),
  
  -- Rock subgenres
  ('Alternative Rock', (SELECT id FROM genre_families WHERE name = 'Rock'), ARRAY['alternative', 'alt rock', 'indie rock'], 1),
  ('Post Rock', (SELECT id FROM genre_families WHERE name = 'Rock'), ARRAY['post rock', 'instrumental rock', 'ambient rock'], 2),
  ('Progressive Rock', (SELECT id FROM genre_families WHERE name = 'Rock'), ARRAY['prog rock', 'progressive', 'complex'], 3),
  ('Indie Rock', (SELECT id FROM genre_families WHERE name = 'Rock'), ARRAY['indie', 'indie rock', 'independent'], 4),
  
  -- Pop subgenres
  ('Indie Pop', (SELECT id FROM genre_families WHERE name = 'Pop'), ARRAY['indie pop', 'dream pop', 'bedroom pop'], 1),
  ('Synth Pop', (SELECT id FROM genre_families WHERE name = 'Pop'), ARRAY['synth pop', 'new wave', 'electronic pop'], 2),
  ('Alternative Pop', (SELECT id FROM genre_families WHERE name = 'Pop'), ARRAY['alt pop', 'alternative pop', 'art pop'], 3),
  
  -- R&B subgenres
  ('Contemporary R&B', (SELECT id FROM genre_families WHERE name = 'R&B'), ARRAY['contemporary r&b', 'modern r&b', 'urban'], 1),
  ('Neo Soul', (SELECT id FROM genre_families WHERE name = 'R&B'), ARRAY['neo soul', 'alternative r&b', 'progressive soul'], 2),
  ('Future R&B', (SELECT id FROM genre_families WHERE name = 'R&B'), ARRAY['future r&b', 'pbrydryb', 'alternative r&b'], 3)
) AS new_subgenres(name, family_id, patterns, order_index)
WHERE NOT EXISTS (
  SELECT 1 FROM subgenres s 
  WHERE s.name = new_subgenres.name AND s.family_id = new_subgenres.family_id
);

-- Update members with realistic data
UPDATE public.members SET
  followers = CASE 
    WHEN size_tier = 'T1' THEN 450
    WHEN size_tier = 'T2' THEN 5500
    ELSE 850
  END,
  families = ARRAY['Electronic', 'Pop'],
  subgenres = ARRAY['Future Bass', 'Indie Pop'],
  submissions_this_month = 0,
  last_submission_at = NOW() - INTERVAL '5 days';

-- Create diverse sample submissions
INSERT INTO public.submissions (
  member_id, track_url, artist_name, family, subgenres, status, submitted_at, 
  notes, qa_reason, support_date, support_url, expected_reach_min, expected_reach_max, expected_reach_planned
) VALUES
-- New submissions (awaiting review)
((SELECT id FROM members ORDER BY created_at LIMIT 1), 'https://soundcloud.com/nexusbeats/midnight-echoes', 'NexusBeats', 'Electronic', ARRAY['Future Bass'], 'new', NOW() - INTERVAL '2 hours', NULL, NULL, NULL, NULL, 800, 1200, 1000),
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 1), 'https://soundcloud.com/urban-flow/city-nights', 'Urban Flow', 'Hip-Hop', ARRAY['Trap'], 'new', NOW() - INTERVAL '1 day', NULL, NULL, NULL, NULL, 2000, 3500, 2800),
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 2), 'https://soundcloud.com/indie-waves/digital-horizon', 'Indie Waves', 'Rock', ARRAY['Alternative Rock'], 'new', NOW() - INTERVAL '3 hours', NULL, NULL, NULL, NULL, 500, 900, 700),
((SELECT id FROM members ORDER BY created_at LIMIT 1), 'https://soundcloud.com/synthwave-dreams/neon-pulse', 'SynthWave Dreams', 'Pop', ARRAY['Synth Pop'], 'new', NOW() - INTERVAL '6 hours', NULL, NULL, NULL, NULL, 1200, 2000, 1600),

-- Pending submissions (under review)
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 1), 'https://soundcloud.com/bassline-collective/deep-vibes', 'Bassline Collective', 'R&B', ARRAY['Contemporary R&B'], 'pending', NOW() - INTERVAL '3 days', 'Under review by moderation team. Strong track with good production quality.', NULL, NULL, NULL, 1500, 2500, 2000),
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 2), 'https://soundcloud.com/echo-chamber/reverb-dreams', 'Echo Chamber', 'Rock', ARRAY['Post Rock'], 'pending', NOW() - INTERVAL '2 days', 'Interesting atmospheric piece. Checking genre fit for our audience.', NULL, NULL, NULL, 600, 1100, 850),
((SELECT id FROM members ORDER BY created_at LIMIT 1), 'https://soundcloud.com/crystal-clear/frequency-shift', 'Crystal Clear', 'Electronic', ARRAY['Trance'], 'pending', NOW() - INTERVAL '4 days', 'High energy track. Evaluating for weekend slot placement.', NULL, NULL, NULL, 1800, 3200, 2500),

-- Approved submissions (ready for support)
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 1), 'https://soundcloud.com/groove-theory/sunset-boulevard', 'Groove Theory', 'Hip-Hop', ARRAY['Cloud Rap'], 'approved', NOW() - INTERVAL '1 week', 'Excellent track! Perfect fit for our Sunday chill sessions.', NULL, CURRENT_DATE + INTERVAL '3 days', 'https://soundcloud.com/our-collective/sets/weekly-favorites', 2200, 4000, 3100),
((SELECT id FROM members ORDER BY created_at LIMIT 1), 'https://soundcloud.com/stellar-sounds/cosmic-journey', 'Stellar Sounds', 'Electronic', ARRAY['House'], 'approved', NOW() - INTERVAL '5 days', 'Great production value. Scheduling for Friday night feature.', NULL, CURRENT_DATE + INTERVAL '2 days', 'https://soundcloud.com/our-collective/sets/weekend-bangers', 1400, 2800, 2100),
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 2), 'https://soundcloud.com/ambient-collective/morning-mist', 'Ambient Collective', 'Pop', ARRAY['Indie Pop'], 'approved', NOW() - INTERVAL '6 days', 'Beautiful atmospheric track. Perfect for morning playlist.', NULL, CURRENT_DATE + INTERVAL '1 day', 'https://soundcloud.com/our-collective/sets/morning-vibes', 800, 1600, 1200),
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 1), 'https://soundcloud.com/soulful-nights/velvet-voice', 'Soulful Nights', 'R&B', ARRAY['Neo Soul'], 'approved', NOW() - INTERVAL '8 days', 'Incredible vocals and arrangement. Featured track material.', NULL, CURRENT_DATE + INTERVAL '4 days', 'https://soundcloud.com/our-collective/sets/soul-sessions', 1800, 3400, 2600),
((SELECT id FROM members ORDER BY created_at LIMIT 1), 'https://soundcloud.com/digital-dreams/pixelated-love', 'Digital Dreams', 'Electronic', ARRAY['Future Bass'], 'approved', NOW() - INTERVAL '9 days', 'Nostalgic and emotional. Great for themed playlists.', NULL, CURRENT_DATE + INTERVAL '5 days', 'https://soundcloud.com/our-collective/sets/emotional-beats', 1100, 2200, 1650),

-- Rejected submissions
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 2), 'https://soundcloud.com/rough-edges/unpolished-demo', 'Rough Edges', 'Rock', ARRAY['Alternative Rock'], 'rejected', NOW() - INTERVAL '1 week', 'Track shows potential but needs better mixing and mastering. Encourage resubmission after improvements.', NULL, NULL, NULL, 0, 0, 0),
((SELECT id FROM members ORDER BY created_at LIMIT 1), 'https://soundcloud.com/generic-beats/basic-loop', 'Generic Beats', 'Electronic', ARRAY['Techno'], 'rejected', NOW() - INTERVAL '10 days', 'Too repetitive and lacks originality. Does not meet our quality standards.', NULL, NULL, NULL, 0, 0, 0),
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 1), 'https://soundcloud.com/off-key/missed-notes', 'Off Key', 'Hip-Hop', ARRAY['Boom Bap'], 'rejected', NOW() - INTERVAL '12 days', 'Technical issues with timing and pitch. Recommend working with a producer.', NULL, NULL, NULL, 0, 0, 0),

-- QA Flagged submissions
((SELECT id FROM members ORDER BY created_at LIMIT 1 OFFSET 2), 'https://soundcloud.com/copyright-trouble/borrowed-melody', 'Copyright Trouble', 'Pop', ARRAY['Alternative Pop'], 'qa_flag', NOW() - INTERVAL '4 days', 'Flagged for potential copyright issues. Melody too similar to existing commercial track.', 'Potential copyright infringement - melody matches "Popular Song" by Major Artist', NULL, NULL, 0, 0, 0),
((SELECT id FROM members ORDER BY created_at LIMIT 1), 'https://soundcloud.com/questionable-content/explicit-version', 'Questionable Content', 'Hip-Hop', ARRAY['Drill'], 'qa_flag', NOW() - INTERVAL '6 days', 'Content review needed. Lyrics may not align with community guidelines.', 'Explicit content review - lyrics contain potentially offensive material', NULL, NULL, 0, 0, 0);

-- Update member submission counts to match actual submissions
UPDATE public.members SET 
  submissions_this_month = (
    SELECT COUNT(*) 
    FROM submissions 
    WHERE member_id = members.id 
    AND DATE_TRUNC('month', submitted_at) = DATE_TRUNC('month', NOW())
  );