import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  soundcloudUrl: string;
}

interface AnalyzeResponse {
  success: boolean;
  followers?: number;
  profileName?: string;
  error?: string;
}

async function analyzeSoundCloudProfile(url: string): Promise<AnalyzeResponse> {
  try {
    console.log('Analyzing SoundCloud profile:', url);

    // Validate SoundCloud URL format
    const soundcloudRegex = /^https:\/\/(www\.)?soundcloud\.com\/[a-zA-Z0-9\-_]+\/?$/;
    if (!soundcloudRegex.test(url)) {
      return {
        success: false,
        error: 'Invalid SoundCloud URL format'
      };
    }

    // For now, we'll use a fetch-based approach to get basic profile info
    // In a production environment, you would use Puppeteer or similar for scraping
    // This is a simplified implementation that attempts to extract data from the page
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch profile: ${response.status}`
      };
    }

    const html = await response.text();
    
    // Extract profile name from meta tags or title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const profileName = titleMatch ? titleMatch[1].replace(' | Free Listening on SoundCloud', '').trim() : 'Unknown';

    // Try to extract follower count from various possible locations in the HTML
    // SoundCloud uses dynamic loading, so this is a simplified approach
    const followerPatterns = [
      /followers":\s*(\d+)/gi,
      /"followers_count":\s*(\d+)/gi,
      /(\d+)\s*followers/gi,
      /follower_count["\s]*:\s*(\d+)/gi
    ];

    let followers = 0;
    for (const pattern of followerPatterns) {
      const match = html.match(pattern);
      if (match) {
        followers = parseInt(match[1], 10);
        break;
      }
    }

    console.log(`Extracted data - Profile: ${profileName}, Followers: ${followers}`);

    return {
      success: true,
      followers,
      profileName
    };

  } catch (error) {
    console.error('Error analyzing SoundCloud profile:', error);
    return {
      success: false,
      error: `Analysis failed: ${error.message}`
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { soundcloudUrl }: AnalyzeRequest = await req.json();

    if (!soundcloudUrl) {
      return new Response(
        JSON.stringify({ error: 'SoundCloud URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Received request to analyze:', soundcloudUrl);

    const result = await analyzeSoundCloudProfile(soundcloudUrl);

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});