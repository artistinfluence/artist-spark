-- First, drop the dependent materialized view
DROP MATERIALIZED VIEW IF EXISTS member_performance_summary CASCADE;

-- Create new enum with desired values
CREATE TYPE member_status_new AS ENUM ('connected', 'disconnected', 'invited', 'uninterested');

-- Add temporary column with new enum type
ALTER TABLE public.members ADD COLUMN status_new member_status_new;

-- Migrate existing data
UPDATE public.members 
SET status_new = 'connected'::member_status_new 
WHERE status = 'active';

UPDATE public.members 
SET status_new = 'disconnected'::member_status_new 
WHERE status = 'needs_reconnect';

-- Set default for any NULL values
UPDATE public.members 
SET status_new = 'disconnected'::member_status_new 
WHERE status_new IS NULL;

-- Drop old column and rename new one
ALTER TABLE public.members DROP COLUMN status;
ALTER TABLE public.members RENAME COLUMN status_new TO status;

-- Set NOT NULL constraint and default
ALTER TABLE public.members ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.members ALTER COLUMN status SET DEFAULT 'disconnected'::member_status_new;

-- Clean up old enum type
DROP TYPE member_status;
ALTER TYPE member_status_new RENAME TO member_status;

-- Recreate the materialized view with updated status values
-- Note: We'll need to update this based on the new status values
CREATE MATERIALIZED VIEW member_performance_summary AS
SELECT 
    id,
    name,
    status,
    COALESCE(net_credits, 0) as net_credits,
    COALESCE(submissions_this_month, 0) as submissions_this_month,
    CASE 
        WHEN status = 'connected' THEN 1
        ELSE 0
    END as is_active
FROM members;

-- Create index for performance
CREATE INDEX idx_member_performance_summary_status ON member_performance_summary(status);