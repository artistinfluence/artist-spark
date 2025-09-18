import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackMetrics {
  track_url: string
  track_title?: string
  artist_handle?: string
  play_count: number
  like_count: number
  repost_count: number
  comment_count: number
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { track_url } = await req.json()
    
    if (!track_url) {
      throw new Error('SoundCloud track URL is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const startTime = Date.now()
    console.log('Scraping SoundCloud track:', track_url)

    // Log scraping attempt
    const { data: historyData } = await supabase
      .from('scraping_history')
      .insert({
        target_type: 'track',
        target_url: track_url,
        platform: 'soundcloud',
        status: 'pending'
      })
      .select()
      .single()

    try {
      // Perform actual web scraping
      const metrics = await scrapeTrackMetrics(track_url)
      const responseTime = Date.now() - startTime

      // Update scraping history with success
      await supabase
        .from('scraping_history')
        .update({
          status: 'success',
          data_scraped: metrics,
          response_time_ms: responseTime,
          scraped_at: new Date().toISOString()
        })
        .eq('id', historyData.id)

      // Store track metrics
      await supabase
        .from('track_metrics')
        .insert({
          track_url: metrics.track_url,
          track_title: metrics.track_title,
          artist_handle: metrics.artist_handle,
          play_count: metrics.play_count,
          like_count: metrics.like_count,
          repost_count: metrics.repost_count,
          comment_count: metrics.comment_count,
          collected_at: new Date().toISOString()
        })

      console.log('Track scraping completed:', metrics)

      return new Response(
        JSON.stringify({
          success: true,
          metrics,
          scraping_time_ms: responseTime,
          message: 'Track metrics scraped successfully'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (scrapingError: any) {
      const responseTime = Date.now() - startTime
      
      // Update scraping history with failure
      await supabase
        .from('scraping_history')
        .update({
          status: 'failed',
          error_message: scrapingError.message,
          response_time_ms: responseTime,
          scraped_at: new Date().toISOString()
        })
        .eq('id', historyData.id)

      throw scrapingError
    }

  } catch (error: any) {
    console.error('Error scraping SoundCloud track:', error)
    
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

async function scrapeTrackMetrics(trackUrl: string): Promise<TrackMetrics> {
  console.log('Scraping SoundCloud track with Browserless.io:', trackUrl)
  
  const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY')
  if (!browserlessApiKey) {
    throw new Error('BROWSERLESS_API_KEY not configured')
  }

  try {
    // Puppeteer script to scrape SoundCloud track metrics
    const puppeteerScript = `
      const page = args.page;
      
      console.log('Navigating to SoundCloud track...');
      await page.goto('${trackUrl}', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for content to load
      await page.waitForTimeout(5000);
      
      let trackMetrics = {
        track_url: '${trackUrl}',
        track_title: '',
        artist_handle: '',
        play_count: 0,
        like_count: 0,
        repost_count: 0,
        comment_count: 0
      };
      
      // Extract track title
      try {
        const titleElement = await page.$('h1[itemprop="name"], .soundTitle__title, .trackItem__trackTitle');
        if (titleElement) {
          trackMetrics.track_title = await titleElement.evaluate(el => el.textContent?.trim() || '');
        }
      } catch (e) {
        console.log('Could not extract track title:', e.message);
      }
      
      // Extract artist handle
      try {
        const artistElement = await page.$('a[itemprop="url"], .soundTitle__username a, .trackItem__username a');
        if (artistElement) {
          const href = await artistElement.evaluate(el => el.href || '');
          const match = href.match(/soundcloud\\.com\\/([^\/]+)/);
          if (match) {
            trackMetrics.artist_handle = match[1];
          }
        }
      } catch (e) {
        console.log('Could not extract artist handle:', e.message);
      }
      
      // Extract play count
      const playSelectors = [
        '.sc-ministats-plays .sc-visuallyhidden',
        '.playCount',
        '[title*="play"]',
        '.sc-font-light[title*="play"]'
      ];
      
      for (const selector of playSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.evaluate(el => el.textContent || el.title || '');
            const match = text.match(/([\\d,]+)\\s*play/i);
            if (match) {
              trackMetrics.play_count = parseInt(match[1].replace(/,/g, ''), 10);
              console.log('Found plays:', trackMetrics.play_count);
              break;
            }
          }
        } catch (e) {
          console.log('Play selector failed:', selector);
        }
      }
      
      // Extract like count
      const likeSelectors = [
        '.sc-ministats-likes .sc-visuallyhidden',
        '.sc-button-like .sc-visuallyhidden',
        '[title*="like"]'
      ];
      
      for (const selector of likeSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.evaluate(el => el.textContent || el.title || '');
            const match = text.match(/([\\d,]+)\\s*like/i);
            if (match) {
              trackMetrics.like_count = parseInt(match[1].replace(/,/g, ''), 10);
              console.log('Found likes:', trackMetrics.like_count);
              break;
            }
          }
        } catch (e) {
          console.log('Like selector failed:', selector);
        }
      }
      
      // Extract repost count
      const repostSelectors = [
        '.sc-ministats-reposts .sc-visuallyhidden',
        '.sc-button-repost .sc-visuallyhidden',
        '[title*="repost"]'
      ];
      
      for (const selector of repostSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.evaluate(el => el.textContent || el.title || '');
            const match = text.match(/([\\d,]+)\\s*repost/i);
            if (match) {
              trackMetrics.repost_count = parseInt(match[1].replace(/,/g, ''), 10);
              console.log('Found reposts:', trackMetrics.repost_count);
              break;
            }
          }
        } catch (e) {
          console.log('Repost selector failed:', selector);
        }
      }
      
      // Extract comment count
      const commentSelectors = [
        '.sc-ministats-comments .sc-visuallyhidden',
        '.commentsList__title',
        '[title*="comment"]'
      ];
      
      for (const selector of commentSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.evaluate(el => el.textContent || el.title || '');
            const match = text.match(/([\\d,]+)\\s*comment/i);
            if (match) {
              trackMetrics.comment_count = parseInt(match[1].replace(/,/g, ''), 10);
              console.log('Found comments:', trackMetrics.comment_count);
              break;
            }
          }
        } catch (e) {
          console.log('Comment selector failed:', selector);
        }
      }
      
      // If no metrics found, try parsing page source
      if (trackMetrics.play_count === 0) {
        const content = await page.content();
        const playMatch = content.match(/"playback_count"[\\s]*:[\\s]*(\\d+)/);
        if (playMatch) {
          trackMetrics.play_count = parseInt(playMatch[1], 10);
        }
        
        const likeMatch = content.match(/"likes_count"[\\s]*:[\\s]*(\\d+)/);
        if (likeMatch) {
          trackMetrics.like_count = parseInt(likeMatch[1], 10);
        }
        
        const repostMatch = content.match(/"reposts_count"[\\s]*:[\\s]*(\\d+)/);
        if (repostMatch) {
          trackMetrics.repost_count = parseInt(repostMatch[1], 10);
        }
        
        const commentMatch = content.match(/"comment_count"[\\s]*:[\\s]*(\\d+)/);
        if (commentMatch) {
          trackMetrics.comment_count = parseInt(commentMatch[1], 10);
        }
      }
      
      console.log('Final track metrics:', trackMetrics);
      return trackMetrics;
    `;

    const response = await fetch('https://chrome.browserless.io/function', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessApiKey}`,
      },
      body: JSON.stringify({
        code: puppeteerScript,
        context: {}
      }),
    })

    if (!response.ok) {
      throw new Error(`Browserless.io API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Browserless.io track result:', result)

    if (!result || typeof result.play_count !== 'number') {
      throw new Error('Invalid response from Browserless.io or could not extract track metrics')
    }

    // Parse URL for fallback data if needed
    const urlParts = trackUrl.split('/')
    const artistHandle = result.artist_handle || urlParts[urlParts.length - 2] || 'unknown-artist'
    const trackTitle = result.track_title || urlParts[urlParts.length - 1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Track'

    const metrics: TrackMetrics = {
      track_url: trackUrl,
      track_title: trackTitle,
      artist_handle: artistHandle,
      play_count: result.play_count || 0,
      like_count: result.like_count || 0,
      repost_count: result.repost_count || 0,
      comment_count: result.comment_count || 0
    }

    console.log(`Successfully scraped track: ${metrics.play_count} plays, ${metrics.like_count} likes, ${metrics.repost_count} reposts, ${metrics.comment_count} comments`)
    
    return metrics

  } catch (error: any) {
    console.error('Browserless.io track scraping failed:', error.message)
    throw new Error(`Failed to scrape track metrics with Browserless.io: ${error.message}`)
  }
}

serve(handler)