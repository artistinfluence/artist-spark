import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SubmitTrack = () => {
  const { member } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    track_url: '',
    artist_name: '',
    notes: '',
  });

  const canSubmit = member && member.submissions_this_month < member.monthly_submission_limit;
  const remainingSubmissions = member ? member.monthly_submission_limit - member.submissions_this_month : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !canSubmit) return;

    setLoading(true);
    try {
      // Validate SoundCloud URL
      if (!formData.track_url.includes('soundcloud.com')) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid SoundCloud URL",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('submissions')
        .insert([
          {
            member_id: member.id,
            track_url: formData.track_url,
            artist_name: formData.artist_name || member.name,
            notes: formData.notes || null,
            status: 'new',
            family: null, // Will be determined by admin
            subgenres: [], // Will be determined by admin
          }
        ]);

      if (error) throw error;

      toast({
        title: "Track Submitted!",
        description: "Your track has been submitted successfully and is now in the queue for review.",
      });

      // Reset form
      setFormData({
        track_url: '',
        artist_name: '',
        notes: '',
      });

    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred while submitting your track",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!member) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading member data...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Submit New Track</h1>
        <p className="text-muted-foreground">Upload your SoundCloud track for promotion consideration</p>
      </div>

      {/* Submission Status */}
      <Alert className={canSubmit ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}>
        {canSubmit ? (
          <CheckCircle className="h-4 w-4 text-primary" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <AlertDescription>
          {canSubmit ? (
            <>You have <strong>{remainingSubmissions}</strong> submission{remainingSubmissions !== 1 ? 's' : ''} remaining this month</>
          ) : (
            <>You have reached your monthly submission limit of <strong>{member.monthly_submission_limit}</strong> tracks</>
          )}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Track Submission Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="track_url">SoundCloud URL *</Label>
              <Input
                id="track_url"
                type="url"
                placeholder="https://soundcloud.com/artist/track"
                value={formData.track_url}
                onChange={(e) => handleInputChange('track_url', e.target.value)}
                required
                disabled={!canSubmit || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="artist_name">Artist Name</Label>
              <Input
                id="artist_name"
                type="text"
                placeholder={member.name}
                value={formData.artist_name}
                onChange={(e) => handleInputChange('artist_name', e.target.value)}
                disabled={!canSubmit || loading}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use your registered name: {member.name}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about your track..."
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={!canSubmit || loading}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!canSubmit || loading || !formData.track_url}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Track
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Submission Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>Only SoundCloud URLs are accepted</li>
            <li>Track must be publicly accessible</li>
            <li>You can submit up to {member.monthly_submission_limit} tracks per month</li>
            <li>Submissions are reviewed within 24-48 hours</li>
            <li>You'll be notified via email of the decision</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};