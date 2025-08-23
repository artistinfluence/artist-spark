import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Music, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  name: string;
  primary_email: string;
  emails: string[];
  status: string;
  size_tier: string;
  followers: number;
  soundcloud_followers: number;
  soundcloud_url: string;
  spotify_url: string;
  spotify_genres: string[];
  families: string[];
  subgenres: string[];
  monthly_repost_limit: number;
  submissions_this_month: number;
  net_credits: number;
  created_at: string;
}

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    soundcloud_url: '',
    spotify_url: '',
    soundcloud_followers: 0,
    monthly_repost_limit: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [displayMember, setDisplayMember] = useState<Member | null>(null);

  useEffect(() => {
    if (member) {
      setFormData({
        soundcloud_url: member.soundcloud_url || '',
        spotify_url: member.spotify_url || '',
        soundcloud_followers: member.soundcloud_followers || 0,
        monthly_repost_limit: member.monthly_repost_limit || 1
      });
      setDisplayMember(member);
    }
  }, [member]);

  const validateUrl = (url: string, platform: string) => {
    if (!url) return true;
    const patterns = {
      soundcloud: /^https?:\/\/(www\.)?soundcloud\.com\/.+/,
      spotify: /^https?:\/\/(open\.)?spotify\.com\/artist\/.+/
    };
    return patterns[platform as keyof typeof patterns]?.test(url) || false;
  };

  const handleSave = async () => {
    if (!member) return;

    if (formData.soundcloud_url && !validateUrl(formData.soundcloud_url, 'soundcloud')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid SoundCloud URL",
        variant: "destructive"
      });
      return;
    }

    if (formData.spotify_url && !validateUrl(formData.spotify_url, 'spotify')) {
      toast({
        title: "Invalid URL", 
        description: "Please enter a valid Spotify artist URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          soundcloud_url: formData.soundcloud_url || null,
          spotify_url: formData.spotify_url || null,
          soundcloud_followers: formData.soundcloud_followers,
          monthly_repost_limit: formData.monthly_repost_limit
        })
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member profile updated successfully"
      });

      setIsEditing(false);
      
      // Auto-classify if Spotify URL was added or changed
      const hadSpotifyUrl = member.spotify_url;
      const hasNewSpotifyUrl = formData.spotify_url && formData.spotify_url !== hadSpotifyUrl;
      
      if (hasNewSpotifyUrl) {
        setIsClassifying(true);
        toast({
          title: "Auto-Classifying",
          description: "Analyzing Spotify profile for genre classification...",
        });
        
        try {
          const { data, error: classifyError } = await supabase.functions.invoke('classify-track', {
            body: {
              trackUrl: formData.spotify_url,
              memberId: member.id
            }
          });

          if (classifyError) throw classifyError;

          if (data?.success) {
            toast({
              title: "Classification Complete",
              description: `Classified as ${data.classification.family} with ${data.classification.subgenres.length} subgenres`,
            });
            if (data.updatedMember) {
              setDisplayMember(data.updatedMember);
            }
          } else {
            throw new Error(data?.error || 'Classification failed');
          }
        } catch (classifyError: any) {
          console.error('Error classifying artist:', classifyError);
          toast({
            title: "Classification Error", 
            description: classifyError.message || "Failed to classify artist genres",
            variant: "destructive"
          });
        } finally {
          setIsClassifying(false);
        }
      }
      
      onUpdate();
      
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update member profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoClassify = async () => {
    if (!member?.spotify_url) {
      toast({
        title: "No Spotify URL",
        description: "Please add a Spotify artist URL first",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting classification for:', member.spotify_url);
    setIsClassifying(true);
    
    try {
      console.log('Calling classify-track function...');
      const { data, error } = await supabase.functions.invoke('classify-track', {
        body: {
          trackUrl: member.spotify_url,
          memberId: member.id
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data?.success) {
        console.log('Classification successful:', data);
        toast({
          title: "Classification Complete",
          description: `Classified as ${data.classification.family} with ${data.classification.subgenres.length} subgenres`,
        });
        if (data.updatedMember) {
          setDisplayMember(data.updatedMember);
        }
        // Refresh the modal data
        onUpdate();
      } else {
        console.error('Classification failed:', data);
        throw new Error(data?.error || 'Classification failed');
      }
    } catch (error: any) {
      console.error('Error classifying artist:', error);
      toast({
        title: "Classification Error", 
        description: error.message || "Failed to classify artist genres",
        variant: "destructive"
      });
    } finally {
      setIsClassifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'active' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      T1: 'bg-blue-100 text-blue-800',
      T2: 'bg-green-100 text-green-800', 
      T3: 'bg-yellow-100 text-yellow-800',
      T4: 'bg-purple-100 text-purple-800'
    };
    return (
      <Badge className={colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {tier}
      </Badge>
    );
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {member.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">{getStatusBadge(member.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Size Tier</Label>
                <div className="mt-1">{getTierBadge(member.size_tier)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Primary Email</Label>
                <p className="text-sm text-muted-foreground mt-1">{member.primary_email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Platform Links */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Platform & Limits</h3>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="soundcloud_url" className="text-sm font-medium">SoundCloud URL</Label>
                {isEditing ? (
                  <Input
                    id="soundcloud_url"
                    value={formData.soundcloud_url}
                    onChange={(e) => setFormData({...formData, soundcloud_url: e.target.value})}
                    placeholder="https://soundcloud.com/artist-name"
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    {member.soundcloud_url ? (
                      <a 
                        href={member.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        {member.soundcloud_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not set</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="spotify_url" className="text-sm font-medium">Spotify URL</Label>
                {isEditing ? (
                  <Input
                    id="spotify_url"
                    value={formData.spotify_url}
                    onChange={(e) => setFormData({...formData, spotify_url: e.target.value})}
                    placeholder="https://open.spotify.com/artist/..."
                    className="mt-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    {member.spotify_url ? (
                      <a 
                        href={member.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        {member.spotify_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not set</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="soundcloud_followers" className="text-sm font-medium">SoundCloud Followers</Label>
                {isEditing ? (
                  <Input
                    id="soundcloud_followers"
                    type="number"
                    value={formData.soundcloud_followers}
                    onChange={(e) => setFormData({...formData, soundcloud_followers: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {member.soundcloud_followers?.toLocaleString() || 0}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="monthly_repost_limit" className="text-sm font-medium">Monthly Repost Limit</Label>
                {isEditing ? (
                  <Input
                    id="monthly_repost_limit"
                    type="number"
                    value={formData.monthly_repost_limit}
                    onChange={(e) => setFormData({...formData, monthly_repost_limit: parseInt(e.target.value) || 1})}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {member.monthly_repost_limit} reposts per month
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Genres */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Genres</h3>
              {isClassifying && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Classifying from Spotify...
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Genre Families</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {((displayMember?.families ?? member.families)?.length) ? (
                    (displayMember?.families ?? member.families)!.map((family, index) => (
                      <Badge key={index} variant="secondary">{family}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None set</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Subgenres</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {((displayMember?.subgenres ?? member.subgenres)?.length) ? (
                    (displayMember?.subgenres ?? member.subgenres)!.map((subgenre, index) => (
                      <Badge key={index} variant="outline">{subgenre}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None set</p>
                  )}
                </div>
              </div>

              {(displayMember?.spotify_genres ?? member.spotify_genres)?.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Spotify Genres</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(displayMember?.spotify_genres ?? member.spotify_genres)!.map((genre, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Music className="h-3 w-3 mr-1" />
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Activity Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Activity & Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Total Followers</Label>
                <p className="text-sm text-muted-foreground mt-1">{member.followers?.toLocaleString() || 0}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Submissions This Month</Label>
                <p className="text-sm text-muted-foreground mt-1">{member.submissions_this_month}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Net Reposts</Label>
                <p className="text-sm text-muted-foreground mt-1">{member.net_credits}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};