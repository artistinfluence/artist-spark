import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InfluencePlanRequest {
  submission_id?: string
  campaign_id?: string
  track_url?: string
  genres?: string[]
  target_reach?: number
  date?: string
}

interface SupporterProfile {
  id: string
  name: string
  handle: string
  followers: number
  tier: string
  reach_factor: number
  genres: string[]
  net_credits: number
  compatibility_score: number
  estimated_reach: number
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: InfluencePlanRequest = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing influence plan request:', request)

    let targetGenres: string[] = []
    let targetReach = request.target_reach || 10000
    let parentId: string | null = null
    let parentType: string = 'submission'

    // Get track information and classify if needed
    if (request.track_url) {
      const classification = await classifyTrack(request.track_url)
      targetGenres = classification.genres
    } else if (request.genres) {
      targetGenres = request.genres
    }

    if (request.submission_id) {
      parentId = request.submission_id
      // Get submission details
      const { data: submission } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', request.submission_id)
        .single()
      
      if (submission) {
        targetGenres = submission.subgenres || submission.family ? [submission.family] : []
        targetReach = submission.expected_reach_planned || targetReach
      }
    } else if (request.campaign_id) {
      parentId = request.campaign_id
      parentType = 'campaign'
      // Get campaign details
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', request.campaign_id)
        .single()
      
      if (campaign) {
        targetReach = campaign.goal_reposts || targetReach
      }
    }

    // Find compatible supporters
    const supporters = await findCompatibleSupporters(supabase, targetGenres, targetReach)
    
    // Calculate proposal
    const proposal = await calculateInfluenceProposal(supporters, targetReach)
    
    // Save proposal to database
    const { data: savedProposal } = await supabase
      .from('target_proposals')
      .insert({
        parent_id: parentId,
        parent_type: parentType,
        criteria: {
          genres: targetGenres,
          target_reach: targetReach,
          date: request.date
        },
        proposed_targets: proposal.supporters,
        total_capacity: proposal.total_reach,
        estimated_credits: proposal.estimated_credits,
        conflicts: proposal.conflicts
      })
      .select('*')
      .single()

    console.log('Influence plan created:', savedProposal?.id)

    return new Response(
      JSON.stringify({
        success: true,
        proposal_id: savedProposal?.id,
        supporters: proposal.supporters,
        total_reach: proposal.total_reach,
        estimated_credits: proposal.estimated_credits,
        conflicts: proposal.conflicts,
        recommendations: proposal.recommendations
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Error creating influence plan:', error)
    
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

async function findCompatibleSupporters(supabase: any, genres: string[], targetReach: number): Promise<SupporterProfile[]> {
  // Get all active members with accounts
  const { data: members } = await supabase
    .from('members')
    .select(`
      *,
      member_accounts(*)
    `)
    .eq('status', 'active')
    .gt('net_credits', 0)
  
  if (!members) return []

  const supporters: SupporterProfile[] = members.map(member => {
    const soundcloudAccount = member.member_accounts?.find((acc: any) => acc.platform === 'soundcloud')
    
    // Calculate genre compatibility
    const memberGenres = member.families || []
    const genreOverlap = genres.filter(g => memberGenres.includes(g)).length
    const compatibilityScore = genres.length > 0 ? genreOverlap / genres.length : 0.5
    
    // Calculate estimated reach
    const baseReach = member.soundcloud_followers * (member.reach_factor || 0.06)
    const estimatedReach = Math.floor(baseReach * (0.7 + compatibilityScore * 0.3))
    
    return {
      id: member.id,
      name: member.name,
      handle: soundcloudAccount?.handle || member.soundcloud_handle || 'unknown',
      followers: member.soundcloud_followers || 0,
      tier: member.size_tier,
      reach_factor: member.reach_factor || 0.06,
      genres: memberGenres,
      net_credits: member.net_credits || 0,
      compatibility_score: compatibilityScore,
      estimated_reach: estimatedReach
    }
  })

  // Sort by compatibility and reach potential
  return supporters
    .filter(s => s.followers > 0)
    .sort((a, b) => {
      const scoreA = a.compatibility_score * 0.6 + (a.estimated_reach / 1000) * 0.4
      const scoreB = b.compatibility_score * 0.6 + (b.estimated_reach / 1000) * 0.4
      return scoreB - scoreA
    })
}

async function calculateInfluenceProposal(supporters: SupporterProfile[], targetReach: number) {
  let totalReach = 0
  let estimatedCredits = 0
  const selectedSupporters: any[] = []
  const conflicts: string[] = []
  const recommendations: string[] = []

  // Select supporters until we reach target
  for (const supporter of supporters) {
    if (totalReach >= targetReach) break
    
    // Check if supporter has enough credits
    if (supporter.net_credits <= 0) {
      conflicts.push(`${supporter.name} has insufficient credits`)
      continue
    }
    
    // Add supporter to selection
    selectedSupporters.push({
      member_id: supporter.id,
      name: supporter.name,
      handle: supporter.handle,
      followers: supporter.followers,
      estimated_reach: supporter.estimated_reach,
      compatibility_score: supporter.compatibility_score,
      credits_required: 1
    })
    
    totalReach += supporter.estimated_reach
    estimatedCredits += 1
    
    if (selectedSupporters.length >= 50) {
      recommendations.push('Consider splitting into multiple campaigns for better management')
      break
    }
  }

  // Add recommendations
  if (totalReach < targetReach * 0.8) {
    recommendations.push('Target reach may not be achievable with current supporter base')
  }
  
  if (estimatedCredits > 100) {
    recommendations.push('High credit cost - consider adjusting target reach')
  }
  
  const avgCompatibility = selectedSupporters.reduce((sum, s) => sum + s.compatibility_score, 0) / selectedSupporters.length
  if (avgCompatibility < 0.3) {
    recommendations.push('Low genre compatibility - consider refining target genres')
  }

  return {
    supporters: selectedSupporters,
    total_reach: totalReach,
    estimated_credits: estimatedCredits,
    conflicts,
    recommendations
  }
}

async function classifyTrack(trackUrl: string) {
  // Simulate track classification - would use ML/AI in real implementation
  const genres = ['Electronic', 'Hip-Hop', 'Pop', 'Rock', 'House', 'Techno']
  const randomGenres = genres.slice(0, Math.floor(Math.random() * 2) + 1)
  
  return {
    genres: randomGenres,
    confidence: Math.random() * 0.4 + 0.6 // 60-100%
  }
}

serve(handler)