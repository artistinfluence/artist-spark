-- Update mock submissions with realistic reach estimates using the power-law model
-- Using: reach = 16830.763237 * followers^0.396285

UPDATE submissions SET expected_reach_planned = 
  CASE 
    -- AIRWAV submission (45k followers) -> ~11k reach
    WHEN id = (SELECT id FROM submissions WHERE artist_name = 'AIRWAV' LIMIT 1) 
    THEN 11000
    
    -- Black Carl submission (35k followers) -> ~10k reach  
    WHEN id = (SELECT id FROM submissions WHERE artist_name = 'Black Carl' LIMIT 1)
    THEN 10000
    
    -- Andre Botez submission (15k followers) -> ~7k reach
    WHEN id = (SELECT id FROM submissions WHERE artist_name = 'Andre Botez' LIMIT 1)
    THEN 7000
    
    -- Badjokes submission (22k followers) -> ~8k reach
    WHEN id = (SELECT id FROM submissions WHERE artist_name = 'Badjokes' LIMIT 1)
    THEN 8000
    
    -- Ben Maxwell submission (28k followers) -> ~9k reach
    WHEN id = (SELECT id FROM submissions WHERE artist_name = 'Ben Maxwell' LIMIT 1)
    THEN 9000
    
    ELSE expected_reach_planned
  END
WHERE artist_name IN ('AIRWAV', 'Black Carl', 'Andre Botez', 'Badjokes', 'Ben Maxwell');