import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign_id } = await req.json()
    
    if (!campaign_id) {
      throw new Error('Campaign ID is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Capturing baseline for campaign:', campaign_id)

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`)
    }

    if (!campaign.track_url) {
      throw new Error('Campaign has no track URL to scrape')
    }

    // Check if baseline already exists
    const { data: existingBaseline } = await supabase
      .from('attribution_snapshots')
      .select('id')
      .eq('parent_type', 'campaign')
      .eq('parent_id', campaign_id)
      .eq('day_index', 0)
      .single()

    if (existingBaseline) {
      console.log('Baseline already exists for campaign:', campaign_id)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Baseline already captured',
          campaign_id
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Call scrape-soundcloud-track function to get current metrics
    const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke(
      'scrape-soundcloud-track',
      {
        body: { track_url: campaign.track_url }
      }
    )

    if (scrapeError) {
      console.error('Failed to scrape track for baseline:', scrapeError)
      throw new Error(`Failed to scrape track: ${scrapeError.message}`)
    }

    if (!scrapeResult?.success || !scrapeResult?.metrics) {
      throw new Error('Invalid scraping response for baseline capture')
    }

    const metrics = scrapeResult.metrics

    // Update the baseline snapshot with actual metrics
    const { error: updateError } = await supabase
      .from('attribution_snapshots')
      .update({
        plays: metrics.play_count || 0,
        likes: metrics.like_count || 0,
        reposts: metrics.repost_count || 0,
        comments: metrics.comment_count || 0,
        collected_at: new Date().toISOString(),
        metadata: {
          baseline_captured: true,
          track_url: campaign.track_url,
          artist_name: campaign.artist_name,
          track_name: campaign.track_name,
          campaign_start_date: campaign.start_date,
          baseline_trigger: 'api_call',
          scraped_metrics: metrics
        }
      })
      .eq('parent_type', 'campaign')
      .eq('parent_id', campaign_id)
      .eq('day_index', 0)

    if (updateError) {
      // If update failed, the baseline record might not exist, so create it
      const { error: insertError } = await supabase
        .from('attribution_snapshots')
        .insert({
          parent_type: 'campaign',
          parent_id: campaign_id,
          day_index: 0,
          snapshot_date: new Date().toISOString().split('T')[0],
          plays: metrics.play_count || 0,
          likes: metrics.like_count || 0,
          reposts: metrics.repost_count || 0,
          comments: metrics.comment_count || 0,
          collected_at: new Date().toISOString(),
          metadata: {
            baseline_captured: true,
            track_url: campaign.track_url,
            artist_name: campaign.artist_name,
            track_name: campaign.track_name,
            campaign_start_date: campaign.start_date,
            baseline_trigger: 'api_call',
            scraped_metrics: metrics
          },
          collection_source: 'baseline_capture'
        })

      if (insertError) {
        console.error('Failed to insert baseline:', insertError)
        throw new Error(`Failed to save baseline: ${insertError.message}`)
      }
    }

    // Update campaign baseline captured timestamp
    await supabase
      .from('campaigns')
      .update({
        baseline_captured_at: new Date().toISOString()
      })
      .eq('id', campaign_id)

    console.log('Baseline captured successfully:', {
      campaign_id,
      plays: metrics.play_count,
      likes: metrics.like_count,
      reposts: metrics.repost_count,
      comments: metrics.comment_count
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Baseline metrics captured successfully',
        campaign_id,
        baseline_metrics: {
          plays: metrics.play_count,
          likes: metrics.like_count,
          reposts: metrics.repost_count,
          comments: metrics.comment_count
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error capturing campaign baseline:', error)
    
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

serve(handler)