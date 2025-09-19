-- Step 1: Create new enum with desired values
CREATE TYPE member_status_new AS ENUM ('connected', 'disconnected', 'invited', 'uninterested');

-- Step 2: Add temporary column with new enum type
ALTER TABLE public.members ADD COLUMN status_new member_status_new;

-- Step 3: Migrate existing data
UPDATE public.members 
SET status_new = 'connected'::member_status_new 
WHERE status = 'active';

UPDATE public.members 
SET status_new = 'disconnected'::member_status_new 
WHERE status = 'needs_reconnect';

-- Step 4: Set default for any NULL values (shouldn't be any, but just in case)
UPDATE public.members 
SET status_new = 'disconnected'::member_status_new 
WHERE status_new IS NULL;

-- Step 5: Drop old column and rename new one
ALTER TABLE public.members DROP COLUMN status;
ALTER TABLE public.members RENAME COLUMN status_new TO status;

-- Step 6: Set NOT NULL constraint and default
ALTER TABLE public.members ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.members ALTER COLUMN status SET DEFAULT 'disconnected'::member_status_new;

-- Step 7: Clean up old enum type
DROP TYPE member_status;
ALTER TYPE member_status_new RENAME TO member_status;