-- Update monthly submission limit to monthly repost limit with default 1
ALTER TABLE members 
RENAME COLUMN monthly_submission_limit TO monthly_repost_limit;

-- Set default value to 1 for new members
ALTER TABLE members 
ALTER COLUMN monthly_repost_limit SET DEFAULT 1;

-- Update existing members who have 4 (old default) to 1 (new default)
UPDATE members 
SET monthly_repost_limit = 1 
WHERE monthly_repost_limit = 4;