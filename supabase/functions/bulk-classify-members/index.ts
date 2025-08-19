import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID')!;
const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory job tracking (for demo - use a database in production)
const jobs = new Map<string, { processed: number; total: number; completed: boolean }>();

// Genre mapping (same as classify-track function)
const genreMapping: Record<string, { family: string; subgenres: string[] }> = {
  // Electronic - Dubstep variations
  'dubstep': { family: 'Electronic', subgenres: ['Dubstep'] },
  'riddim': { family: 'Electronic', subgenres: ['Riddim'] },
  'brostep': { family: 'Electronic', subgenres: ['Brostep'] },
  'tearout dubstep': { family: 'Electronic', subgenres: ['Tearout'] },
  'deep dubstep': { family: 'Electronic', subgenres: ['Deep Dubstep'] },
  'deathstep': { family: 'Electronic', subgenres: ['Deathstep'] },
  'melodic dubstep': { family: 'Electronic', subgenres: ['Melodic Dubstep'] },
  'future dubstep': { family: 'Electronic', subgenres: ['Future Dubstep'] },
  
  // Electronic - Other EDM
  'house': { family: 'Electronic', subgenres: ['House'] },
  'deep house': { family: 'Electronic', subgenres: ['Deep House'] },
  'tech house': { family: 'Electronic', subgenres: ['Tech House'] },
  'progressive house': { family: 'Electronic', subgenres: ['Progressive House'] },
  'techno': { family: 'Electronic', subgenres: ['Techno'] },
  'trance': { family: 'Electronic', subgenres: ['Trance'] },
  'drum and bass': { family: 'Electronic', subgenres: ['Drum & Bass'] },
  'dnb': { family: 'Electronic', subgenres: ['Drum & Bass'] },
  'future bass': { family: 'Electronic', subgenres: ['Future Bass'] },
  'trap': { family: 'Electronic', subgenres: ['Electronic Trap'] },
  'electronic': { family: 'Electronic', subgenres: ['Electronic'] },
  'edm': { family: 'Electronic', subgenres: ['EDM'] },
  
  // Hip-Hop
  'hip hop': { family: 'Hip-Hop', subgenres: ['Hip-Hop'] },
  'rap': { family: 'Hip-Hop', subgenres: ['Rap'] },
  'trap rap': { family: 'Hip-Hop', subgenres: ['Trap Rap'] },
  'drill': { family: 'Hip-Hop', subgenres: ['Drill'] },
  
  // Pop
  'pop': { family: 'Pop', subgenres: ['Pop'] },
  'electropop': { family: 'Pop', subgenres: ['Electropop'] },
  'synth-pop': { family: 'Pop', subgenres: ['Synth-pop'] },
  'indie pop': { family: 'Pop', subgenres: ['Indie Pop'] },
  
  // Rock
  'rock': { family: 'Rock', subgenres: ['Rock'] },
  'alternative rock': { family: 'Rock', subgenres: ['Alternative Rock'] },
  'indie rock': { family: 'Rock', subgenres: ['Indie Rock'] },
  'hard rock': { family: 'Rock', subgenres: ['Hard Rock'] },
  
  // R&B
  'r&b': { family: 'R&B', subgenres: ['R&B'] },
  'rnb': { family: 'R&B', subgenres: ['R&B'] },
  'soul': { family: 'R&B', subgenres: ['Soul'] },
  'funk': { family: 'R&B', subgenres: ['Funk'] },
  
  // Other
  'folk': { family: 'Folk', subgenres: ['Folk'] },
  'country': { family: 'Country', subgenres: ['Country'] },
  'jazz': { family: 'Jazz', subgenres: ['Jazz'] },
  'reggae': { family: 'Reggae', subgenres: ['Reggae'] },
  'latin': { family: 'Latin', subgenres: ['Latin'] },
};

