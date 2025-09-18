import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Mail, Calendar, Crown, Music, Edit, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  families: string[];
  subgenres: string[];
  monthly_repost_limit: number;
  submissions_this_month: number;
  net_credits: number;
  created_at: string;
  manual_genres: string[];
  genre_family_id?: string;
  genre_notes?: string;
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
    soundcloud_followers: 0,
    monthly_repost_limit: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [displayMember, setDisplayMember] = useState<Member | null>(null);

  useEffect(() => {
    if (member) {
      setFormData({
        soundcloud_url: member.soundcloud_url || '',
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
    };
    return patterns[platform as keyof typeof patterns]?.test(url) || false;
  };

  const handleSave = async () => {
    if (!member) return;

    if (!validateUrl(formData.soundcloud_url, 'soundcloud')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid SoundCloud URL",
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
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update member",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (member) {
      setFormData({
        soundcloud_url: member.soundcloud_url || '',
        soundcloud_followers: member.soundcloud_followers || 0,
        monthly_repost_limit: member.monthly_repost_limit || 1
      });
    }
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', color: 'bg-green-500' },
      needs_reconnect: { label: 'Needs Reconnect', color: 'bg-orange-500' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-500'
    };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      T1: { label: 'Tier 1', color: 'bg-gray-500', followers: '0-1K' },
      T2: { label: 'Tier 2', color: 'bg-blue-500', followers: '1K-10K' },
      T3: { label: 'Tier 3', color: 'bg-purple-500', followers: '10K-100K' },
      T4: { label: 'Tier 4', color: 'bg-yellow-500', followers: '100K+' },
    };
    
    const config = tierConfig[tier as keyof typeof tierConfig] || {
      label: tier,
      color: 'bg-gray-500',
      followers: 'Unknown'
    };
    
    return (
      <Badge className={`${config.color} text-white`}>
        <Crown className="w-3 h-3 mr-1" />
        {config.label} ({config.followers})
      </Badge>
    );
  };

  if (!member) return null;

  const currentMember = displayMember || member;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {currentMember.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isLoading} size="sm">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Tier */}
          <div className="flex items-center gap-4">
            {getStatusBadge(currentMember.status)}
            {getTierBadge(currentMember.size_tier)}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Primary Email</Label>
                <p className="text-sm text-muted-foreground">{currentMember.primary_email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">All Emails</Label>
                <div className="flex flex-wrap gap-1">
                  {currentMember.emails?.map((email, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Platform Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Platform Information</h3>
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
                    {currentMember.soundcloud_url ? (
                      <a 
                        href={currentMember.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        {currentMember.soundcloud_url}
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
                    min="0"
                    value={formData.soundcloud_followers}
                    onChange={(e) => setFormData({...formData, soundcloud_followers: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentMember.soundcloud_followers?.toLocaleString() || 0} followers
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Member Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Member Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_repost_limit" className="text-sm font-medium">Monthly Repost Limit</Label>
                {isEditing ? (
                  <Input
                    id="monthly_repost_limit"
                    type="number"
                    min="1"
                    value={formData.monthly_repost_limit}
                    onChange={(e) => setFormData({...formData, monthly_repost_limit: parseInt(e.target.value) || 1})}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentMember.monthly_repost_limit} per month
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Submissions This Month</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentMember.submissions_this_month || 0}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Genre Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Genre Classification
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Families</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {((displayMember?.families ?? currentMember.families)?.length) ? (
                    (displayMember?.families ?? currentMember.families)!.map((family, index) => (
                      <Badge key={index} variant="secondary">
                        {family}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No families assigned</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Subgenres</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {((displayMember?.subgenres ?? currentMember.subgenres)?.length) ? (
                    (displayMember?.subgenres ?? currentMember.subgenres)!.map((subgenre, index) => (
                      <Badge key={index} variant="outline">
                        {subgenre}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No subgenres assigned</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Manual Genres</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {currentMember.manual_genres?.length ? (
                    currentMember.manual_genres.map((genre, index) => (
                      <Badge key={index} variant="secondary">
                        {genre}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No manual genres assigned</p>
                  )}
                </div>
              </div>

              {currentMember.genre_notes && (
                <div>
                  <Label className="text-sm font-medium">Genre Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentMember.genre_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Net Credits</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentMember.net_credits || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Followers</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentMember.followers?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(currentMember.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};