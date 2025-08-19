import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genre mapping logic from Spotify genres to our genre families
const genreMapping: { [key: string]: { family: string; subgenres: string[] } } = {
  // Electronic / Bass Music
  'edm': { family: 'Electronic', subgenres: ['EDM'] },
  'house': { family: 'Electronic', subgenres: ['House'] },
  'techno': { family: 'Electronic', subgenres: ['Techno'] },
  'trance': { family: 'Electronic', subgenres: ['Trance'] },
  'dubstep': { family: 'Electronic', subgenres: ['Dubstep'] },
  'brostep': { family: 'Electronic', subgenres: ['Brostep'] },
  'riddim': { family: 'Electronic', subgenres: ['Riddim'] },
  'tearout': { family: 'Electronic', subgenres: ['Tearout'] },
  'melodic dubstep': { family: 'Electronic', subgenres: ['Melodic Dubstep'] },
  'color bass': { family: 'Electronic', subgenres: ['Color Bass'] },
  'future riddim': { family: 'Electronic', subgenres: ['Future Riddim'] },
  'drumstep': { family: 'Electronic', subgenres: ['Drumstep'] },
  'trapstep': { family: 'Electronic', subgenres: ['Trapstep'] },
  'bass music': { family: 'Electronic', subgenres: ['Bass Music'] },
  'uk bass': { family: 'Electronic', subgenres: ['UK Bass'] },
  'deep dubstep': { family: 'Electronic', subgenres: ['Deep Dubstep'] },
  'future bass': { family: 'Electronic', subgenres: ['Future Bass'] },
  'synth-pop': { family: 'Electronic', subgenres: ['Synth Pop'] },
  'synthpop': { family: 'Electronic', subgenres: ['Synth Pop'] },
  
  // Hip Hop
  'hip hop': { family: 'Hip Hop', subgenres: ['Hip Hop'] },
  'rap': { family: 'Hip Hop', subgenres: ['Hip Hop'] },
  'trap': { family: 'Hip Hop', subgenres: ['Trap'] },
  'drill': { family: 'Hip Hop', subgenres: ['Drill'] },
  'boom bap': { family: 'Hip Hop', subgenres: ['Boom Bap'] },
  
  // Rock
  'rock': { family: 'Rock', subgenres: ['Rock'] },
  'alternative rock': { family: 'Rock', subgenres: ['Alternative Rock'] },
  'indie rock': { family: 'Rock', subgenres: ['Indie Rock'] },
  'hard rock': { family: 'Rock', subgenres: ['Hard Rock'] },
  'metal': { family: 'Rock', subgenres: ['Metal'] },
  
  // Pop
  'pop': { family: 'Pop', subgenres: ['Pop'] },
  'indie pop': { family: 'Pop', subgenres: ['Indie Pop'] },
  'alternative pop': { family: 'Pop', subgenres: ['Alternative Pop'] },
  
  // Alternative
  'alternative': { family: 'Alternative', subgenres: ['Alternative'] },
  'indie': { family: 'Alternative', subgenres: ['Indie'] },
  
  // R&B
  'r&b': { family: 'R&B', subgenres: ['R&B'] },
  'rnb': { family: 'R&B', subgenres: ['R&B'] },
  'contemporary r&b': { family: 'R&B', subgenres: ['Contemporary R&B'] },
  'neo soul': { family: 'R&B', subgenres: ['Neo Soul'] },
};

async function getSpotifyAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Failed to get Spotify token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function extractTrackInfo(url: string): { artist?: string; track?: string; spotifyId?: string; artistId?: string } {
  try {
    // Handle Spotify URLs
    if (url.includes('spotify.com') || url.includes('open.spotify.com')) {
      const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
      if (trackMatch) {
        return { spotifyId: trackMatch[1] };
      }
      
      const artistMatch = url.match(/artist\/([a-zA-Z0-9]+)/);
      if (artistMatch) {
        return { artistId: artistMatch[1] };
      }
    }
    
    // Handle SoundCloud URLs - extract artist and track from URL path
    if (url.includes('soundcloud.com')) {
      const urlParts = new URL(url).pathname.split('/').filter(part => part);
      if (urlParts.length >= 2) {
        const artist = urlParts[0].replace(/-/g, ' ');
        const track = urlParts[1].replace(/-/g, ' ');
        return { artist, track };
      }
    }
    
    return {};
  } catch (error) {
    console.error('Error extracting track info:', error);
    return {};
  }
}

async function searchSpotifyTrack(accessToken: string, artist: string, track: string): Promise<any> {
  const query = encodeURIComponent(`artist:${artist} track:${track}`);
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tracks?.items?.[0] || null;
}

async function getSpotifyTrackById(accessToken: string, trackId: string): Promise<any> {
  const response = await fetch(
    `https://api.spotify.com/v1/tracks/${trackId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get Spotify track: ${response.statusText}`);
  }

  return await response.json();
}

async function getSpotifyArtistById(accessToken: string, artistId: string): Promise<any> {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get Spotify artist: ${response.statusText}`);
  }

  return await response.json();
}

async function getAudioFeatures(accessToken: string, trackId: string): Promise<any> {
  const response = await fetch(
    `https://api.spotify.com/v1/audio-features/${trackId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.warn('Failed to get audio features, continuing without them');
    return null;
  }

  return await response.json();
}