async function getSpotifyAccessToken(): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function classifyMemberGenres(member: any, accessToken: string, supabase: any) {
  if (!member.spotify_url) {
    console.log(`Member ${member.name} has no Spotify URL, skipping`);
    return { success: false, reason: 'No Spotify URL' };
  }

  try {
    const artistIdMatch = member.spotify_url.match(/artist\/([a-zA-Z0-9]+)/);
    if (!artistIdMatch) {
      throw new Error('Invalid Spotify artist URL format');
    }

    const artistId = artistIdMatch[1];
    
    // Get artist details from Spotify
    const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!artistResponse.ok) {
      throw new Error(`Spotify API error: ${artistResponse.status}`);
    }

    const artistData = await artistResponse.json();
    const spotifyGenres = artistData.genres || [];
    
    console.log(`Classifying ${member.name} with genres:`, spotifyGenres);
    
    if (spotifyGenres.length === 0) {
      console.log(`No genres found for ${member.name}`);
      return { success: false, reason: 'No genres found' };
    }

    // Classify genres using the same logic as classify-track
    let classification = null;
    
    // Try exact matches first
    for (const genre of spotifyGenres) {
      const lowerGenre = genre.toLowerCase();
      if (genreMapping[lowerGenre]) {
        classification = genreMapping[lowerGenre];
        console.log(`Exact match found: ${lowerGenre}`, classification);
        break;
      }
    }
    
    // Try partial matches if no exact match
    if (!classification) {
      for (const genre of spotifyGenres) {
        const lowerGenre = genre.toLowerCase();
        for (const [key, value] of Object.entries(genreMapping)) {
          if (lowerGenre.includes(key) || key.includes(lowerGenre)) {
            classification = value;
            console.log(`Partial match found: ${lowerGenre} -> ${key}`, classification);
            break;
          }
        }
        if (classification) break;
      }
    }
    
    // Fallback classification
    if (!classification) {
      classification = { family: 'Other', subgenres: ['Unclassified'] };
      console.log('No match found, using fallback classification');
    }

    // Update member in database
    const { error: updateError } = await supabase
      .from('members')
      .update({
        families: [classification.family],
        subgenres: classification.subgenres,
        spotify_genres: spotifyGenres,
        last_classified_at: new Date().toISOString(),
        classification_source: 'auto',
        spotify_genres_updated_at: new Date().toISOString()
      })
      .eq('id', member.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully classified ${member.name} as ${classification.family}`);
    return { 
      success: true, 
      classification,
      spotifyGenres 
    };

  } catch (error: any) {
    console.error(`Error classifying ${member.name}:`, error);
    return { 
      success: false, 
      reason: error.message 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { memberIds, scope } = await req.json();
    
    if (!memberIds || !Array.isArray(memberIds)) {
      return new Response(
        JSON.stringify({ error: 'memberIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate job ID
    const jobId = crypto.randomUUID();
    jobs.set(jobId, { processed: 0, total: memberIds.length, completed: false });

    // Start background processing
    EdgeRuntime.waitUntil((async () => {
      try {
        console.log(`Starting bulk classification job ${jobId} for ${memberIds.length} members`);
        
        // Get Spotify access token
        const accessToken = await getSpotifyAccessToken();
        
        // Fetch members
        const { data: members, error: fetchError } = await supabase
          .from('members')
          .select('*')
          .in('id', memberIds);

        if (fetchError) {
          throw fetchError;
        }

        let processed = 0;
        const results = [];

        // Process each member
        for (const member of members || []) {
          const result = await classifyMemberGenres(member, accessToken, supabase);
          results.push({ member: member.name, result });
          
          processed++;
          jobs.set(jobId, { processed, total: memberIds.length, completed: false });
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Mark job as completed
        jobs.set(jobId, { processed, total: memberIds.length, completed: true });
        
        console.log(`Bulk classification job ${jobId} completed. Processed ${processed} members`);
        console.log('Results:', results);

        // Clean up job after 1 hour
        setTimeout(() => {
          jobs.delete(jobId);
        }, 3600000);

      } catch (error) {
        console.error(`Error in bulk classification job ${jobId}:`, error);
        jobs.set(jobId, { processed: 0, total: memberIds.length, completed: true });
      }
    })());

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId,
        message: `Started bulk classification for ${memberIds.length} members`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in bulk-classify-members function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
