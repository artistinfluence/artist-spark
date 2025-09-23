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

// Fast-first artist selection with progressive optimization
const optimizeArtistSelection = (artists: Member[], targetReach: number): { quick: string[], optimized?: string[] } => {
  if (artists.length === 0) return { quick: [] };
  
  // Limit dataset for performance - use top 20 artists
  const limitedArtists = artists
    .sort((a, b) => (b.soundcloud_followers || 0) - (a.soundcloud_followers || 0))
    .slice(0, 20)
    .map(artist => ({
      ...artist,
      estimatedReach: artist.soundcloud_followers || 0
    }));

  console.log('Starting fast artist selection:', {
    totalArtists: artists.length,
    limitedArtists: limitedArtists.length,
    targetReach
  });

  // Quick selection using simple greedy (< 50ms)
  const quickResult = findQuickGreedy(limitedArtists, targetReach);
  
  return { 
    quick: quickResult.selected,
    optimized: quickResult.selected // For now, use same result
  };
};

// Fast greedy algorithm for immediate results
const findQuickGreedy = (artists: (Member & { estimatedReach: number })[], targetReach: number) => {
  // Sort by efficiency (reach per artist)
  const sorted = [...artists].sort((a, b) => b.estimatedReach - a.estimatedReach);
  
  const selected: string[] = [];
  let currentReach = 0;
  
  // Phase 1: Add largest artists until we're close
  for (const artist of sorted) {
    if (selected.length >= 6) break; // Limit for speed
    
    const newReach = currentReach + artist.estimatedReach;
    const currentDistance = Math.abs(targetReach - currentReach);
    const newDistance = Math.abs(targetReach - newReach);
    
    // Add if it gets us closer or if we're still far from target
    if (newDistance < currentDistance || currentReach < targetReach * 0.7) {
      selected.push(artist.id);
      currentReach = newReach;
      
      // Stop if we're close enough (within 20%)
      if (Math.abs(currentReach - targetReach) <= targetReach * 0.2) {
        break;
      }
    }
  }
  
  // Phase 2: Quick fine-tuning with remaining artists
  const remaining = sorted.filter(a => !selected.includes(a.id));
  for (const artist of remaining) {
    if (selected.length >= 8) break;
    
    const newReach = currentReach + artist.estimatedReach;
    if (Math.abs(newReach - targetReach) < Math.abs(currentReach - targetReach)) {
      selected.push(artist.id);
      currentReach = newReach;
    }
  }
  
  return { selected, totalReach: currentReach };
};

