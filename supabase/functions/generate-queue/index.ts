import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      members: any
      submissions: any
      queues: any
      queue_assignments: any
      settings: any
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { date } = await req.json()
    console.log(`Generating queue for date: ${date}`)

    // Check if queue already exists for this date
    const { data: existingQueue } = await supabaseClient
      .from('queues')
      .select('id, status')
      .eq('date', date)
      .single()

    let queueId = existingQueue?.id

    // If queue exists, check if it already has assignments
    if (existingQueue) {
      const { data: existingAssignments } = await supabaseClient
        .from('queue_assignments')
        .select('id')
        .eq('queue_id', existingQueue.id)
        .limit(1)

      if (existingAssignments && existingAssignments.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: `Queue for ${date} already has assignments. Delete existing assignments first to regenerate.` 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      console.log(`Using existing queue ${existingQueue.id} for ${date}`)
    }

    // Get approved submissions that need support
    const { data: submissions } = await supabaseClient
      .from('submissions')
      .select(`
        id,
        member_id,
        track_url,
        artist_name,
        family,
        subgenres,
        expected_reach_planned,
        support_date,
        members!inner(name, status, size_tier)
      `)
      .eq('status', 'approved')
      .or(`support_date.eq.${date},support_date.is.null`)
      .eq('members.status', 'active')

    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ message: `No approved submissions found for ${date}` }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Found ${submissions.length} submissions for ${date}`)

    // Get active members available for supporting
    const { data: availableMembers } = await supabaseClient
      .from('members')
      .select(`
        id, 
        name, 
        status, 
        size_tier, 
        families, 
        subgenres,
        repost_credit_wallet!inner(
          balance,
          monthly_grant
        )
      `)
      .eq('status', 'active')
      .gt('repost_credit_wallet.balance', 0)

    if (!availableMembers || availableMembers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active members with credits available for supporting' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Found ${availableMembers.length} available supporters`)

    // Get settings for queue generation parameters
    const { data: settings } = await supabaseClient
      .from('settings')
      .select('adjacency_matrix, target_band_mode')
      .single()

    // Create the queue if it doesn't exist
    if (!existingQueue) {
      const { data: newQueue, error: queueError } = await supabaseClient
        .from('queues')
        .insert({
          date,
          status: 'draft',
          total_slots: 0,
          filled_slots: 0,
          notes: `Auto-generated queue for ${submissions.length} submissions`
        })
        .select('id')
        .single()

      if (queueError) {
        console.error('Error creating queue:', queueError)
        return new Response(
          JSON.stringify({ error: 'Failed to create queue' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      queueId = newQueue.id
      console.log(`Created queue with ID: ${newQueue.id}`)
    }

    // Generate assignments using fairness algorithm
    const assignments: Array<{
      queue_id: string
      submission_id: string
      supporter_id: string
      position: number
      credits_allocated: number
    }> = []

    let position = 1

    for (const submission of submissions) {
      // Find compatible supporters based on genre matching
      const compatibleSupporters = availableMembers.filter(member => {
        // Don't let members support their own submissions
        if (member.id === submission.member_id) return false

        // Check genre compatibility
        const submissionFamily = submission.family
        const submissionSubgenres = submission.subgenres || []
        
        const memberFamilies = member.families || []
        const memberSubgenres = member.subgenres || []

        // Match by family first, then by subgenres
        const familyMatch = memberFamilies.includes(submissionFamily)
        const subgenreMatch = submissionSubgenres.some(sg => memberSubgenres.includes(sg))

        return familyMatch || subgenreMatch
      })

      if (compatibleSupporters.length === 0) {
        console.log(`No compatible supporters found for submission ${submission.id}`)
        continue
      }

      // Sort by credits (prioritize members with more credits for fairness)
      compatibleSupporters.sort((a, b) => b.repost_credit_wallet.balance - a.repost_credit_wallet.balance)

      // Assign multiple supporters based on expected reach
      const targetReach = submission.expected_reach_planned || 1000
      const supportersNeeded = Math.min(
        Math.ceil(targetReach / 500), // Assume each supporter contributes ~500 reach
        Math.min(5, compatibleSupporters.length) // Max 5 supporters per track
      )

      for (let i = 0; i < supportersNeeded && i < compatibleSupporters.length; i++) {
        const supporter = compatibleSupporters[i]
        
        // Calculate credits to allocate (basic algorithm)
        const baseCredits = Math.min(100, supporter.repost_credit_wallet.balance)
        const creditsToAllocate = Math.max(50, Math.ceil(baseCredits * 0.7))

        assignments.push({
          queue_id: queueId,
          submission_id: submission.id,
          supporter_id: supporter.id,
          position: position++,
          credits_allocated: creditsToAllocate
        })
      }
    }

    console.log(`Generated ${assignments.length} assignments`)

    // Insert all assignments
    if (assignments.length > 0) {
      const { error: assignmentError } = await supabaseClient
        .from('queue_assignments')
        .insert(assignments)

      if (assignmentError) {
        console.error('Error creating assignments:', assignmentError)
        return new Response(
          JSON.stringify({ error: 'Failed to create queue assignments' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Update submissions with scheduled_date and support_date (for null support_dates)
      const submissionIds = [...new Set(assignments.map(a => a.submission_id))]
      const { error: updateError } = await supabaseClient
        .from('submissions')
        .update({ 
          scheduled_date: date,
          support_date: date  // Set support_date for submissions that had null
        })
        .in('id', submissionIds)

      if (updateError) {
        console.error('Error updating submission scheduled_date:', updateError)
        // Don't fail the entire process, just log the error
      }
    }

    // Update queue with final counts
    await supabaseClient
      .from('queues')
      .update({
        total_slots: assignments.length,
        filled_slots: assignments.length
      })
      .eq('id', queueId)

    console.log(`Queue generation completed successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        queue_id: queueId,
        assignments_created: assignments.length,
        message: `Queue generated with ${assignments.length} assignments for ${submissions.length} submissions`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in generate-queue function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})