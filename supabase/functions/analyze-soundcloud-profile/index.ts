import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SoundCloudProfile {
  handle: string
  followers: number
  genres: string[]
  engagement_rate: number
  tier: 'T1' | 'T2' | 'T3' | 'T4'
  reach_factor: number
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, member_id } = await req.json()
    
    if (!url) {
      throw new Error('SoundCloud URL is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract handle from URL
    const handle = extractHandleFromUrl(url)
    console.log('Analyzing SoundCloud profile:', handle)

    // Simulate profile analysis (in real implementation, this would scrape or use API)
    const profile = await analyzeProfile(handle)
    
    // Update or create member account
    const { data: existingAccount } = await supabase
      .from('member_accounts')
      .select('*')
      .eq('member_id', member_id)
      .eq('platform', 'soundcloud')
      .single()

    if (existingAccount) {
      // Update existing account
      await supabase
        .from('member_accounts')
        .update({
          handle: profile.handle,
          follower_count: profile.followers,
          status: 'linked',
          last_synced_at: new Date().toISOString(),
          connection_data: {
            engagement_rate: profile.engagement_rate,
            genres: profile.genres,
            tier: profile.tier,
            reach_factor: profile.reach_factor
          }
        })
        .eq('id', existingAccount.id)
    } else {
      // Create new account
      await supabase
        .from('member_accounts')
        .insert({
          member_id,
          platform: 'soundcloud',
          handle: profile.handle,
          follower_count: profile.followers,
          status: 'linked',
          last_synced_at: new Date().toISOString(),
          connection_data: {
            engagement_rate: profile.engagement_rate,
            genres: profile.genres,
            tier: profile.tier,
            reach_factor: profile.reach_factor
          }
        })
    }

    // Update member's SoundCloud data
    await supabase
      .from('members')
      .update({
        soundcloud_url: url,
        soundcloud_handle: profile.handle,
        soundcloud_followers: profile.followers,
        size_tier: profile.tier,
        reach_factor: profile.reach_factor,
        families: profile.genres,
        last_classified_at: new Date().toISOString(),
        classification_source: 'soundcloud_analysis'
      })
      .eq('id', member_id)

    // Create integration status record
    await supabase
      .from('integration_status')
      .upsert({
        member_account_id: existingAccount?.id,
        account_handle: profile.handle,
        platform: 'soundcloud',
        status: 'linked',
        last_check_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        metadata: {
          analysis_version: '1.0',
          processed_at: new Date().toISOString()
        }
      })

    console.log('Profile analysis completed:', profile)

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        message: 'SoundCloud profile analyzed and updated successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error analyzing SoundCloud profile:', error)
    
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

function extractHandleFromUrl(url: string): string {
  // Extract handle from SoundCloud URL
  const match = url.match(/soundcloud\.com\/([^\/]+)/i)
  if (!match) {
    throw new Error('Invalid SoundCloud URL format')
  }
  return match[1]
}

async function analyzeProfile(handle: string): Promise<SoundCloudProfile> {
  // Simulate profile analysis - in real implementation would use SoundCloud API or scraping
  const mockFollowers = Math.floor(Math.random() * 50000) + 1000
  const mockGenres = ['Electronic', 'Hip-Hop', 'Pop', 'Rock'].slice(0, Math.floor(Math.random() * 3) + 1)
  
  let tier: 'T1' | 'T2' | 'T3' | 'T4' = 'T1'
  if (mockFollowers >= 100000) tier = 'T4'
  else if (mockFollowers >= 10000) tier = 'T3'
  else if (mockFollowers >= 1000) tier = 'T2'
  
  const engagementRate = Math.random() * 0.1 + 0.02 // 2-12%
  const reachFactor = engagementRate * (Math.random() * 0.5 + 0.5) // Based on engagement
  
  return {
    handle,
    followers: mockFollowers,
    genres: mockGenres,
    engagement_rate: engagementRate,
    tier,
    reach_factor: reachFactor
  }
}

serve(handler)