// Removed complex algorithms to improve performance

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
  const [quickLoading, setQuickLoading] = useState(false);
  const [totalReach, setTotalReach] = useState(0);
  const [addedFromSearch, setAddedFromSearch] = useState<Set<string>>(new Set());

  // Calculate total estimated reach of selected artists
  useEffect(() => {
    console.log('Calculating total reach for selected artists:', {
      selectedArtists,
      suggestedArtistsCount: suggestedArtists.length,
      searchResultsCount: searchResults.length
    });
    
    const totalEstimatedReach = selectedArtists.reduce((total, artistId) => {
      const artist = [...suggestedArtists, ...searchResults].find(a => a.id === artistId);
      if (artist) {
        const artistReach = artist.soundcloud_followers || 0;
        console.log('Found artist for reach calculation:', {
          artistId,
          name: artist.stage_name || artist.name,
          followers: artist.soundcloud_followers,
          reach: artistReach
        });
        return total + artistReach;
      } else {
        console.log('Artist not found for reach calculation:', artistId);
      }
      return total;
    }, 0);
    
    console.log('Setting total reach:', totalEstimatedReach);
    setTotalReach(totalEstimatedReach);
  }, [selectedArtists, suggestedArtists, searchResults]);

  // Fast-first fetch with progressive enhancement
  const fetchSuggestedArtists = async () => {
    if (!submission) return;

    setQuickLoading(true);
    setLoading(true);
    
    try {
      console.log('Fetching artists for submission:', {
        family: submission.family,
        subgenres: submission.subgenres,
        memberFollowers: submission.members?.soundcloud_followers
      });

      // Optimized query with proper indexing
      let query = supabase
        .from('members')
        .select(`
          id, name, stage_name, soundcloud_followers, size_tier, 
          net_credits, families, groups, reach_factor, status,
          repost_credit_wallet!inner(balance, monthly_grant)
        `)
        .eq('status', 'active')
        .gt('repost_credit_wallet.balance', 0)
        .gt('soundcloud_followers', 1000)
        .order('soundcloud_followers', { ascending: false })
        .limit(30); // Limit for performance

      // Apply genre filter for precision
      if (submission.subgenres?.length > 0) {
        console.log('Adding subgenres filter:', submission.subgenres);
        query = query.overlaps('groups', submission.subgenres);
      }

      const { data, error } = await query;
      if (error) throw error;

      let members = data as Member[];
      console.log('Query results:', { count: members.length });
      
      // Quick fallback if no genre matches
      if (members.length === 0) {
        console.log('No genre matches, using top artists...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('members')
          .select(`
            id, name, stage_name, soundcloud_followers, size_tier,
            net_credits, families, groups, reach_factor, status,
            repost_credit_wallet!inner(balance, monthly_grant)
          `)
          .eq('status', 'active')
          .gt('repost_credit_wallet.balance', 0)
          .gt('soundcloud_followers', 1000)
          .order('soundcloud_followers', { ascending: false })
          .limit(30);
        
        if (fallbackError) throw fallbackError;
        members = fallbackData as Member[];
      }

      // Calculate target reach
      const submitterFollowers = submission.members?.soundcloud_followers || 0;
      const C = 16830.763237;
      const b = 0.396285;
      const targetReach = Math.round(C * Math.pow(submitterFollowers, b));
      
      console.log('Target reach:', targetReach, 'for', submitterFollowers, 'followers');

      // Quick selection (< 100ms)
      setQuickLoading(false);
      const selectionResult = optimizeArtistSelection(members, targetReach);
      
      // Set artists and selection immediately
      setSuggestedArtists(members);
      setSelectedArtists(selectionResult.quick);
      
      console.log('Quick selection complete:', {
        selectedCount: selectionResult.quick.length,
        targetReach,
        selectedIds: selectionResult.quick
      });

    } catch (error: any) {
      console.error('Error fetching artists:', error);
      toast({
        title: "Error",
        description: "Failed to fetch suggested artists",
        variant: "destructive",
      });
    } finally {
      setQuickLoading(false);
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

  // Calculate target reach based on submitter's follower count
  const submitterFollowers = submission.members?.soundcloud_followers || 0;
  const C = 16830.763237;
  const b = 0.396285;
  // Calculate submitter's estimated reach using direct formula
  const targetReach = Math.round(C * Math.pow(submitterFollowers, b));
  const reachPercentage = (totalReach / targetReach) * 100;
  const isReachGood = reachPercentage >= 90 && reachPercentage <= 110;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign Artists - {submission.artist_name}
          </DialogTitle>
          <DialogDescription>
            {quickLoading ? "Finding optimal artists..." : "Select artists to assign to this submission."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reach Summary */}
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Supporter Summary
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Target Reach</div>
                  <div className="text-2xl font-bold">{targetReach.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Estimated Reach</div>
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
                    {reachPercentage < 90 ? 'Consider adding more artists to reach target reach' : 'Consider removing artists to avoid over-delivery'}
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
            <h3 className="text-lg font-semibold mb-4">
              {quickLoading 
                ? "Optimizing selection..." 
                : loading 
                  ? "Loading artists..." 
                  : `Suggested Artists (${suggestedArtists.length})`
              }
            </h3>
            {quickLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                🔄 Finding optimal artist combination...
              </div>
            ) : loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading suggestions...</div>
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