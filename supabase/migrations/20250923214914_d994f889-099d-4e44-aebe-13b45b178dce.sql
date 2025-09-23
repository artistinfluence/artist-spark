-- Update approved submissions with null support_date to use the published queue date with available slots
UPDATE submissions 
SET support_date = '2025-09-17'
WHERE status = 'approved' 
  AND support_date IS NULL
  AND id IN (
    SELECT id FROM submissions 
    WHERE status = 'approved' AND support_date IS NULL 
    ORDER BY submitted_at DESC 
    LIMIT 2  -- Only update 2 to fit remaining slots in the queue
  );