import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncResult {
  campaign_id: string
  track_url: string
  success: boolean
  metrics?: any
  error?: string
  day_index: number
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting campaign metrics sync...')

    // Get all active campaigns with track URLs
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, track_url, artist_name, track_name, start_date, end_date')
      .eq('status', 'active')
      .not('track_url', 'is', null)
      .order('created_at', { ascending: true })

    if (campaignsError) {
      throw new Error(`Failed to fetch active campaigns: ${campaignsError.message}`)
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No active campaigns found to sync')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active campaigns to sync',
          campaigns_processed: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${campaigns.length} active campaigns to sync`)

    const results: SyncResult[] = []
    
    // Process campaigns in batches to avoid overwhelming Browserless.io
    const BATCH_SIZE = 3
    
    for (let i = 0; i < campaigns.length; i += BATCH_SIZE) {
      const batch = campaigns.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} campaigns`)

      // Process batch in parallel
      const batchPromises = batch.map(campaign => syncCampaignMetrics(supabase, campaign))
      const batchResults = await Promise.allSettled(batchPromises)

      // Collect results
      batchResults.forEach((result, index) => {
        const campaign = batch[index]
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`Failed to sync campaign ${campaign.id}:`, result.reason)
          results.push({
            campaign_id: campaign.id,
            track_url: campaign.track_url,
            success: false,
            error: result.reason?.message || 'Unknown error',
            day_index: 0
          })
        }
      })

      // Add delay between batches to be respectful to Browserless.io
      if (i + BATCH_SIZE < campaigns.length) {
        console.log('Waiting 10 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`Campaign sync completed: ${successCount} successful, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Campaign metrics sync completed',
        campaigns_processed: campaigns.length,
        successful_syncs: successCount,
        failed_syncs: failureCount,
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error in campaign metrics sync:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function syncCampaignMetrics(supabase: any, campaign: any): Promise<SyncResult> {
  try {
    console.log(`Syncing metrics for campaign ${campaign.id}: ${campaign.track_url}`)

    // Calculate day index based on start date
    const startDate = new Date(campaign.start_date)
    const today = new Date()
    const dayIndex = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check if we already have metrics for today
    const { data: existingSnapshot } = await supabase
      .from('attribution_snapshots')
      .select('id')
      .eq('parent_type', 'campaign')
      .eq('parent_id', campaign.id)
      .eq('day_index', dayIndex)
      .single()

    if (existingSnapshot) {
      console.log(`Metrics already captured for campaign ${campaign.id} day ${dayIndex}`)
      return {
        campaign_id: campaign.id,
        track_url: campaign.track_url,
        success: true,
        day_index: dayIndex,
        metrics: { message: 'Already captured today' }
      }
    }

    // Call scrape-soundcloud-track function
    const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke(
      'scrape-soundcloud-track',
      {
        body: { track_url: campaign.track_url }
      }
    )

    if (scrapeError) {
      throw new Error(`Scraping failed: ${scrapeError.message}`)
    }

    if (!scrapeResult?.success || !scrapeResult?.metrics) {
      throw new Error('Invalid scraping response')
    }

    const metrics = scrapeResult.metrics

    // Insert new attribution snapshot
    const { error: insertError } = await supabase
      .from('attribution_snapshots')
      .insert({
        parent_type: 'campaign',
        parent_id: campaign.id,
        day_index: dayIndex,
        snapshot_date: today.toISOString().split('T')[0],
        plays: metrics.play_count || 0,
        likes: metrics.like_count || 0,
        reposts: metrics.repost_count || 0,
        comments: metrics.comment_count || 0,
        collected_at: new Date().toISOString(),
        metadata: {
          track_url: campaign.track_url,
          artist_name: campaign.artist_name,
          track_name: campaign.track_name,
          sync_date: today.toISOString(),
          scraped_metrics: metrics
        },
        collection_source: 'daily_sync'
      })

    if (insertError) {
      throw new Error(`Failed to save metrics: ${insertError.message}`)
    }

    console.log(`Successfully synced campaign ${campaign.id}: ${metrics.play_count} plays, ${metrics.repost_count} reposts`)

    return {
      campaign_id: campaign.id,
      track_url: campaign.track_url,
      success: true,
      day_index: dayIndex,
      metrics: {
        plays: metrics.play_count,
        likes: metrics.like_count,
        reposts: metrics.repost_count,
        comments: metrics.comment_count
      }
    }

  } catch (error: any) {
    console.error(`Error syncing campaign ${campaign.id}:`, error)
    return {
      campaign_id: campaign.id,
      track_url: campaign.track_url,
      success: false,
      error: error.message,
      day_index: 0
    }
  }
}

serve(handler)