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

// Advanced artist selection algorithm to achieve 95%+ accuracy
const optimizeArtistSelection = (artists: Member[], targetReach: number): string[] => {
  if (artists.length === 0) return [];
  
  // Calculate reach for each artist (using follower count)
  const artistsWithReach = artists.map(artist => ({
    ...artist,
    estimatedReach: artist.soundcloud_followers || 0
  }));

  console.log('Starting advanced artist selection:', {
    totalArtists: artists.length,
    targetReach,
    artistsWithReach: artistsWithReach.slice(0, 5).map(a => ({ 
      name: a.stage_name || a.name, 
      reach: a.estimatedReach 
    }))
  });

  // Try multiple advanced algorithms
  const algorithms = [
    () => findExactMatch(artistsWithReach, targetReach),
    () => findNearPerfectMatch(artistsWithReach, targetReach),
    () => findOptimizedGreedy(artistsWithReach, targetReach),
    () => findSmartMixMatch(artistsWithReach, targetReach)
  ];

  let bestCombination: string[] = [];
  let bestAccuracy = 0;
  let bestDifference = Infinity;

  for (let i = 0; i < algorithms.length; i++) {
    try {
      const result = algorithms[i]();
      const difference = Math.abs(result.totalReach - targetReach);
      const accuracy = result.totalReach > 0 ? (Math.min(result.totalReach, targetReach) / Math.max(result.totalReach, targetReach)) * 100 : 0;
      
      console.log(`Algorithm ${i + 1} result:`, {
        selectedCount: result.selected.length,
        totalReach: result.totalReach,
        difference,
        accuracy: accuracy.toFixed(2) + '%'
      });

      if (accuracy > bestAccuracy || (accuracy === bestAccuracy && difference < bestDifference)) {
        bestCombination = result.selected;
        bestAccuracy = accuracy;
        bestDifference = difference;
      }

      // If we achieve 95%+ accuracy, we can stop
      if (accuracy >= 95) {
        console.log('Achieved 95%+ accuracy, stopping early');
        break;
      }
    } catch (error) {
      console.log(`Algorithm ${i + 1} failed:`, error);
    }
  }

  console.log('Final advanced selection:', {
    artistIds: bestCombination,
    accuracy: bestAccuracy.toFixed(2) + '%',
    difference: bestDifference
  });

  return bestCombination;
};

// Algorithm 1: Find exact match using dynamic programming
const findExactMatch = (artists: (Member & { estimatedReach: number })[], targetReach: number) => {
  const n = Math.min(artists.length, 15); // Limit for performance
  const dp: boolean[][] = Array(n + 1).fill(null).map(() => Array(targetReach + 1).fill(false));
  const parent: number[][] = Array(n + 1).fill(null).map(() => Array(targetReach + 1).fill(-1));
  
  dp[0][0] = true;
  
  for (let i = 1; i <= n; i++) {
    const artistReach = artists[i - 1].estimatedReach;
    for (let j = 0; j <= targetReach; j++) {
      // Don't take this artist
      if (dp[i - 1][j]) {
        dp[i][j] = true;
        parent[i][j] = 0;
      }
      // Take this artist (if it fits)
      if (j >= artistReach && dp[i - 1][j - artistReach]) {
        dp[i][j] = true;
        parent[i][j] = 1;
      }
    }
  }
  
  // Find closest match to target
  let bestReach = 0;
  for (let reach = targetReach; reach >= 0; reach--) {
    if (dp[n][reach]) {
      bestReach = reach;
      break;
    }
  }
  
  // If no match found below target, check above
  if (bestReach === 0) {
    for (let reach = targetReach + 1; reach <= targetReach + Math.floor(targetReach * 0.2); reach++) {
      if (reach <= targetReach && dp[n][reach]) {
        bestReach = reach;
        break;
      }
    }
  }
  
  // Reconstruct solution
  const selected: string[] = [];
  let i = n, j = bestReach;
  while (i > 0 && j > 0) {
    if (parent[i][j] === 1) {
      selected.push(artists[i - 1].id);
      j -= artists[i - 1].estimatedReach;
    }
    i--;
  }
  
  return { selected: selected.reverse(), totalReach: bestReach };
};

// Algorithm 2: Near-perfect match using subset sum with tolerance
const findNearPerfectMatch = (artists: (Member & { estimatedReach: number })[], targetReach: number) => {
  // Sort by reach for better pruning
  const sortedArtists = [...artists].sort((a, b) => b.estimatedReach - a.estimatedReach);
  const tolerance = Math.floor(targetReach * 0.05); // 5% tolerance
  
  let bestCombination: string[] = [];
  let bestReach = 0;
  let bestDiff = Infinity;
  
  // Recursive backtracking with pruning
  const backtrack = (index: number, currentReach: number, currentSelection: string[]) => {
    if (index >= sortedArtists.length || currentSelection.length >= 10) {
      const diff = Math.abs(currentReach - targetReach);
      if (diff < bestDiff) {
        bestCombination = [...currentSelection];
        bestReach = currentReach;
        bestDiff = diff;
      }
      return;
    }
    
    // Pruning: if already within tolerance, record and continue
    const currentDiff = Math.abs(currentReach - targetReach);
    if (currentDiff <= tolerance && currentDiff < bestDiff) {
      bestCombination = [...currentSelection];
      bestReach = currentReach;
      bestDiff = currentDiff;
      return; // Found good enough solution
    }
    
    // Skip this artist
    backtrack(index + 1, currentReach, currentSelection);
    
    // Take this artist (if it makes sense)
    const newReach = currentReach + sortedArtists[index].estimatedReach;
    if (newReach <= targetReach * 1.3) { // Don't go too far over
      backtrack(index + 1, newReach, [...currentSelection, sortedArtists[index].id]);
    }
  };
  
  backtrack(0, 0, []);
  return { selected: bestCombination, totalReach: bestReach };
};

