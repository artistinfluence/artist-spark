-- Enable the http extension for sending emails
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA net;

-- Create test data for notification automation testing

-- Insert test member with user's email
INSERT INTO public.members (
  id,
  name,
  primary_email,
  emails,
  status,
  size_tier,
  monthly_submission_limit,
  submissions_this_month,
  monthly_credit_limit,
  net_credits,
  soundcloud_url,
  soundcloud_followers,
  families,
  subgenres
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Jared Test Artist',
  'jared@artistinfluence.com',
  ARRAY['jared@artistinfluence.com'],
  'active',
  'T2',
  4,
  2,
  1000,
  500,
  'https://soundcloud.com/jaredtestartist',
  5000,
  ARRAY['Electronic', 'Hip Hop'],
  ARRAY['House', 'Trap', 'Future Bass']
);

-- Insert test inquiry for admission/rejection flow testing
INSERT INTO public.inquiries (
  id,
  name,
  email,
  soundcloud_url,
  status,
  notes
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'Jared Test Inquiry',
  'jared@artistinfluence.com',
  'https://soundcloud.com/jaredtestinquiry',
  'undecided',
  'Test inquiry for automation testing'
);

-- Insert test submissions with various statuses for email flow testing
INSERT INTO public.submissions (
  id,
  member_id,
  artist_name,
  track_url,
  status,
  support_date,
  family,
  subgenres,
  expected_reach_min,
  expected_reach_max,
  expected_reach_planned,
  notes
) VALUES 
-- New submission (will trigger confirmation email when created)
(
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  'Jared Test Artist',
  'https://soundcloud.com/jaredtest/new-track',
  'new',
  '2025-01-25',
  'Electronic',
  ARRAY['House', 'Progressive House'],
  8000,
  12000,
  10000,
  'Test submission for confirmation email'
),
-- Pending submission (ready to be approved)
(
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440001',
  'Jared Test Artist',
  'https://soundcloud.com/jaredtest/pending-track',
  'pending',
  '2025-01-26',
  'Hip Hop',
  ARRAY['Trap', 'Future Bass'],
  6000,
  9000,
  7500,
  'Test submission ready for approval'
),
-- Another pending submission (ready to be rejected)
(
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440001',
  'Jared Test Artist',
  'https://soundcloud.com/jaredtest/reject-track',
  'pending',
  '2025-01-27',
  'Electronic',
  ARRAY['Dubstep'],
  3000,
  5000,
  4000,
  'Test submission to be rejected'
),
-- Approved submission (already processed)
(
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440001',
  'Jared Test Artist',
  'https://soundcloud.com/jaredtest/approved-track',
  'approved',
  '2025-01-24',
  'Electronic',
  ARRAY['House'],
  10000,
  15000,
  12000,
  'Previously approved test submission'
);

-- Add some test notifications to verify the notification system
INSERT INTO public.notifications (
  id,
  user_id,
  title,
  message,
  type,
  read,
  metadata
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440007',
  (SELECT id FROM auth.users WHERE email = 'jared@artistinfluence.com' LIMIT 1),
  'Test Notification',
  'This is a test notification to verify the notification system is working.',
  'info',
  false,
  '{"test": true}'
),
(
  '550e8400-e29b-41d4-a716-446655440008',
  (SELECT id FROM auth.users WHERE email = 'jared@artistinfluence.com' LIMIT 1),
  'Welcome to the Platform',
  'Welcome! Your account has been set up successfully.',
  'success',
  false,
  '{"welcome": true}'
);