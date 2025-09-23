import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Users } from 'lucide-react';
import { useQueueAssignments } from '@/hooks/useQueueAssignments';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface RepostingArtistsListProps {
  submissionId: string;
}

export const RepostingArtistsList: React.FC<RepostingArtistsListProps> = ({ submissionId }) => {
  const { assignments, loading } = useQueueAssignments(submissionId);

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
    return (
      <div className="space-y-4">
        <h4 className="text-md font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          Reposting Artists
        </h4>
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No artists assigned to repost this track yet.</p>
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
                    {assignment.supporter?.name || 'Unknown Artist'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {assignment.supporter?.soundcloud_followers?.toLocaleString() || 'N/A'}
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