// Algorithm 3: Optimized greedy with advanced replacement
const findOptimizedGreedy = (artists: (Member & { estimatedReach: number })[], targetReach: number) => {
  // Size-based buckets
  const small = artists.filter(a => a.estimatedReach < targetReach * 0.1);
  const medium = artists.filter(a => a.estimatedReach >= targetReach * 0.1 && a.estimatedReach < targetReach * 0.4);
  const large = artists.filter(a => a.estimatedReach >= targetReach * 0.4);
  
  const selected: string[] = [];
  let currentReach = 0;
  
  // Phase 1: Use large artists to get close
  const sortedLarge = large.sort((a, b) => b.estimatedReach - a.estimatedReach);
  for (const artist of sortedLarge) {
    if (currentReach + artist.estimatedReach <= targetReach * 1.1) {
      selected.push(artist.id);
      currentReach += artist.estimatedReach;
      if (currentReach >= targetReach * 0.7) break;
    }
  }
  
  // Phase 2: Fill with medium artists
  const sortedMedium = medium.sort((a, b) => b.estimatedReach - a.estimatedReach);
  for (const artist of sortedMedium) {
    if (selected.length >= 8) break;
    const newReach = currentReach + artist.estimatedReach;
    if (Math.abs(newReach - targetReach) < Math.abs(currentReach - targetReach)) {
      selected.push(artist.id);
      currentReach = newReach;
    }
  }
  
  // Phase 3: Fine-tune with small artists
  const sortedSmall = small.sort((a, b) => a.estimatedReach - b.estimatedReach);
  for (const artist of sortedSmall) {
    if (selected.length >= 10) break;
    const newReach = currentReach + artist.estimatedReach;
    if (Math.abs(newReach - targetReach) < Math.abs(currentReach - targetReach)) {
      selected.push(artist.id);
      currentReach = newReach;
    }
  }
  
  return { selected, totalReach: currentReach };
};

// Algorithm 4: Smart mix matching with gap analysis
const findSmartMixMatch = (artists: (Member & { estimatedReach: number })[], targetReach: number) => {
  const sorted = [...artists].sort((a, b) => b.estimatedReach - a.estimatedReach);
  const selected: string[] = [];
  let currentReach = 0;
  
  while (selected.length < 12 && sorted.length > 0) {
    const remaining = targetReach - currentReach;
    
    if (remaining <= 0) break;
    
    // Find artist that best fills the gap
    let bestArtist = null;
    let bestScore = Infinity;
    
    for (let i = 0; i < sorted.length; i++) {
      const artist = sorted[i];
      if (selected.includes(artist.id)) continue;
      
      const gap = Math.abs(remaining - artist.estimatedReach);
      const efficiency = gap / artist.estimatedReach; // Lower is better
      
      if (efficiency < bestScore || (efficiency === bestScore && artist.estimatedReach > (bestArtist?.estimatedReach || 0))) {
        bestArtist = artist;
        bestScore = efficiency;
      }
    }
    
    if (bestArtist) {
      selected.push(bestArtist.id);
      currentReach += bestArtist.estimatedReach;
      
      // Stop if we're very close
      if (Math.abs(currentReach - targetReach) <= targetReach * 0.02) break;
    } else {
      break;
    }
  }
  
  return { selected, totalReach: currentReach };
};

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

      // Calculate target reach based on submitter's follower count
      const submitterFollowers = submission.members?.soundcloud_followers || 0;
      const C = 16830.763237;
      const b = 0.396285;
      // Calculate submitter's estimated reach using direct formula
      const targetReach = Math.round(C * Math.pow(submitterFollowers, b));
      
      console.log('Target reach calculation:', {
        submitterFollowers: submitterFollowers,
        targetReach: targetReach,
        formula: `${C} × ${submitterFollowers}^${b} = ${targetReach}`
      });

      // Filter artists with minimum followers (1k+) for quality
      const compatible = sortedMembers.filter(member => {
        return member.soundcloud_followers >= 1000; // Only minimum follower threshold
      });

      // Smart auto-selection: find the best combination to match target reach
      const autoSelected = optimizeArtistSelection(compatible, targetReach);
      
      // Ensure all auto-selected artists are in the suggested artists list
      const autoSelectedArtists = autoSelected.map(id => compatible.find(a => a.id === id)).filter(Boolean) as Member[];
      const remainingArtists = compatible.filter(a => !autoSelected.includes(a.id)).slice(0, 20 - autoSelectedArtists.length);
      const allSuggestedArtists = [...autoSelectedArtists, ...remainingArtists];
      
      setSuggestedArtists(allSuggestedArtists);
      
      const estimatedReachForSelected = autoSelected.reduce((total, artistId) => {
        const artist = compatible.find(a => a.id === artistId);
        return total + (artist?.soundcloud_followers || 0);
      }, 0);

      console.log('Auto-selection result:', {
        selectedCount: autoSelected.length,
        targetReach,
        estimatedReach: estimatedReachForSelected,
        selectedIds: autoSelected,
        autoSelectedArtistNames: autoSelectedArtists.map(a => a.stage_name || a.name)
      });
      
      // Clear any previous selections first, then set new ones
      setSelectedArtists([]);
      setTimeout(() => {
        console.log('Setting selected artists:', autoSelected);
        setSelectedArtists(autoSelected);
      }, 50);

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
            Select artists to support this {submission.family} track. Submitter: {submitterFollowers.toLocaleString()} followers → Target reach: {targetReach.toLocaleString()}
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