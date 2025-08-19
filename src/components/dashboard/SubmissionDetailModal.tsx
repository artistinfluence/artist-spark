import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ExternalLink,
  Calendar,
  User,
  Music,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Tag,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';

type SubmissionStatus = 'new' | 'pending' | 'approved' | 'rejected' | 'qa_flag';

interface Submission {
  id: string;
  track_url: string;
  artist_name: string;
  status: string;
  submitted_at: string;
  notes: string;
  qa_reason: string;
  family: string;
  subgenres: string[];
  member_id: string;
  support_url: string;
  need_live_link: boolean;
  expected_reach_planned: number;
  expected_reach_max: number;
  expected_reach_min: number;
  members: {
    id: string;
    name: string;
    primary_email: string;
    size_tier: string;
    status: string;
  };
}

interface SubmissionDetailModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [qaReason, setQaReason] = useState('');
  const [status, setStatus] = useState<SubmissionStatus>('new');
  const [family, setFamily] = useState('');
  const [saving, setSaving] = useState(false);
  const [classifying, setClassifying] = useState(false);

  React.useEffect(() => {
    if (submission) {
      setNotes(submission.notes || '');
      setQaReason(submission.qa_reason || '');
      setStatus(submission.status as SubmissionStatus);
      setFamily(submission.family || 'none');
    }
  }, [submission]);

  const statusConfig = {
    new: { label: 'New', color: 'bg-primary', icon: FileText },
    pending: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
    approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
    qa_flag: { label: 'QA Flag', color: 'bg-orange-500', icon: AlertTriangle },
  };

  const handleAutoClassify = async () => {
    if (!submission?.track_url) {
      toast({
        title: "Error",
        description: "No track URL found for classification",
        variant: "destructive",
      });
      return;
    }

    setClassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('classify-track', {
        body: { 
          trackUrl: submission.track_url,
          submissionId: submission.id 
        }
      });

      if (error) throw error;

      if (data.success) {
        setFamily(data.classification.family);
        toast({
          title: "Auto-Classification Complete",
          description: `Classified as ${data.classification.family} - ${data.classification.subgenres.join(', ')}`,
        });
        
        // Refresh the submission data
        onUpdate();
      } else {
        toast({
          title: "Classification Failed",
          description: data.error || "Could not classify track automatically",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Auto-classification error:', error);
      toast({
        title: "Error",
        description: "Failed to auto-classify track. Please try manual classification.",
        variant: "destructive",
      });
    } finally {
      setClassifying(false);
    }
  };

  const handleSave = async () => {
    if (!submission) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status,
          notes,
          qa_reason: qaReason,
          family: family === 'none' ? null : family,
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: "Updated Successfully",
        description: "Submission details have been saved",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const config = statusConfig[statusValue as keyof typeof statusConfig] || {
      label: statusValue,
      color: 'bg-gray-500',
      icon: FileText
    };
    
    return (
      <Badge className={`${config.color} text-white hover:${config.color}/80`}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Submission Details
          </DialogTitle>
          <DialogDescription>
            View and manage submission for {submission.artist_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Artist Name</Label>
              <p className="text-lg font-semibold mt-1">{submission.artist_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                {getStatusBadge(submission.status)}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Submitted</Label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(submission.submitted_at), 'MMM d, yyyy HH:mm')}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Track URL</Label>
              <div className="mt-1">
                <a
                  href={submission.track_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Track
                </a>
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Member Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground mt-1">{submission.members?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground mt-1">{submission.members?.primary_email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Size Tier</Label>
                <p className="text-sm text-muted-foreground mt-1">{submission.members?.size_tier}</p>
              </div>
            </div>
          </div>

          {/* Submission Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Classification & Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Genre Family</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={family} onValueChange={setFamily}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select genre family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="Electronic">Electronic</SelectItem>
                      <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                      <SelectItem value="Rock">Rock</SelectItem>
                      <SelectItem value="Pop">Pop</SelectItem>
                      <SelectItem value="Alternative">Alternative</SelectItem>
                      <SelectItem value="R&B">R&B</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAutoClassify()}
                    disabled={classifying}
                  >
                    {classifying ? 'Classifying...' : 'Auto-Classify'}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Subgenres</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {submission.subgenres?.length > 0 
                    ? submission.subgenres.join(', ')
                    : 'Not set'
                  }
                </p>
              </div>
            </div>

            {/* Expected Reach */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Expected Reach (Min)</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {submission.expected_reach_min?.toLocaleString() || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Expected Reach (Planned)</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {submission.expected_reach_planned?.toLocaleString() || 'Not set'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Expected Reach (Max)</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {submission.expected_reach_max?.toLocaleString() || 'Not set'}
                </p>
              </div>
            </div>

            {/* Support URL */}
            {submission.support_url && (
              <div>
                <Label className="text-sm font-medium">Support URL</Label>
                <div className="mt-1">
                  <a
                    href={submission.support_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Support Link
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Management Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Management</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={status} onValueChange={(value) => setStatus(value as SubmissionStatus)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="qa_flag">QA Flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this submission..."
                className="mt-1"
                rows={3}
              />
            </div>

            {(status === 'qa_flag' || submission.status === 'qa_flag') && (
              <div>
                <Label htmlFor="qa-reason" className="text-sm font-medium">
                  QA Reason
                </Label>
                <Textarea
                  id="qa-reason"
                  value={qaReason}
                  onChange={(e) => setQaReason(e.target.value)}
                  placeholder="Explain why this submission was flagged for QA..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};