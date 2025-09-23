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
  const [addedFromSearch, setAddedFromSearch] = useState<Set<string>>(new Set());

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

      // Apply subgenre filter only for precise matching
      if (submission.subgenres?.length > 0) {
        console.log('Adding subgenres filter:', submission.subgenres);
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

      // Sort by follower count (largest first) for display
      const sortedMembers = members.sort((a, b) => b.soundcloud_followers - a.soundcloud_followers);

      // Calculate realistic target reach using member's follower count with power-law model
      const memberFollowers = submission.members?.soundcloud_followers || 25000;
      const memberReachEstimate = estimateReach(memberFollowers);
      const calculatedTarget = memberReachEstimate?.reach_median || 50000;
      
      // Use calculated target, but fallback to scaled database value if too small
      const dbTarget = submission.expected_reach_planned || 50000;
      const targetReach = Math.max(calculatedTarget, dbTarget * 10); // Scale up small DB values
      
      console.log('Target reach calculation:', {
        memberFollowers,
        calculatedTarget: calculatedTarget,
        dbTarget: dbTarget,
        finalTarget: targetReach,
        dbExpectedReach: submission.expected_reach_planned
      });

      // Filter artists with minimum reach (no maximum to allow flexibility)
      const compatible = sortedMembers.filter(member => {
        const estimate = estimateReach(member.soundcloud_followers);
        const estimatedReach = estimate?.reach_median || 0;
        return estimatedReach >= 1000; // Only minimum threshold
      });

      setSuggestedArtists(compatible.slice(0, 20));
      
      // Improved auto-selection: select artists to meet target reach
      const autoSelected = [];
      let currentReach = 0;
      const targetMin = targetReach * 0.85; // Allow slightly under target
      
      console.log('Auto-selection targets:', { target: targetReach, targetMin, totalArtists: compatible.length });
      
      // Select artists until we reach target - be more aggressive
      for (const artist of compatible) {
        const estimate = estimateReach(artist.soundcloud_followers);
        const artistReach = estimate?.reach_median || 0;
        
        console.log(`Evaluating artist ${artist.stage_name}: ${artistReach} reach, current total: ${currentReach}`);
        
        // Always add if we're under target, or if it's the first artist
        if (currentReach < targetMin || autoSelected.length === 0) {
          autoSelected.push(artist.id);
          currentReach += artistReach;
          console.log(`Selected artist ${artist.stage_name}, new total: ${currentReach}`);
        }
        
        // Stop if we've reached reasonable target or selected too many
        if (currentReach >= targetMin && autoSelected.length >= 2) {
          break;
        }
        if (autoSelected.length >= 8) {
          break;
        }
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
        .or(`name.ilike.${term}%,stage_name.ilike.${term}%`)
        .order('name')
        .limit(20);

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
    setSelectedArtists(prev => {
      if (prev.includes(artistId)) {
        // Deselecting - remove from selected and from suggested if it was added from search
        if (addedFromSearch.has(artistId)) {
          setSuggestedArtists(current => current.filter(artist => artist.id !== artistId));
          setAddedFromSearch(current => {
            const newSet = new Set(current);
            newSet.delete(artistId);
            return newSet;
          });
        }
        return prev.filter(id => id !== artistId);
      } else {
        // Selecting
        return [...prev, artistId];
      }
    });
  };

  const handleSearchArtistSelect = (artist: Member) => {
    // Add to selected artists
    setSelectedArtists(prev => [...prev, artist.id]);
    
    // Add to suggested artists if not already there
    setSuggestedArtists(current => {
      if (current.find(a => a.id === artist.id)) {
        return current;
      }
      const updated = [...current, artist];
      // Sort by follower count (highest first)
      return updated.sort((a, b) => b.soundcloud_followers - a.soundcloud_followers);
    });
    
    // Track that this was added from search
    setAddedFromSearch(current => new Set(current).add(artist.id));
    
    // Clear search
    setSearchTerm('');
    setSearchResults([]);
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

  const renderArtistItem = (artist: Member, isSelected: boolean) => (
    <div 
      key={artist.id} 
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-primary/5 border-primary' : 'border-border'
      }`}
      onClick={() => handleArtistToggle(artist.id)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => handleArtistToggle(artist.id)}
      />
      <div className="flex-1">
        <span className="font-medium">{artist.stage_name || artist.name}</span>
        <span className="text-muted-foreground ml-2">
          ({formatFollowerCount(artist.soundcloud_followers)})
        </span>
      </div>
    </div>
  );

  if (!submission) return null;

  // Calculate realistic target reach using member's follower count with power-law model
  const memberFollowers = submission.members?.soundcloud_followers || 25000;
  const memberReachEstimate = estimateReach(memberFollowers);
  const calculatedTarget = memberReachEstimate?.reach_median || 50000;
  
  // Use calculated target, but fallback to scaled database value if too small
  const dbTarget = submission.expected_reach_planned || 50000;
  const targetReach = Math.max(calculatedTarget, dbTarget * 10); // Scale up small DB values
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
              {searchTerm && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {searchResults
                    .filter(artist => !suggestedArtists.find(s => s.id === artist.id))
                    .map(artist => (
                      <div
                        key={artist.id}
                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0"
                        onClick={() => handleSearchArtistSelect(artist)}
                      >
                        <span className="font-medium">{artist.stage_name || artist.name}</span>
                        <span className="text-muted-foreground">
                          ({formatFollowerCount(artist.soundcloud_followers)})
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {searchTerm && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10 p-3 text-sm text-muted-foreground">
                  No artists found starting with "{searchTerm}"
                </div>
              )}
            </div>
          </div>

          {/* Suggested Artists */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Suggested Artists ({suggestedArtists.length})</h3>
            {loading ? (
              <div className="text-center py-8">Loading suggestions...</div>
            ) : (
              <div className="space-y-2">
                {suggestedArtists
                  .sort((a, b) => b.soundcloud_followers - a.soundcloud_followers)
                  .map(artist => 
                    renderArtistItem(artist, selectedArtists.includes(artist.id))
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