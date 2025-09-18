-- Create cron job for daily follower sync
SELECT cron.schedule(
    'daily-follower-sync',
    '0 2 * * *', -- Run daily at 2 AM UTC
    $$
    SELECT
      net.http_post(
        url:='https://xwvxufnntlytvtqpzbqw.supabase.co/functions/v1/daily-follower-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dnh1Zm5udGx5dHZ0cXB6YnF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU4NDk5NiwiZXhwIjoyMDcxMTYwOTk2fQ.tPnLBMjrLp96SaGvuYd2vc3i7Lju3sy1vEKVJhGEQRA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
      ) as request_id;
    $$
);

-- Add index on soundcloud_url for efficient querying
CREATE INDEX IF NOT EXISTS idx_members_soundcloud_url ON public.members(soundcloud_url) WHERE soundcloud_url IS NOT NULL;

-- Add index on last_classified_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_members_last_classified_at ON public.members(last_classified_at);