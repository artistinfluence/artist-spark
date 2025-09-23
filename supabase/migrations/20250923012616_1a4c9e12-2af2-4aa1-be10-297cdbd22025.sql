-- Add weekly reporting support to soundcloud_campaigns
ALTER TABLE soundcloud_campaigns 
ADD COLUMN weekly_reporting_enabled boolean DEFAULT false;

-- Insert mock clients
INSERT INTO clients (id, name, email, company, phone, notes) VALUES
('11111111-1111-1111-1111-111111111111', 'Atlantic Records', 'campaigns@atlantic.com', 'Atlantic Records', '+1-555-0101', 'Major label client'),
('22222222-2222-2222-2222-222222222222', 'Spinnin Records', 'promo@spinninrecords.com', 'Spinnin Records', '+1-555-0102', 'Electronic music label'),
('33333333-3333-3333-3333-333333333333', 'Independent Artist', 'sarah@sarahmusic.com', 'Self-Released', '+1-555-0103', 'Independent artist'),
('44444444-4444-4444-4444-444444444444', 'Monstercat', 'marketing@monstercat.com', 'Monstercat Media', '+1-555-0104', 'Electronic music brand'),
('55555555-5555-5555-5555-555555555555', 'OWSLA Records', 'team@owsla.com', 'OWSLA', '+1-555-0105', 'Electronic music collective')
ON CONFLICT (id) DO NOTHING;

-- Insert mock soundcloud campaigns
INSERT INTO soundcloud_campaigns (
  id, client_id, track_name, artist_name, track_url, campaign_type, 
  status, goals, remaining_metrics, sales_price, invoice_status, 
  start_date, submission_date, weekly_reporting_enabled, notes
) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
 '11111111-1111-1111-1111-111111111111',
 'Summer Vibes', 'DJ Atlantic', 
 'https://soundcloud.com/djatlantic/summer-vibes',
 'Reposts', 'Active', 1000, 650, 2500.00, 'Paid',
 '2024-01-15', '2024-01-10', true,
 'High priority campaign for summer release'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '22222222-2222-2222-2222-222222222222', 
 'Midnight Drive', 'Spinnin Artist',
 'https://soundcloud.com/spinninartist/midnight-drive',
 'Hyppedit', 'Active', 500, 200, 1800.00, 'Pending',
 '2024-01-20', '2024-01-18', true,
 'Progressive house track targeting night driving playlist'),

('cccccccc-cccc-cccc-cccc-cccccccccccc',
 '33333333-3333-3333-3333-333333333333',
 'Lost in Dreams', 'Sarah Moon', 
 'https://soundcloud.com/sarahmoon/lost-in-dreams',
 'Followers', 'Complete', 200, 0, 900.00, 'Paid',
 '2023-12-01', '2023-11-25', false,
 'Indie pop track - completed successfully'),

('dddddddd-dddd-dddd-dddd-dddddddddddd',
 '44444444-4444-4444-4444-444444444444',
 'Bass Drop Nation', 'Monstercat Collective',
 'https://soundcloud.com/monstercat/bass-drop-nation', 
 'Reposts', 'Active', 1500, 800, 3200.00, 'Paid',
 '2024-01-22', '2024-01-20', true,
 'Dubstep release with high engagement target'),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
 '55555555-5555-5555-5555-555555555555',
 'Future Sounds', 'OWSLA Future',
 'https://soundcloud.com/owsla/future-sounds',
 'Reposts', 'Pending', 800, 800, 2100.00, 'TBD', 
 '2024-02-01', '2024-01-25', false,
 'Future bass track scheduled for February release')
ON CONFLICT (id) DO NOTHING;