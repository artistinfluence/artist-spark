import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { GenreTagFilter } from './GenreTagFilter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Users, 
  Music, 
  TrendingUp, 
  Calendar,
  Grid,
  List,
  Settings,
  ExternalLink
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  primary_email: string;
  status: string;
  size_tier: string;
  soundcloud_url?: string;
  soundcloud_followers?: number;
  influence_planner_status?: string;
  created_at: string;
}

interface GenreFamily {
  id: string;
  name: string;
  color?: string;
}

interface Subgenre {
  id: string;
  name: string;
  family_id: string;
  patterns: string[];
  order_index: number;
  active: boolean;
}

export const ArtistGenreBrowser: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [genreFamilies, setGenreFamilies] = useState<GenreFamily[]>([]);
  const [subgenres, setSubgenres] = useState<Subgenre[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'followers' | 'created' | 'tier'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Calculate tier counts dynamically
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(member => {
      if (member.size_tier) {
        counts[member.size_tier] = (counts[member.size_tier] || 0) + 1;
      }
    });
    return counts;
  }, [members]);

  // Get available tiers sorted
  const availableTiers = useMemo(() => {
    return Object.keys(tierCounts).sort((a, b) => {
      // Custom sort for T1, T2, T3 format
      const aNum = parseInt(a.replace('T', ''));
      const bNum = parseInt(b.replace('T', ''));
      return aNum - bNum;
    });
  }, [tierCounts]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersResponse, familiesResponse, subgenresResponse] = await Promise.all([
        supabase.from('members').select('id, name, primary_email, status, size_tier, soundcloud_url, soundcloud_followers, influence_planner_status, created_at'),
        supabase.from('genre_families').select('*').order('name'),
        supabase.from('subgenres').select('*').order('order_index')
      ]);

      if (membersResponse.error) throw membersResponse.error;
      if (familiesResponse.error) throw familiesResponse.error;
      if (subgenresResponse.error) throw subgenresResponse.error;

      setMembers(membersResponse.data || []);
      setGenreFamilies(familiesResponse.data || []);
      setSubgenres(subgenresResponse.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch artist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter(member => {
      // Search filter
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.primary_email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      // Tier filter
      const matchesTier = tierFilter === 'all' || member.size_tier === tierFilter;

      // Genre filter - temporarily disabled since genre_classification doesn't exist
      const matchesGenre = selectedGenres.length === 0; // Always match for now

      return matchesSearch && matchesStatus && matchesTier && matchesGenre;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'followers':
          comparison = (a.soundcloud_followers || 0) - (b.soundcloud_followers || 0);
          break;
        case 'tier':
          // Sort tiers T1, T2, T3
          const aTier = parseInt(a.size_tier?.replace('T', '') || '0');
          const bTier = parseInt(b.size_tier?.replace('T', '') || '0');
          comparison = aTier - bTier;
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [members, searchTerm, selectedGenres, statusFilter, tierFilter, sortBy, sortOrder]);

  const handleMemberSelect = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (selectedMembers.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleBulkGenreAssignment = () => {
    if (selectedMembers.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select artists to assign genres to",
        variant: "destructive",
      });
      return;
    }

    // This would open a bulk assignment modal
    toast({
      title: "Bulk Assignment",
      description: `Bulk genre assignment for ${selectedMembers.size} artists coming soon!`,
    });
  };

  const getIPStatusBadge = (status?: string) => {
    if (!status) return { variant: 'outline' as const, text: 'Unknown', className: '' };
    
    switch (status) {
      case 'connected':
        return { variant: 'default' as const, text: 'Connected', className: 'bg-green-500 hover:bg-green-600' };
      case 'invited':
        return { variant: 'secondary' as const, text: 'Invited', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' };
      case 'hasnt_logged_in':
        return { variant: 'secondary' as const, text: 'Not Logged In', className: '' };
      case 'disconnected':
        return { variant: 'destructive' as const, text: 'Disconnected', className: '' };
      case 'uninterested':
        return { variant: 'outline' as const, text: 'Uninterested', className: '' };
      default:
        return { variant: 'outline' as const, text: status, className: '' };
    }
  };

  const getGenreDisplay = (member: Member) => {
    // Genre display temporarily disabled since genre_classification doesn't exist
    return null;
  };

  const ArtistCard: React.FC<{ member: Member }> = ({ member }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
        selectedMembers.has(member.id) ? 'ring-2 ring-primary' : ''
      }`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedMembers.has(member.id)}
                onCheckedChange={() => handleMemberSelect(member.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <CardTitle className="text-sm">{member.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{member.primary_email}</p>
              </div>
            </div>
            {member.soundcloud_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(member.soundcloud_url, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              {(() => {
                const ipStatus = getIPStatusBadge(member.influence_planner_status);
                return (
                  <Badge variant={ipStatus.variant} className={ipStatus.className}>
                    {ipStatus.text}
                  </Badge>
                );
              })()}
              <Badge variant="outline">{member.size_tier}</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {member.soundcloud_followers?.toLocaleString() || '0'}
              </div>
            </div>

            {getGenreDisplay(member)}

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(member.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading artists...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Artist Browser Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tier</label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {availableTiers.map(tier => (
                    <SelectItem key={tier} value={tier}>
                      {tier} ({tierCounts[tier]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="followers">Followers</SelectItem>
                    <SelectItem value="tier">Tier</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <TrendingUp className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          <GenreTagFilter
            genreFamilies={genreFamilies}
            subgenres={subgenres as any}
            selectedGenres={selectedGenres}
            onGenreChange={setSelectedGenres}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedMembers.length} artists
            {selectedMembers.size > 0 && ` (${selectedMembers.size} selected)`}
          </span>
          {selectedMembers.size > 0 && (
            <Button size="sm" onClick={handleBulkGenreAssignment}>
              <Settings className="h-4 w-4 mr-1" />
              Bulk Assign Genres
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Artists Grid/List */}
      <AnimatePresence>
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-2'
        }`}>
          {filteredAndSortedMembers.map(member => (
            <ArtistCard key={member.id} member={member} />
          ))}
        </div>
      </AnimatePresence>

      {filteredAndSortedMembers.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No artists found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};