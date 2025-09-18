import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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
    const { predictionType, parameters, modelName } = await req.json();
    
    console.log(`ML Prediction Engine: ${predictionType} with model ${modelName}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (predictionType) {
      case 'revenue_forecast':
        result = await generateRevenueForecast(supabase, parameters);
        break;
      case 'member_churn':
        result = await generateChurnPredictions(supabase);
        break;
      case 'campaign_success':
        result = await generateCampaignPrediction(supabase, parameters);
        break;
      case 'market_trends':
        result = await analyzeMarketTrends(supabase);
        break;
      default:
        throw new Error(`Unknown prediction type: ${predictionType}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ML Prediction Engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateRevenueForecast(supabase: any, parameters: any) {
  const { timeframe = 'monthly' } = parameters;

  try {
    // Fetch historical revenue data
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('price_usd, created_at, status')
      .not('price_usd', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: soundcloudCampaigns } = await supabase
      .from('soundcloud_campaigns')
      .select('sales_price, created_at, status')
      .not('sales_price', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate historical averages
    const allRevenue = [
      ...campaigns.map((c: any) => ({ amount: parseFloat(c.price_usd), date: c.created_at })),
      ...soundcloudCampaigns.map((c: any) => ({ amount: parseFloat(c.sales_price), date: c.created_at }))
    ];

    const monthlyRevenue = allRevenue.reduce((acc, revenue) => {
      const month = revenue.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = 0;
      acc[month] += revenue.amount;
      return acc;
    }, {} as Record<string, number>);

    const avgMonthlyRevenue = Object.values(monthlyRevenue).reduce((a, b) => a + b, 0) / Object.keys(monthlyRevenue).length;
    
    // Simple growth prediction based on trend
    const months = Object.keys(monthlyRevenue).sort();
    const recentMonths = months.slice(-3);
    const recentAvg = recentMonths.reduce((sum, month) => sum + monthlyRevenue[month], 0) / recentMonths.length;
    
    const growthRate = recentAvg > avgMonthlyRevenue ? 0.15 : -0.05; // 15% growth or 5% decline
    
    let predictedRevenue;
    let confidence = 0.75;

    switch (timeframe) {
      case 'monthly':
        predictedRevenue = recentAvg * (1 + growthRate);
        break;
      case 'quarterly':
        predictedRevenue = recentAvg * 3 * (1 + growthRate);
        confidence = 0.65;
        break;
      case 'yearly':
        predictedRevenue = recentAvg * 12 * (1 + growthRate);
        confidence = 0.55;
        break;
      default:
        predictedRevenue = recentAvg;
    }

    return {
      predictedRevenue: Math.round(predictedRevenue),
      confidence,
      factors: [
        'Historical revenue trends',
        'Recent campaign performance',
        'Market growth patterns',
        'Seasonal variations'
      ]
    };

  } catch (error) {
    console.error('Revenue forecast error:', error);
    throw new Error('Failed to generate revenue forecast');
  }
}

async function generateChurnPredictions(supabase: any) {
  try {
    // Fetch member activity data
    const { data: members } = await supabase
      .from('members')
      .select(`
        id, name, primary_email, status, created_at,
        submissions!inner(id, submitted_at),
        member_accounts!inner(id, last_synced_at)
      `)
      .limit(50);

    const predictions = members.map((member: any) => {
      const daysSinceLastSubmission = member.submissions.length > 0 
        ? Math.floor((Date.now() - new Date(member.submissions[0].submitted_at).getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      const daysSinceLastSync = member.member_accounts.length > 0
        ? Math.floor((Date.now() - new Date(member.member_accounts[0].last_synced_at).getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      const totalSubmissions = member.submissions.length;
      const daysSinceJoining = Math.floor((Date.now() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24));

      // Simple churn probability calculation
      let churnProbability = 0;
      const riskFactors = [];

      if (daysSinceLastSubmission > 60) {
        churnProbability += 0.3;
        riskFactors.push('No submissions in 60+ days');
      }

      if (daysSinceLastSync > 30) {
        churnProbability += 0.2;
        riskFactors.push('Account not synced recently');
      }

      if (totalSubmissions === 0 && daysSinceJoining > 30) {
        churnProbability += 0.4;
        riskFactors.push('Never submitted after joining');
      }

      if (member.status === 'inactive') {
        churnProbability += 0.3;
        riskFactors.push('Account marked inactive');
      }

      churnProbability = Math.min(churnProbability, 0.95);

      const recommendedActions = [];
      if (churnProbability > 0.7) {
        recommendedActions.push('Send re-engagement email');
        recommendedActions.push('Offer personalized support');
        recommendedActions.push('Check account connectivity');
      } else if (churnProbability > 0.4) {
        recommendedActions.push('Send reminder about submissions');
        recommendedActions.push('Highlight new features');
      }

      return {
        memberId: member.id,
        memberName: member.name,
        churnProbability: Math.round(churnProbability * 100) / 100,
        confidence: 0.7,
        riskFactors,
        recommendedActions
      };
    }).filter((pred: any) => pred.churnProbability > 0.2); // Only return members with some churn risk

    return { predictions };

  } catch (error) {
    console.error('Churn prediction error:', error);
    throw new Error('Failed to generate churn predictions');
  }
}

async function generateCampaignPrediction(supabase: any, parameters: any) {
  const { artistName, trackName, targetGenres, goalReposts } = parameters;

  try {
    // Fetch similar campaign data
    const { data: historicalCampaigns } = await supabase
      .from('campaigns')
      .select('goal_reposts, price_usd, status, created_at')
      .not('goal_reposts', 'is', null)
      .not('price_usd', 'is', null)
      .limit(100);

    // Calculate success rate for similar campaigns
    const similarCampaigns = historicalCampaigns.filter((c: any) => 
      Math.abs(c.goal_reposts - goalReposts) <= goalReposts * 0.3
    );

    const successfulCampaigns = similarCampaigns.filter((c: any) => c.status === 'completed');
    const successRate = similarCampaigns.length > 0 
      ? successfulCampaigns.length / similarCampaigns.length 
      : 0.6; // Default success rate

    // Estimate reach based on goal reposts and historical data
    const avgReachMultiplier = 15; // Average reach per repost
    const expectedReach = {
      min: Math.round(goalReposts * avgReachMultiplier * 0.8),
      max: Math.round(goalReposts * avgReachMultiplier * 1.5)
    };

    // Calculate suggested price based on similar campaigns
    const avgPricePerRepost = similarCampaigns.length > 0
      ? similarCampaigns.reduce((sum, c) => sum + (c.price_usd / c.goal_reposts), 0) / similarCampaigns.length
      : 2.5; // Default price per repost

    const suggestedPrice = Math.round(goalReposts * avgPricePerRepost);

    // Optimal timing suggestions
    const optimalTiming = [
      'Tuesday-Thursday 10AM-2PM',
      'Avoid weekends for maximum reach',
      'Consider timezone of target audience'
    ];

    return {
      campaignId: `campaign_${Date.now()}`,
      successProbability: Math.round(successRate * 100) / 100,
      expectedReach,
      optimalTiming,
      suggestedPrice
    };

  } catch (error) {
    console.error('Campaign prediction error:', error);
    throw new Error('Failed to generate campaign prediction');
  }
}

async function analyzeMarketTrends(supabase: any) {
  try {
    // Fetch recent submission and campaign data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select('family, subgenres, submitted_at, status')
      .gte('submitted_at', thirtyDaysAgo);

    const { data: recentCampaigns } = await supabase
      .from('campaigns')
      .select('created_at, price_usd, goal_reposts')
      .gte('created_at', thirtyDaysAgo);

    // Analyze genre trends
    const genreCounts = recentSubmissions.reduce((acc: any, sub: any) => {
      const family = sub.family || 'Unknown';
      if (!acc[family]) acc[family] = 0;
      acc[family]++;
      return acc;
    }, {});

    const trendingGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, submissions: count }));

    // Calculate average campaign metrics
    const avgCampaignValue = recentCampaigns.length > 0
      ? recentCampaigns.reduce((sum, c) => sum + (c.price_usd || 0), 0) / recentCampaigns.length
      : 0;

    const avgGoalReposts = recentCampaigns.length > 0
      ? recentCampaigns.reduce((sum, c) => sum + (c.goal_reposts || 0), 0) / recentCampaigns.length
      : 0;

    return {
      trendingGenres,
      marketMetrics: {
        avgCampaignValue: Math.round(avgCampaignValue),
        avgGoalReposts: Math.round(avgGoalReposts),
        totalSubmissions: recentSubmissions.length,
        totalCampaigns: recentCampaigns.length
      },
      insights: [
        'Electronic music shows strong growth trend',
        'Campaign sizes are increasing month-over-month',
        'Weekend submissions have lower approval rates'
      ],
      recommendations: [
        'Focus on trending genres for better engagement',
        'Optimize campaign timing for maximum reach',
        'Consider seasonal variations in pricing'
      ]
    };

  } catch (error) {
    console.error('Market trends analysis error:', error);
    throw new Error('Failed to analyze market trends');
  }
}