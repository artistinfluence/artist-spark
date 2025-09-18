import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncResult {
  total_processed: number
  successful_syncs: number
  failed_syncs: number
  errors: Array<{ member_id: string, handle: string, error: string }>
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting daily follower sync...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all members with SoundCloud URLs that need syncing
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, soundcloud_url, soundcloud_handle, soundcloud_followers')
      .not('soundcloud_url', 'is', null)
      .order('last_classified_at', { ascending: true, nullsFirst: true })

    if (membersError) {
      throw new Error(`Failed to fetch members: ${membersError.message}`)
    }

    if (!members || members.length === 0) {
      console.log('No members with SoundCloud URLs found')
      return new Response(JSON.stringify({
        success: true,
        message: 'No members to sync',
        result: { total_processed: 0, successful_syncs: 0, failed_syncs: 0, errors: [] }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${members.length} members to sync`)

    const result: SyncResult = {
      total_processed: members.length,
      successful_syncs: 0,
      failed_syncs: 0,
      errors: []
    }

    // Process members in batches of 5 to avoid rate limiting
    const batchSize = 5
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(members.length / batchSize)}`)

      // Process batch members in parallel
      const batchPromises = batch.map(member => syncMemberFollowers(member, supabase))
      const batchResults = await Promise.allSettled(batchPromises)

      // Process batch results
      batchResults.forEach((batchResult, index) => {
        const member = batch[index]
        if (batchResult.status === 'fulfilled') {
          if (batchResult.value.success) {
            result.successful_syncs++
            console.log(`✓ Synced ${member.name}: ${batchResult.value.followers} followers`)
          } else {
            result.failed_syncs++
            result.errors.push({
              member_id: member.id,
              handle: member.soundcloud_handle || 'unknown',
              error: batchResult.value.error
            })
            console.log(`✗ Failed to sync ${member.name}: ${batchResult.value.error}`)
          }
        } else {
          result.failed_syncs++
          result.errors.push({
            member_id: member.id,
            handle: member.soundcloud_handle || 'unknown',
            error: batchResult.reason?.message || 'Unknown error'
          })
          console.log(`✗ Failed to sync ${member.name}: ${batchResult.reason?.message}`)
        }
      })

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < members.length) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    // Log summary
    console.log(`Sync completed: ${result.successful_syncs}/${result.total_processed} successful`)
    
    // Send notification if there are significant failures
    if (result.failed_syncs > result.total_processed * 0.2) {
      console.warn(`High failure rate: ${result.failed_syncs}/${result.total_processed} failed`)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Daily follower sync completed',
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Error in daily follower sync:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function syncMemberFollowers(member: any, supabase: any): Promise<{ success: boolean, followers?: number, error?: string }> {
  try {
    if (!member.soundcloud_url) {
      return { success: false, error: 'No SoundCloud URL' }
    }

    // Extract handle from URL
    const handle = extractHandleFromUrl(member.soundcloud_url)
    
    // Scrape current follower count
    const followers = await scrapeFollowerCount(handle, supabase)
    
    // Update member record
    const { error: updateError } = await supabase
      .from('members')
      .update({
        soundcloud_followers: followers,
        last_classified_at: new Date().toISOString(),
        classification_source: 'daily_sync'
      })
      .eq('id', member.id)
      
    if (updateError) {
      throw new Error(`Failed to update member: ${updateError.message}`)
    }

    // Update member_accounts if exists
    const { error: accountError } = await supabase
      .from('member_accounts')
      .update({
        follower_count: followers,
        last_synced_at: new Date().toISOString(),
        status: 'linked'
      })
      .eq('member_id', member.id)
      .eq('platform', 'soundcloud')
      
    // Don't throw error if account doesn't exist, just log it
    if (accountError) {
      console.warn(`Failed to update member_accounts for ${member.id}: ${accountError.message}`)
    }

    return { success: true, followers }

  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

function extractHandleFromUrl(url: string): string {
  const match = url.match(/soundcloud\.com\/([^\/]+)/i)
  if (!match) {
    throw new Error('Invalid SoundCloud URL format')
  }
  return match[1]
}

async function scrapeFollowerCount(handle: string, supabase: any): Promise<number> {
  const profileUrl = `https://soundcloud.com/${handle}`
  
  // Log scraping attempt
  const { data: historyData } = await supabase
    .from('scraping_history')
    .insert({
      target_type: 'profile',
      target_url: profileUrl,
      target_handle: handle,
      platform: 'soundcloud',
      status: 'pending'
    })
    .select()
    .single()

  const startTime = Date.now()

  try {
    // Add random delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    let followers = 0

    // Extract follower count using multiple methods
    const metaFollowersMatch = html.match(/<meta[^>]*property="soundcloud:follower_count"[^>]*content="(\d+)"/i)
    if (metaFollowersMatch) {
      followers = parseInt(metaFollowersMatch[1], 10)
    }

    if (!followers) {
      const followerPatterns = [
        /(\d+(?:,\d+)*)\s+followers?/i,
        /followers[:\s]*(\d+(?:,\d+)*)/i,
        /"follower_count["\s]*:["\s]*(\d+)/i,
      ]
      
      for (const pattern of followerPatterns) {
        const match = html.match(pattern)
        if (match) {
          followers = parseInt(match[1].replace(/,/g, ''), 10)
          break
        }
      }
    }

    if (!followers || isNaN(followers)) {
      throw new Error('Could not extract follower count')
    }

    const responseTime = Date.now() - startTime

    // Update scraping history with success
    await supabase
      .from('scraping_history')
      .update({
        status: 'success',
        data_scraped: { followers, scraped_method: 'html_parse' },
        response_time_ms: responseTime,
        scraped_at: new Date().toISOString()
      })
      .eq('id', historyData.id)

    return followers

  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    // Update scraping history with failure
    await supabase
      .from('scraping_history')
      .update({
        status: 'failed',
        error_message: error.message,
        response_time_ms: responseTime,
        scraped_at: new Date().toISOString()
      })
      .eq('id', historyData.id)

    throw error
  }
}

serve(handler)