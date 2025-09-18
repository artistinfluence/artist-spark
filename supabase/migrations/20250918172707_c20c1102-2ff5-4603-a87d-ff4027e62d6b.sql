-- Add campaign attribution functionality

-- Create campaign baseline snapshots trigger function
CREATE OR REPLACE FUNCTION capture_campaign_baseline()
RETURNS TRIGGER AS $$
DECLARE
  baseline_metrics RECORD;
BEGIN
  -- Only capture baseline when status changes to 'active' and we have a track_url
  IF NEW.status = 'active' AND OLD.status != 'active' AND NEW.track_url IS NOT NULL THEN
    
    -- Call the scrape-soundcloud-track function to get current metrics
    -- This will be done via the edge function instead
    
    -- Insert baseline snapshot with current timestamp as day 0
    INSERT INTO attribution_snapshots (
      parent_type,
      parent_id,
      day_index,
      snapshot_date,
      plays,
      likes,
      reposts,
      comments,
      metadata,
      collection_source
    ) VALUES (
      'campaign',
      NEW.id,
      0,
      CURRENT_DATE,
      0, -- Will be populated by edge function
      0, -- Will be populated by edge function  
      0, -- Will be populated by edge function
      0, -- Will be populated by edge function
      jsonb_build_object(
        'baseline_captured', true,
        'track_url', NEW.track_url,
        'artist_name', NEW.artist_name,
        'track_name', NEW.track_name,
        'campaign_start_date', NEW.start_date,
        'baseline_trigger', 'status_change_to_active'
      ),
      'baseline_capture'
    );
    
    -- Log that baseline capture was triggered
    INSERT INTO scraping_history (
      target_type,
      target_url, 
      platform,
      status,
      scraped_at,
      data_scraped
    ) VALUES (
      'campaign_baseline',
      NEW.track_url,
      'soundcloud',
      'baseline_triggered',
      NOW(),
      jsonb_build_object(
        'campaign_id', NEW.id,
        'trigger_reason', 'status_changed_to_active'
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for campaign baseline capture
DROP TRIGGER IF EXISTS campaign_baseline_trigger ON campaigns;
CREATE TRIGGER campaign_baseline_trigger
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION capture_campaign_baseline();

-- Add indexes for better campaign attribution query performance
CREATE INDEX IF NOT EXISTS idx_attribution_snapshots_campaign 
  ON attribution_snapshots (parent_type, parent_id, day_index) 
  WHERE parent_type = 'campaign';

CREATE INDEX IF NOT EXISTS idx_attribution_snapshots_date 
  ON attribution_snapshots (snapshot_date, parent_type);

-- Create view for campaign performance analytics
CREATE OR REPLACE VIEW campaign_attribution_analytics AS
SELECT 
  c.id as campaign_id,
  c.artist_name,
  c.track_name,
  c.track_url,
  c.start_date,
  c.end_date,
  c.status,
  c.goal_reposts,
  c.price_usd,
  
  -- Baseline metrics (day 0)
  baseline.plays as baseline_plays,
  baseline.likes as baseline_likes,
  baseline.reposts as baseline_reposts,
  baseline.comments as baseline_comments,
  baseline.snapshot_date as baseline_date,
  
  -- Latest metrics
  latest.plays as current_plays,
  latest.likes as current_likes,
  latest.reposts as current_reposts,
  latest.comments as current_comments,
  latest.snapshot_date as latest_date,
  latest.day_index as days_tracked,
  
  -- Growth calculations
  COALESCE(latest.plays - baseline.plays, 0) as plays_gained,
  COALESCE(latest.likes - baseline.likes, 0) as likes_gained,
  COALESCE(latest.reposts - baseline.reposts, 0) as reposts_gained,
  COALESCE(latest.comments - baseline.comments, 0) as comments_gained,
  
  -- Performance metrics
  CASE 
    WHEN c.goal_reposts > 0 THEN 
      ROUND((COALESCE(latest.reposts - baseline.reposts, 0)::numeric / c.goal_reposts * 100), 2)
    ELSE NULL 
  END as repost_goal_progress_pct,
  
  CASE 
    WHEN c.price_usd > 0 AND latest.reposts > baseline.reposts THEN 
      ROUND(c.price_usd / (latest.reposts - baseline.reposts), 2)
    ELSE NULL 
  END as cost_per_repost,
  
  CASE 
    WHEN c.price_usd > 0 AND latest.plays > baseline.plays THEN 
      ROUND(c.price_usd / (latest.plays - baseline.plays), 4)
    ELSE NULL 
  END as cost_per_play

FROM campaigns c
LEFT JOIN attribution_snapshots baseline ON (
  baseline.parent_type = 'campaign' 
  AND baseline.parent_id = c.id 
  AND baseline.day_index = 0
)
LEFT JOIN attribution_snapshots latest ON (
  latest.parent_type = 'campaign' 
  AND latest.parent_id = c.id 
  AND latest.day_index = (
    SELECT MAX(day_index) 
    FROM attribution_snapshots 
    WHERE parent_type = 'campaign' AND parent_id = c.id
  )
)
WHERE c.track_url IS NOT NULL
ORDER BY c.created_at DESC;