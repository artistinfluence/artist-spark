import { supabase } from '@/integrations/supabase/client';

export const generateQueueAssignments = async (date: string) => {
  try {
    console.log('Calling generate-queue for date:', date);
    
    const { data, error } = await supabase.functions.invoke('generate-queue', {
      body: { date }
    });

    if (error) {
      console.error('Error calling generate-queue function:', error);
      throw error;
    }

    if (data?.error) {
      console.error('Error from generate-queue function:', data.error);
      throw new Error(data.error);
    }

    console.log('Successfully generated queue for date:', date, data);
    return data;
  } catch (error) {
    console.error('Failed to generate queue assignments:', error);
    throw error;
  }
};

// Call this immediately to generate assignments for 2025-09-25
generateQueueAssignments('2025-09-25')
  .then(result => {
    console.log('Queue generation completed:', result);
  })
  .catch(error => {
    console.error('Queue generation failed:', error);
  });