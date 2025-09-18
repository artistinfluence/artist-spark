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
    const { analysisType, userId, ipAddress, lookbackDays = 30 } = await req.json();
    
    console.log(`Security Analyzer: ${analysisType} for ${userId || ipAddress || 'all'}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (analysisType) {
      case 'login_patterns':
        result = await analyzeLoginPatterns(supabase, userId, lookbackDays);
        break;
      case 'suspicious_activities':
        result = await detectSuspiciousActivities(supabase, lookbackDays);
        break;
      case 'ip_reputation':
        result = await checkIpReputation(supabase, ipAddress, lookbackDays);
        break;
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Security Analyzer error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeLoginPatterns(supabase: any, userId: string, lookbackDays: number) {
  try {
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch user's login events
    const { data: loginEvents } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .in('action', ['login_attempt', 'login_success', 'login_failed'])
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    if (!loginEvents || loginEvents.length === 0) {
      return {
        userId,
        riskLevel: 'low',
        score: 1,
        riskFactors: [],
        recommendations: ['Continue monitoring login patterns']
      };
    }

    const riskFactors = [];
    let riskScore = 0;

    // Analyze login times
    const loginHours = loginEvents.map(event => new Date(event.created_at).getHours());
    const uniqueHours = new Set(loginHours);
    
    if (uniqueHours.size > 18) { // Logging in at unusual hours
      riskScore += 2;
      riskFactors.push('Logins at unusual hours');
    }

    // Analyze IP addresses
    const ipAddresses = new Set(loginEvents.map(event => event.ip_address).filter(Boolean));
    if (ipAddresses.size > 5) { // Multiple IP addresses
      riskScore += 3;
      riskFactors.push('Multiple IP addresses used');
    }

    // Analyze failed login attempts
    const failedLogins = loginEvents.filter(event => event.action === 'login_failed');
    const failedLoginRate = failedLogins.length / loginEvents.length;
    
    if (failedLoginRate > 0.3) { // High failure rate
      riskScore += 4;
      riskFactors.push('High failed login rate');
    }

    // Analyze user agent changes
    const userAgents = new Set(loginEvents.map(event => event.user_agent).filter(Boolean));
    if (userAgents.size > 3) { // Multiple devices/browsers
      riskScore += 1;
      riskFactors.push('Multiple devices/browsers');
    }

    // Analyze rapid login attempts
    const rapidAttempts = loginEvents.filter((event, index) => {
      if (index === 0) return false;
      const timeDiff = new Date(loginEvents[index - 1].created_at).getTime() - new Date(event.created_at).getTime();
      return timeDiff < 60000; // Less than 1 minute between attempts
    });

    if (rapidAttempts.length > 3) {
      riskScore += 3;
      riskFactors.push('Rapid successive login attempts');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 8) riskLevel = 'critical';
    else if (riskScore >= 6) riskLevel = 'high';
    else if (riskScore >= 3) riskLevel = 'medium';
    else riskLevel = 'low';

    // Generate recommendations
    const recommendations = [];
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Enforce multi-factor authentication');
      recommendations.push('Review and possibly suspend account');
      recommendations.push('Monitor all account activities');
    } else if (riskLevel === 'medium') {
      recommendations.push('Enable additional security monitoring');
      recommendations.push('Consider MFA recommendation');
    } else {
      recommendations.push('Continue standard monitoring');
    }

    return {
      userId,
      riskLevel,
      score: riskScore,
      riskFactors,
      recommendations,
      loginStats: {
        totalLogins: loginEvents.length,
        failedLogins: failedLogins.length,
        uniqueIPs: ipAddresses.size,
        uniqueUserAgents: userAgents.size
      }
    };

  } catch (error) {
    console.error('Login pattern analysis error:', error);
    throw new Error('Failed to analyze login patterns');
  }
}

async function detectSuspiciousActivities(supabase: any, lookbackDays: number) {
  try {
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch recent audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false });

    const threats = [];

    // Detect brute force attacks
    const loginAttempts = auditLogs.filter(log => log.action === 'login_failed');
    const ipLoginCounts = loginAttempts.reduce((acc: any, log: any) => {
      const ip = log.ip_address || 'unknown';
      if (!acc[ip]) acc[ip] = 0;
      acc[ip]++;
      return acc;
    }, {});

    Object.entries(ipLoginCounts).forEach(([ip, count]) => {
      if ((count as number) > 10) {
        threats.push({
          threatType: 'brute_force_attack',
          severity: (count as number) > 50 ? 'critical' : 'high',
          description: `${count} failed login attempts from IP ${ip}`,
          affectedUsers: loginAttempts
            .filter((log: any) => log.ip_address === ip)
            .map((log: any) => log.user_id)
            .filter((id: any) => id),
          recommendations: [
            'Block or rate limit IP address',
            'Force password reset for affected accounts',
            'Enable additional monitoring'
          ],
          detectedAt: new Date().toISOString()
        });
      }
    });

    // Detect unusual activity patterns
    const highRiskEvents = auditLogs.filter(log => log.risk_score >= 7);
    if (highRiskEvents.length > 20) {
      threats.push({
        threatType: 'unusual_activity_spike',
        severity: 'medium',
        description: `${highRiskEvents.length} high-risk events detected in ${lookbackDays} days`,
        affectedUsers: [...new Set(highRiskEvents.map(log => log.user_id).filter(Boolean))],
        recommendations: [
          'Review high-risk events',
          'Investigate user account activities',
          'Consider temporary security measures'
        ],
        detectedAt: new Date().toISOString()
      });
    }

    // Detect potential account takeovers
    const userActivities = auditLogs.reduce((acc: any, log: any) => {
      if (!log.user_id) return acc;
      if (!acc[log.user_id]) acc[log.user_id] = [];
      acc[log.user_id].push(log);
      return acc;
    }, {});

    Object.entries(userActivities).forEach(([userId, activities]: [string, any[]]) => {
      const ipAddresses = new Set(activities.map(a => a.ip_address).filter(Boolean));
      const userAgents = new Set(activities.map(a => a.user_agent).filter(Boolean));
      
      if (ipAddresses.size > 5 && activities.length > 10) {
        threats.push({
          threatType: 'potential_account_takeover',
          severity: 'high',
          description: `User ${userId} accessed from ${ipAddresses.size} different IPs with ${activities.length} activities`,
          affectedUsers: [userId],
          recommendations: [
            'Force account verification',
            'Review recent account changes',
            'Enable MFA if not already active'
          ],
          detectedAt: new Date().toISOString()
        });
      }
    });

    // Detect data access anomalies
    const dataAccessEvents = auditLogs.filter(log => 
      ['data_export', 'bulk_download', 'sensitive_data_access'].includes(log.action)
    );

    if (dataAccessEvents.length > 5) {
      const uniqueUsers = new Set(dataAccessEvents.map(log => log.user_id).filter(Boolean));
      threats.push({
        threatType: 'unusual_data_access',
        severity: 'medium',
        description: `${dataAccessEvents.length} data access events by ${uniqueUsers.size} users`,
        affectedUsers: Array.from(uniqueUsers),
        recommendations: [
          'Review data access permissions',
          'Audit exported data',
          'Monitor ongoing data access patterns'
        ],
        detectedAt: new Date().toISOString()
      });
    }

    return { threats };

  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    throw new Error('Failed to detect suspicious activities');
  }
}

async function checkIpReputation(supabase: any, ipAddress: string, lookbackDays: number) {
  try {
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch activities from this IP
    const { data: ipActivities } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('created_at', startDate);

    const riskFactors = [];
    let riskScore = 0;

    if (!ipActivities || ipActivities.length === 0) {
      return {
        ipAddress,
        riskLevel: 'unknown' as const,
        score: 0,
        riskFactors: ['No historical data available'],
        recommendations: ['Monitor IP for future activities']
      };
    }

    // Analyze failure rates
    const failedActions = ipActivities.filter(activity => 
      activity.action.includes('failed') || activity.risk_score >= 7
    );
    const failureRate = failedActions.length / ipActivities.length;

    if (failureRate > 0.5) {
      riskScore += 4;
      riskFactors.push('High failure rate');
    }

    // Check for multiple user attempts
    const uniqueUsers = new Set(ipActivities.map(activity => activity.user_id).filter(Boolean));
    if (uniqueUsers.size > 5) {
      riskScore += 3;
      riskFactors.push('Multiple user accounts accessed');
    }

    // Check for rapid requests
    const rapidRequests = ipActivities.filter((activity, index) => {
      if (index === 0) return false;
      const timeDiff = new Date(ipActivities[index - 1].created_at).getTime() - new Date(activity.created_at).getTime();
      return Math.abs(timeDiff) < 5000; // Less than 5 seconds between requests
    });

    if (rapidRequests.length > 10) {
      riskScore += 3;
      riskFactors.push('Rapid successive requests');
    }

    // Check for high-risk actions
    const highRiskActions = ipActivities.filter(activity => activity.risk_score >= 8);
    if (highRiskActions.length > 0) {
      riskScore += 2;
      riskFactors.push('High-risk actions performed');
    }

    // Simple geolocation risk (placeholder - would use real geolocation service)
    if (ipAddress.startsWith('10.') || ipAddress.startsWith('192.168.') || ipAddress.startsWith('172.')) {
      riskScore -= 1; // Private IPs are generally safer
      riskFactors.push('Private IP address');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 8) riskLevel = 'critical';
    else if (riskScore >= 6) riskLevel = 'high';
    else if (riskScore >= 3) riskLevel = 'medium';
    else riskLevel = 'low';

    // Generate recommendations
    const recommendations = [];
    if (riskLevel === 'critical') {
      recommendations.push('Block IP address immediately');
      recommendations.push('Review all activities from this IP');
      recommendations.push('Alert security team');
    } else if (riskLevel === 'high') {
      recommendations.push('Rate limit IP address');
      recommendations.push('Enable additional monitoring');
      recommendations.push('Consider temporary blocks');
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor IP activities closely');
      recommendations.push('Apply cautious rate limiting');
    } else {
      recommendations.push('Continue standard monitoring');
    }

    return {
      ipAddress,
      riskLevel,
      score: riskScore,
      riskFactors,
      recommendations,
      activityStats: {
        totalActivities: ipActivities.length,
        failedActivities: failedActions.length,
        uniqueUsers: uniqueUsers.size,
        highRiskActions: highRiskActions.length
      }
    };

  } catch (error) {
    console.error('IP reputation check error:', error);
    throw new Error('Failed to check IP reputation');
  }
}