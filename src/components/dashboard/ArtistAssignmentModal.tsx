import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Users,
  Target,
  CheckCircle,
  Plus,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFollowerCount, getFollowerTier } from '@/utils/creditCalculations';
import { estimateReach } from '@/components/ui/soundcloud-reach-estimator';

interface Member {
  id: string;
  name: string;
  stage_name: string;
  soundcloud_followers: number;
  size_tier: string;
  net_credits: number;
  families: string[];
  groups: string[];
  reach_factor: number;
  status: string;
  repost_credit_wallet: {
    balance: number;
    monthly_grant: number;
  };
}

interface ArtistAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedArtists: string[]) => void;
  submission: {
    id: string;
    artist_name: string;
    family: string;
    subgenres: string[];
    expected_reach_planned: number;
    members: {
      size_tier: string;
      soundcloud_followers: number;
    };
  } | null;
}

export const ArtistAssignmentModal: React.FC<ArtistAssignmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  submission,
}) => {
  const { toast } = useToast();
  const [suggestedArtists, setSuggestedArtists] = useState<Member[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalReach, setTotalReach] = useState(0);

  // Calculate total expected reach based on selected artists using new reach estimator
  useEffect(() => {
    const reach = selectedArtists.reduce((total, artistId) => {
      const artist = [...suggestedArtists, ...searchResults].find(a => a.id === artistId);
      if (artist) {
        const estimate = estimateReach(artist.soundcloud_followers);
        return total + (estimate?.reach_median || 0);
      }
      return total;
    }, 0);
    setTotalReach(Math.round(reach));
  }, [selectedArtists, suggestedArtists, searchResults]);

  // Fetch suggested artists based on submission criteria
  const fetchSuggestedArtists = async () => {
    if (!submission) return;

    setLoading(true);
    try {
      console.log('Fetching artists for submission:', {
        family: submission.family,
        subgenres: submission.subgenres,
        memberFollowers: submission.members?.soundcloud_followers
      });

      let query = supabase
        .from('members')
        .select(`
          *,
          repost_credit_wallet!inner(balance, monthly_grant)
        `)
        .eq('status', 'active')
        .gt('repost_credit_wallet.balance', 0)
        .gt('soundcloud_followers', 1000);

      // Apply genre filters if available using proper Supabase array methods
      if (submission.family) {
        console.log('Adding family filter:', submission.family);
        query = query.overlaps('families', [submission.family]);
      }
      if (submission.subgenres?.length > 0) {
        console.log('Adding subgenres filter:', submission.subgenres);
        // Filter for any matching subgenres
        query = query.overlaps('groups', submission.subgenres);
      }

      const { data, error } = await query;

      if (error) throw error;

      let members = data as Member[];
      
      console.log('Query results:', { count: members.length, hasGenreFilters: !!submission.family || !!submission.subgenres?.length });
      
      // If no genre matches found, fall back to all active members
      if (members.length === 0) {
        console.log('No genre matches found, falling back to all active members...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('members')
          .select(`
            *,
            repost_credit_wallet!inner(balance, monthly_grant)
          `)
          .eq('status', 'active')
          .gt('repost_credit_wallet.balance', 0)
          .gt('soundcloud_followers', 1000)
          .limit(50);
        
        if (fallbackError) throw fallbackError;
        members = fallbackData as Member[];
        console.log('Fallback results:', { count: members.length });
      }

      // Sort by follower count (smallest first) for strategic selection
      const sortedMembers = members.sort((a, b) => a.soundcloud_followers - b.soundcloud_followers);

      // Calculate target reach using power-law algorithm from member's follower count
      const memberFollowers = submission.members?.soundcloud_followers || 25000;
      const memberReachEstimate = estimateReach(memberFollowers);
      const targetReach = memberReachEstimate?.reach_median || 50000;
      
      console.log('Target reach calculation:', {
        memberFollowers,
        memberReachEstimate,
        targetReach,
        dbExpectedReach: submission.expected_reach_planned
      });
      const compatible = sortedMembers.filter(member => {
        const estimate = estimateReach(member.soundcloud_followers);
        const estimatedReach = estimate?.reach_median || 0;
        // Include artists whose individual reach is reasonable for the target
        return estimatedReach >= 1000 && estimatedReach <= targetReach;
      });

      setSuggestedArtists(compatible.slice(0, 15));
      
      // Smart auto-selection: start with smaller artists and build up
      const autoSelected = [];
      let currentReach = 0;
      
      // First pass: select smaller artists (up to 30k followers)
      for (const artist of compatible.filter(a => a.soundcloud_followers <= 30000)) {
        if (currentReach < targetReach * 0.7) { // Fill 70% with smaller artists
          autoSelected.push(artist.id);
          const estimate = estimateReach(artist.soundcloud_followers);
          currentReach += estimate?.reach_median || 0;
        }
      }
      
      // Second pass: add larger artists if needed
      for (const artist of compatible.filter(a => a.soundcloud_followers > 30000)) {
        if (currentReach < targetReach && currentReach < targetReach * 1.15) { // Don't over-deliver by more than 15%
          autoSelected.push(artist.id);
          const estimate = estimateReach(artist.soundcloud_followers);
          currentReach += estimate?.reach_median || 0;
        }
        if (autoSelected.length >= 8 || currentReach >= targetReach * 1.15) break;
      }
      
      setSelectedArtists(autoSelected);

    } catch (error: any) {
      console.error('Error fetching suggested artists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch suggested artists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Search for additional artists
  const searchArtists = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          repost_credit_wallet!inner(balance, monthly_grant)
        `)
        .eq('status', 'active')
        .gt('repost_credit_wallet.balance', 0)
        .or(`name.ilike.%${term}%,stage_name.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data as Member[]);
    } catch (error: any) {
      console.error('Error searching artists:', error);
    }
  };

  useEffect(() => {
    if (isOpen && submission) {
      fetchSuggestedArtists();
    }
  }, [isOpen, submission]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchArtists(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleArtistToggle = (artistId: string) => {
    setSelectedArtists(prev => 
      prev.includes(artistId) 
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
  };

  const handleConfirm = () => {
    if (selectedArtists.length === 0) {
      toast({
        title: "No Artists Selected",
        description: "Please select at least one artist",
        variant: "destructive",
      });
      return;
    }

    onConfirm(selectedArtists);
    onClose();
  };

  const renderArtistCard = (artist: Member, isSelected: boolean) => (
    <Card key={artist.id} className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handleArtistToggle(artist.id)}
            />
            <div>
              <h4 className="font-medium">{artist.stage_name || artist.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatFollowerCount(artist.soundcloud_followers)} followers</span>
                <Badge variant="outline">{getFollowerTier(artist.soundcloud_followers)}</Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {(() => {
                const estimate = estimateReach(artist.soundcloud_followers);
                return estimate ? estimate.reach_median.toLocaleString() : '0';
              })()} reach
            </div>
            <div className="text-xs text-muted-foreground">
              {artist.repost_credit_wallet?.balance || 0} credits
            </div>
          </div>
        </div>
        {artist.families?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {artist.families.slice(0, 3).map(family => (
              <Badge key={family} variant="secondary" className="text-xs">
                {family}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!submission) return null;

  // Calculate target reach using power-law algorithm from member's follower count
  const memberFollowers = submission.members?.soundcloud_followers || 25000;
  const memberReachEstimate = estimateReach(memberFollowers);
  const targetReach = memberReachEstimate?.reach_median || 50000;
  const reachPercentage = (totalReach / targetReach) * 100;
  const isReachGood = reachPercentage >= 80 && reachPercentage <= 120;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Artists - {submission.artist_name}
          </DialogTitle>
          <DialogDescription>
            Select artists to support this {submission.family} track. Target reach: {targetReach.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reach Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Reach Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Target Reach</div>
                  <div className="text-2xl font-bold">{targetReach.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Total</div>
                  <div className={`text-2xl font-bold ${isReachGood ? 'text-green-600' : 'text-orange-600'}`}>
                    {totalReach.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                  <div className={`text-2xl font-bold ${isReachGood ? 'text-green-600' : 'text-orange-600'}`}>
                    {reachPercentage.toFixed(0)}%
                  </div>
                </div>
              </div>
              {!isReachGood && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-orange-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    {reachPercentage < 80 ? 'Consider adding more artists to reach target' : 'Consider removing artists to avoid over-delivery'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Artists */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Suggested Artists ({suggestedArtists.length})</h3>
            {loading ? (
              <div className="text-center py-8">Loading suggestions...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedArtists.map(artist => 
                  renderArtistCard(artist, selectedArtists.includes(artist.id))
                )}
              </div>
            )}
          </div>

          {/* Search Additional Artists */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Add More Artists</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or stage name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults
                  .filter(artist => !suggestedArtists.find(s => s.id === artist.id))
                  .map(artist => 
                    renderArtistCard(artist, selectedArtists.includes(artist.id))
                  )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedArtists.length} artists selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={selectedArtists.length === 0}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve with Selected Artists
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};