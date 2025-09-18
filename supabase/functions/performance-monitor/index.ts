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
    const { action, alert } = await req.json();
    
    console.log(`Performance Monitor: ${action}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (action) {
      case 'health_check':
        result = await runHealthCheck(supabase);
        break;
      case 'process_alert':
        result = await processAlert(supabase, alert);
        break;
      case 'system_metrics':
        result = await collectSystemMetrics(supabase);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Performance Monitor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runHealthCheck(supabase: any) {
  try {
    const healthScores = [];

    // Database health check
    const dbStartTime = Date.now();
    try {
      await supabase.from('members').select('count').limit(1);
      const dbResponseTime = Date.now() - dbStartTime;
      
      let dbScore = 100;
      if (dbResponseTime > 1000) dbScore -= 30;
      else if (dbResponseTime > 500) dbScore -= 15;
      else if (dbResponseTime > 200) dbScore -= 5;

      healthScores.push({
        name: 'database',
        score: Math.max(dbScore, 0),
        metrics: { responseTime: dbResponseTime, status: 'connected' }
      });
    } catch (error) {
      healthScores.push({
        name: 'database',
        score: 0,
        metrics: { error: error.message, status: 'disconnected' }
      });
    }

    // API health check
    const apiStartTime = Date.now();
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_ANON_KEY')!
        }
      });
      
      const apiResponseTime = Date.now() - apiStartTime;
      let apiScore = 100;
      
      if (!response.ok) apiScore -= 50;
      if (apiResponseTime > 2000) apiScore -= 30;
      else if (apiResponseTime > 1000) apiScore -= 15;
      else if (apiResponseTime > 500) apiScore -= 5;

      healthScores.push({
        name: 'api',
        score: Math.max(apiScore, 0),
        metrics: { responseTime: apiResponseTime, status: response.status }
      });
    } catch (error) {
      healthScores.push({
        name: 'api',
        score: 0,
        metrics: { error: error.message, status: 'unavailable' }
      });
    }

    // Authentication health check
    try {
      const authStartTime = Date.now();
      const { data } = await supabase.auth.getUser();
      const authResponseTime = Date.now() - authStartTime;
      
      let authScore = 100;
      if (authResponseTime > 1000) authScore -= 20;
      else if (authResponseTime > 500) authScore -= 10;

      healthScores.push({
        name: 'authentication',
        score: Math.max(authScore, 0),
        metrics: { responseTime: authResponseTime, status: 'operational' }
      });
    } catch (error) {
      healthScores.push({
        name: 'authentication',
        score: 30, // Partial score for service availability
        metrics: { error: error.message, status: 'degraded' }
      });
    }

    // Queue system health check
    try {
      const { data: queueData } = await supabase
        .from('queue_assignments')
        .select('status')
        .limit(10);

      const queueScore = queueData ? 100 : 50;
      
      healthScores.push({
        name: 'queue_system',
        score: queueScore,
        metrics: { 
          activeAssignments: queueData?.length || 0, 
          status: queueData ? 'operational' : 'degraded' 
        }
      });
    } catch (error) {
      healthScores.push({
        name: 'queue_system',
        score: 0,
        metrics: { error: error.message, status: 'down' }
      });
    }

    // Email system health check (check recent automation logs)
    try {
      const recentTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: emailLogs } = await supabase
        .from('automation_logs')
        .select('status')
        .gte('sent_at', recentTime)
        .limit(50);

      let emailScore = 100;
      if (emailLogs) {
        const failedEmails = emailLogs.filter(log => log.status === 'failed').length;
        const failureRate = failedEmails / emailLogs.length;
        
        if (failureRate > 0.2) emailScore -= 40;
        else if (failureRate > 0.1) emailScore -= 20;
        else if (failureRate > 0.05) emailScore -= 10;
      }

      healthScores.push({
        name: 'email_system',
        score: Math.max(emailScore, 0),
        metrics: { 
          recentEmails: emailLogs?.length || 0,
          status: emailScore > 70 ? 'operational' : 'degraded'
        }
      });
    } catch (error) {
      healthScores.push({
        name: 'email_system',
        score: 0,
        metrics: { error: error.message, status: 'down' }
      });
    }

    // Update health scores in database
    for (const component of healthScores) {
      await supabase
        .from('system_health_scores')
        .upsert({
          component_name: component.name,
          health_score: component.score,
          status: component.score >= 90 ? 'healthy' : 
                  component.score >= 70 ? 'degraded' : 
                  component.score >= 40 ? 'warning' : 'critical',
          metrics: component.metrics,
          last_check_at: new Date().toISOString()
        }, {
          onConflict: 'component_name'
        });
    }

    // Calculate overall system health
    const avgScore = healthScores.reduce((sum, comp) => sum + comp.score, 0) / healthScores.length;
    const overallStatus = avgScore >= 90 ? 'healthy' : avgScore >= 70 ? 'degraded' : 'down';

    return {
      overall: {
        status: overallStatus,
        score: Math.round(avgScore),
        checkedAt: new Date().toISOString()
      },
      components: healthScores
    };

  } catch (error) {
    console.error('Health check error:', error);
    throw new Error('Failed to perform health check');
  }
}

async function processAlert(supabase: any, alert: any) {
  try {
    console.log('Processing alert:', alert);

    // Record the alert in performance metrics
    await supabase
      .from('performance_metrics')
      .insert({
        metric_name: `alert_${alert.alertType}`,
        metric_value: alert.currentValue,
        service_name: alert.componentName,
        metric_unit: 'count',
        dimensions: {
          alertType: alert.alertType,
          severity: alert.severity,
          threshold: alert.threshold
        },
        alert_threshold: alert.threshold,
        status: 'alert'
      });

    // Update automation health if this is a critical alert
    if (alert.severity === 'critical') {
      await supabase.rpc('update_automation_health', {
        _automation_name: `${alert.componentName}_monitoring`,
        _success: false,
        _error_message: alert.message
      });
    }

    // For critical alerts, you might also want to:
    // - Send notifications to administrators
    // - Trigger automated remediation scripts
    // - Update system status pages

    return {
      alertProcessed: true,
      alertId: alert.id || `alert_${Date.now()}`,
      actions: [
        'Recorded alert in metrics',
        alert.severity === 'critical' ? 'Updated automation health' : 'Standard alert processing',
        'Alert ready for review'
      ]
    };

  } catch (error) {
    console.error('Alert processing error:', error);
    throw new Error('Failed to process alert');
  }
}

async function collectSystemMetrics(supabase: any) {
  try {
    const metrics = [];

    // Database metrics
    try {
      const startTime = Date.now();
      const { data: memberCount } = await supabase
        .from('members')
        .select('id', { count: 'exact' });
      
      const dbQueryTime = Date.now() - startTime;
      
      metrics.push({
        metric_name: 'database_query_time',
        metric_value: dbQueryTime,
        service_name: 'database',
        metric_unit: 'milliseconds',
        timestamp: new Date().toISOString()
      });

      metrics.push({
        metric_name: 'total_members',
        metric_value: memberCount?.length || 0,
        service_name: 'application',
        metric_unit: 'count',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database metrics error:', error);
    }

    // Queue metrics
    try {
      const { data: queueStats } = await supabase
        .from('queue_assignments')
        .select('status', { count: 'exact' });

      const pendingCount = queueStats?.filter(q => q.status === 'assigned').length || 0;
      const completedCount = queueStats?.filter(q => q.status === 'completed').length || 0;

      metrics.push({
        metric_name: 'queue_pending_assignments',
        metric_value: pendingCount,
        service_name: 'queue_system',
        metric_unit: 'count',
        timestamp: new Date().toISOString()
      });

      metrics.push({
        metric_name: 'queue_completed_assignments',
        metric_value: completedCount,
        service_name: 'queue_system',
        metric_unit: 'count',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Queue metrics error:', error);
    }

    // Email metrics
    try {
      const recentTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour
      const { data: emailStats } = await supabase
        .from('automation_logs')
        .select('status')
        .gte('sent_at', recentTime);

      const sentCount = emailStats?.length || 0;
      const failedCount = emailStats?.filter(e => e.status === 'failed').length || 0;

      metrics.push({
        metric_name: 'emails_sent_hourly',
        metric_value: sentCount,
        service_name: 'email_system',
        metric_unit: 'count',
        timestamp: new Date().toISOString()
      });

      metrics.push({
        metric_name: 'email_failure_rate',
        metric_value: sentCount > 0 ? (failedCount / sentCount) * 100 : 0,
        service_name: 'email_system',
        metric_unit: 'percentage',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email metrics error:', error);
    }

    // Store all metrics
    if (metrics.length > 0) {
      await supabase.from('performance_metrics').insert(metrics);
    }

    return {
      metricsCollected: metrics.length,
      metrics: metrics.map(m => ({
        name: m.metric_name,
        value: m.metric_value,
        service: m.service_name,
        unit: m.metric_unit
      })),
      collectedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('System metrics collection error:', error);
    throw new Error('Failed to collect system metrics');
  }
}