-- Create mock submissions for testing artist assignment workflow
INSERT INTO submissions (
  member_id,
  track_url,
  track_name,
  artist_name,
  family,
  subgenres,
  status,
  expected_reach_planned,
  submitted_at,
  created_at
) VALUES 
-- AIRWAV - Melodic Bass Track
(
  'ee5f3dfd-c96b-4d3b-a390-3635ed890278',
  'https://soundcloud.com/airwav/midnight-waves',
  'Midnight Waves',
  'AIRWAV',
  'Bass',
  ARRAY['Melodic Bass'],
  'new',
  25000,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),

-- Black Carl - Dubstep Track  
(
  'a9ec37c9-c22c-4316-a05e-250a0a7bbff6',
  'https://soundcloud.com/blackcarl/bass-drop-revolution',
  'Bass Drop Revolution',
  'Black Carl',
  'Bass',
  ARRAY['Dubstep'],
  'new',
  15000,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),

-- Andre Botez - Techno Track
(
  '4f23083e-0da1-4d9b-abfa-edb6db4c9e00',
  'https://soundcloud.com/andrebotez/industrial-pulse',
  'Industrial Pulse', 
  'Andre Botez',
  'Electronic',
  ARRAY['Techno'],
  'new',
  8000,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),

-- Badjokes - Bass House Track
(
  '407f33b5-3729-4d4b-9271-7d10378205e1',
  'https://soundcloud.com/badjokes/party-starter',
  'Party Starter',
  'Badjokes',
  'House',
  ARRAY['Bass House'],
  'new',
  12000,
  NOW() - INTERVAL '8 hours',
  NOW() - INTERVAL '8 hours'
),

-- Ben Maxwell - Pop/Dance Track
(
  'f8e04a78-4392-4e53-95ea-4c75c4f9379c',
  'https://soundcloud.com/benmaxwell/summer-nights',
  'Summer Nights',
  'Ben Maxwell',
  'Pop',
  ARRAY['Dance Pop'],
  'new',
  20000,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
);