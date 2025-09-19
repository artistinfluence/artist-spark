-- Update the members table to use the existing connection_status enum
-- Map existing values to the new enum values
ALTER TABLE public.members 
ALTER COLUMN status TYPE connection_status 
USING CASE 
  WHEN status::text = 'active' THEN 'connected'::connection_status
  WHEN status::text = 'needs_reconnect' THEN 'disconnected'::connection_status
  ELSE 'disconnected'::connection_status
END;

-- Set default value
ALTER TABLE public.members ALTER COLUMN status SET DEFAULT 'disconnected'::connection_status;