function classifyGenres(spotifyGenres: string[]): { family: string; subgenres: string[] } {
  console.log('Classifying genres:', spotifyGenres);
  
  // Try exact matches first
  for (const genre of spotifyGenres) {
    const lowerGenre = genre.toLowerCase();
    if (genreMapping[lowerGenre]) {
      console.log('Exact match found:', lowerGenre, genreMapping[lowerGenre]);
      return genreMapping[lowerGenre];
    }
  }
  
  // Try partial matches
  for (const genre of spotifyGenres) {
    const lowerGenre = genre.toLowerCase();
    for (const [mappedGenre, classification] of Object.entries(genreMapping)) {
      if (lowerGenre.includes(mappedGenre) || mappedGenre.includes(lowerGenre)) {
        console.log('Partial match found:', mappedGenre, classification);
        return classification;
      }
    }
  }
  
  // Default classification based on common patterns
  const genreStr = spotifyGenres.join(' ').toLowerCase();
  
  if (genreStr.includes('electronic') || genreStr.includes('dance') || genreStr.includes('bass')) {
    return { family: 'Electronic', subgenres: ['Electronic'] };
  }
  if (genreStr.includes('hip') || genreStr.includes('rap')) {
    return { family: 'Hip Hop', subgenres: ['Hip Hop'] };
  }
  if (genreStr.includes('rock') || genreStr.includes('metal')) {
    return { family: 'Rock', subgenres: ['Rock'] };
  }
  if (genreStr.includes('pop')) {
    return { family: 'Pop', subgenres: ['Pop'] };
  }
  
  console.log('No match found, using default');
  return { family: 'Alternative', subgenres: ['Alternative'] };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackUrl, submissionId, memberId } = await req.json();
    
    if (!trackUrl) {
      return new Response(
        JSON.stringify({ error: 'Track URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Classifying track:', trackUrl);

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    
    // Extract track/artist information from URL
    const trackInfo = extractTrackInfo(trackUrl);
    console.log('Extracted info:', trackInfo);
    
    let spotifyTrack = null;
    let artistGenres: string[] = [];
    let audioFeatures = null;
    let artistData = null;
    
    if (trackInfo.artistId) {
      // Direct Spotify artist URL for member classification
      artistData = await getSpotifyArtistById(accessToken, trackInfo.artistId);
      artistGenres.push(...(artistData.genres || []));
      console.log('Found Spotify artist:', artistData.name);
    } else if (trackInfo.spotifyId) {
      // Direct Spotify track
      spotifyTrack = await getSpotifyTrackById(accessToken, trackInfo.spotifyId);
      
      // Get genres from track artists
      for (const artist of spotifyTrack.artists) {
        const artistResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artist.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        
        if (artistResponse.ok) {
          const artistResponseData = await artistResponse.json();
          artistGenres.push(...(artistResponseData.genres || []));
        }
      }
      
      audioFeatures = await getAudioFeatures(accessToken, spotifyTrack.id);
      console.log('Found Spotify track:', spotifyTrack.name, 'by', spotifyTrack.artists[0].name);
    } else if (trackInfo.artist && trackInfo.track) {
      // Search for SoundCloud track on Spotify
      spotifyTrack = await searchSpotifyTrack(accessToken, trackInfo.artist, trackInfo.track);
      
      if (spotifyTrack) {
        // Get genres from track artists
        for (const artist of spotifyTrack.artists) {
          const artistResponse = await fetch(
            `https://api.spotify.com/v1/artists/${artist.id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          
          if (artistResponse.ok) {
            const artistResponseData = await artistResponse.json();
            artistGenres.push(...(artistResponseData.genres || []));
          }
        }
        
        audioFeatures = await getAudioFeatures(accessToken, spotifyTrack.id);
        console.log('Found Spotify track:', spotifyTrack.name, 'by', spotifyTrack.artists[0].name);
      }
    }
    
    if (!spotifyTrack && !artistData) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not find track or artist on Spotify',
          suggestion: 'Try manually setting the genre classification'
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Classify genres
    const classification = classifyGenres(artistGenres);
    
    console.log('Classification result:', classification);

    // Prepare holder for updated member
    let updatedMember: any = null;

    // If submissionId provided, update the submission
    if (submissionId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          family: classification.family,
          subgenres: classification.subgenres,
        })
        .eq('id', submissionId);
      
      if (updateError) {
        console.error('Failed to update submission:', updateError);
      } else {
        console.log('Updated submission with classification');
      }
    }
    
    // If memberId provided, update the member
    if (memberId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: updated, error: updateError } = await supabase
        .from('members')
        .update({
          families: [classification.family],
          subgenres: classification.subgenres,
          spotify_genres: artistGenres,
        })
        .eq('id', memberId)
        .select('*')
        .single();
      
      if (updateError) {
        console.error('Failed to update member:', updateError);
      } else {
        updatedMember = updated;
        console.log('Updated member with classification');
      }
    }

    const result = {
      success: true,
      trackInfo: spotifyTrack ? {
        name: spotifyTrack.name,
        artist: spotifyTrack.artists[0].name,
        spotifyUrl: spotifyTrack.external_urls.spotify,
      } : null,
      artistInfo: artistData ? {
        name: artistData.name,
        spotifyUrl: artistData.external_urls.spotify,
        followers: artistData.followers?.total || 0,
      } : null,
      classification,
      spotifyGenres: artistGenres,
      audioFeatures: audioFeatures ? {
        danceability: audioFeatures.danceability,
        energy: audioFeatures.energy,
        valence: audioFeatures.valence,
        tempo: audioFeatures.tempo,
      } : null,
      updatedMember,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in classify-track function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});