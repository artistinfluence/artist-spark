import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Users, RefreshCw } from 'lucide-react';
import { useQueueAssignments } from '@/hooks/useQueueAssignments';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RepostingArtistsListProps {
  submissionId: string;
  submission?: {
    status: string;
    support_date: string | null;
  };
}

export const RepostingArtistsList: React.FC<RepostingArtistsListProps> = ({ submissionId, submission }) => {
  const { toast } = useToast();
  const { assignments, loading, refetch } = useQueueAssignments(submissionId);
  const [generating, setGenerating] = useState(false);

  const generateQueue = async () => {
    if (!submission?.support_date) {
      console.log('No support_date found:', submission);
      return;
    }
    
    console.log('Calling generate-queue with date:', submission.support_date);
    console.log('Submission ID:', submissionId);
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-queue', {
        body: { date: submission.support_date }
      });

      console.log('Generate-queue response:', { data, error });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: data.message || "Queue generated successfully",
      });

      // Wait a bit for the assignments to be created
      setTimeout(async () => {
        await refetch();
      }, 1000);
    } catch (error: any) {
      console.error('Error generating queue:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate queue assignments",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-500/80';
      case 'assigned':
        return 'bg-blue-500 hover:bg-blue-500/80';
      case 'pending':
        return 'bg-yellow-500 hover:bg-yellow-500/80';
      default:
        return 'bg-gray-500 hover:bg-gray-500/80';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h4 className="text-md font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Reposting Artists
        </h4>
        <div className="space-y-2">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    const canGenerateQueue = submission?.status === 'approved' && submission?.support_date;
    
    return (
      <div className="space-y-4">
        <h4 className="text-md font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Reposting Artists
        </h4>
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No artists assigned to repost this track yet.</p>
          {canGenerateQueue && (
            <Button 
              className="mt-4" 
              onClick={generateQueue}
              disabled={generating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Assigning Artists...' : 'Assign Artists'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold flex items-center gap-2">
        <Users className="w-4 h-4" />
        Reposting Artists ({assignments.length})
      </h4>
      
      <ScrollArea className="h-80 w-full border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Artist Name</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Proof</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="text-sm font-medium">#{assignment.position}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {assignment.members?.name || 'Unknown Artist'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {assignment.members?.soundcloud_followers?.toLocaleString() || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(assignment.status)} text-white text-xs`}>
                    {assignment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{assignment.credits_allocated}</div>
                </TableCell>
                <TableCell>
                  {assignment.proof_url ? (
                    <a
                      href={assignment.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-xs">View</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">No proof</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};