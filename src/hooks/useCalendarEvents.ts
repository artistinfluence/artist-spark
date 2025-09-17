import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import type { CalendarEventData } from '@/types/calendar';

export const useCalendarEvents = (viewDate: Date) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const monthStart = startOfMonth(viewDate);
      const monthEnd = endOfMonth(viewDate);

      // Fetch campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .gte('start_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('start_date', format(monthEnd, 'yyyy-MM-dd'));

      if (campaignsError) throw campaignsError;

      // Fetch submissions with support dates
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          members!inner(name)
        `)
        .not('support_date', 'is', null)
        .gte('support_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('support_date', format(monthEnd, 'yyyy-MM-dd'));

      if (submissionsError) throw submissionsError;

      // Transform campaigns to calendar events
      const campaignEvents: CalendarEventData[] = (campaigns || []).map(campaign => ({
        id: campaign.id,
        type: 'campaign' as const,
        title: `${campaign.artist_name} - ${campaign.track_name}`,
        artistName: campaign.artist_name,
        trackName: campaign.track_name,
        trackUrl: campaign.track_url,
        date: campaign.start_date!,
        status: campaign.status as any,
        budget: campaign.price_usd ? Number(campaign.price_usd) : undefined,
        reachTarget: campaign.goal_reposts,
        notes: campaign.notes || undefined,
      }));

      // Transform submissions to calendar events
      const submissionEvents: CalendarEventData[] = (submissions || []).map(submission => ({
        id: submission.id,
        type: 'submission' as const,
        title: submission.artist_name || 'Unknown Artist',
        artistName: submission.artist_name || 'Unknown Artist',
        trackName: submission.track_name || undefined,
        trackUrl: submission.track_url,
        date: submission.support_date!,
        status: submission.status as any,
        creditsAllocated: submission.credits_consumed || 0,
        submittedAt: submission.submitted_at,
        notes: submission.notes || undefined,
        reachTarget: submission.expected_reach_planned || undefined,
      }));

      setEvents([...campaignEvents, ...submissionEvents]);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [viewDate]);

  return { events, isLoading, error, refetch: fetchEvents };
};