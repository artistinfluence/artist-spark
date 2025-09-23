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
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
  'b2c3d4e5-f6g7-8901-bcde-f23456789012',
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
  'c3d4e5f6-g7h8-9012-cdef-345678901234',
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
  'd4e5f6g7-h8i9-0123-defg-456789012345',
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
  'e5f6g7h8-i9j0-1234-efgh-567890123456',
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