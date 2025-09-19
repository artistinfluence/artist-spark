-- First, add the new status values to the enum
ALTER TYPE member_status ADD VALUE 'connected';
ALTER TYPE member_status ADD VALUE 'disconnected'; 
ALTER TYPE member_status ADD VALUE 'invited';
ALTER TYPE member_status ADD VALUE 'uninterested';

-- Migrate existing data
UPDATE public.members 
SET status = 'connected'::member_status 
WHERE status = 'active';

UPDATE public.members 
SET status = 'disconnected'::member_status 
WHERE status = 'needs_reconnect';

-- Remove old enum values (we'll do this in a separate step after confirming data migration)
-- Note: We can't directly remove enum values in PostgreSQL, so we'll create a new enum and replace it

-- Create new enum with only the desired values
CREATE TYPE member_status_new AS ENUM ('connected', 'disconnected', 'invited', 'uninterested');

-- Update the table to use the new enum
ALTER TABLE public.members ALTER COLUMN status TYPE member_status_new USING status::text::member_status_new;

-- Drop the old enum and rename the new one
DROP TYPE member_status;
ALTER TYPE member_status_new RENAME TO member_status;