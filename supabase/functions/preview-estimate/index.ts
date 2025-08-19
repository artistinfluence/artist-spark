import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackUrl } = await req.json();

    if (!trackUrl) {
      return new Response(
        JSON.stringify({ error: 'Track URL is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Preview estimate request for URL:', trackUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Classify the track using the existing classify-track function
    console.log('Calling classify-track function...');
    const { data: classificationResult, error: classifyError } = await supabase.functions.invoke('classify-track', {
      body: { url: trackUrl }
    });

    if (classifyError) {
      console.error('Classification error:', classifyError);
      return new Response(
        JSON.stringify({ error: 'Failed to classify track' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Classification result:', classificationResult);

    const { family, subgenres, artistName, trackName } = classificationResult;

    if (!family) {
      return new Response(
        JSON.stringify({ 
          error: 'Unable to classify track genre. Please ensure the URL is valid and the track has genre information.' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 2: Find active members with matching genres
    console.log('Querying members with matching genres...');
    let memberQuery = supabase
      .from('members')
      .select('id, name, soundcloud_followers, spotify_genres, families, subgenres, size_tier, reach_factor')
      .eq('status', 'active');

    // Filter by family
    memberQuery = memberQuery.contains('families', [family]);

    const { data: members, error: membersError } = await memberQuery;

    if (membersError) {
      console.error('Members query error:', membersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch supporter data' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${members?.length || 0} potential supporters`);

    // Step 3: Calculate reach estimates
    let totalPotentialReach = 0;
    const tierBreakdown = { T1: 0, T2: 0, T3: 0, T4: 0 };
    const supporterProfiles = [];

    if (members && members.length > 0) {
      for (const member of members) {
        const followers = member.soundcloud_followers || 0;
        const reachFactor = member.reach_factor || 0.060; // Default 6%
        const memberReach = Math.floor(followers * reachFactor);
        
        totalPotentialReach += memberReach;
        
        // Count by tier
        if (member.size_tier && tierBreakdown.hasOwnProperty(member.size_tier)) {
          tierBreakdown[member.size_tier]++;
        }

        // Add anonymized supporter profile
        supporterProfiles.push({
          name: member.name,
          followers: followers,
          tier: member.size_tier,
          estimatedReach: memberReach
        });
      }
    }

    // Sort supporters by follower count for display
    supporterProfiles.sort((a, b) => b.followers - a.followers);

    // Step 4: Get settings for context
    const { data: settings } = await supabase
      .from('settings')
      .select('default_reach_factor')
      .single();

    const defaultReachFactor = settings?.default_reach_factor || 0.060;

    // Step 5: Calculate additional metrics
    const averageReachPerSupporter = members?.length > 0 ? Math.floor(totalPotentialReach / members.length) : 0;
    const estimatedLikes = Math.floor(totalPotentialReach * 0.8); // 80% of reach typically likes
    const estimatedReposts = Math.floor(totalPotentialReach * 0.1); // 10% typically repost
    const estimatedComments = Math.floor(totalPotentialReach * 0.05); // 5% typically comment

    const result = {
      success: true,
      trackInfo: {
        artistName,
        trackName,
        url: trackUrl
      },
      classification: {
        family,
        subgenres: subgenres || []
      },
      supporters: {
        total: members?.length || 0,
        tierBreakdown,
        profiles: supporterProfiles.slice(0, 10) // Limit to top 10 for display
      },
      reachEstimate: {
        totalPotentialReach,
        averageReachPerSupporter,
        estimatedLikes,
        estimatedReposts,
        estimatedComments,
        reachFactorUsed: defaultReachFactor
      },
      metadata: {
        calculatedAt: new Date().toISOString(),
        dataSource: 'live'
      }
    };

    console.log('Preview estimate completed successfully');
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in preview-estimate function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});