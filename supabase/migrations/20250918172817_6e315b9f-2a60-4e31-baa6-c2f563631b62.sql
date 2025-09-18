-- Fix the security definer view issue
DROP VIEW IF EXISTS campaign_attribution_analytics;

-- Recreate view without SECURITY DEFINER
CREATE VIEW campaign_attribution_analytics AS
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