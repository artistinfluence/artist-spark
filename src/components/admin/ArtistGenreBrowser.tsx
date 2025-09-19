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
  followers_count?: number;
  tracks_count?: number;
  genre_classification?: any;
  created_at: string;
  last_activity?: string;
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
  const [sortBy, setSortBy] = useState<'name' | 'followers' | 'tracks' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersResponse, familiesResponse, subgenresResponse] = await Promise.all([
        supabase.from('members').select('*'),
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

      // Genre filter
      const matchesGenre = selectedGenres.length === 0 || 
        selectedGenres.some(genreId => {
          // Check if member's genre classification matches selected genres
          const classification = member.genre_classification;
          if (!classification) return false;
          
          // Check both families and subgenres
          return classification.primary_genre === genreId ||
                 classification.secondary_genres?.includes(genreId) ||
                 classification.families?.includes(genreId);
        });

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
          comparison = (a.followers_count || 0) - (b.followers_count || 0);
          break;
        case 'tracks':
          comparison = (a.tracks_count || 0) - (b.tracks_count || 0);
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

  const getGenreDisplay = (member: Member) => {
    const classification = member.genre_classification;
    if (!classification) return null;

    const primaryGenre = genreFamilies.find(g => g.id === classification.primary_genre) ||
                        subgenres.find(g => g.id === classification.primary_genre);

    return (
      <div className="flex flex-wrap gap-1">
        {primaryGenre && (
          <Badge variant="default" className="text-xs">
            {primaryGenre.name}
          </Badge>
        )}
        {classification.families?.slice(0, 2).map((genreId: string) => {
          const genre = genreFamilies.find(g => g.id === genreId) ||
                       subgenres.find(g => g.id === genreId);
          return genre ? (
            <Badge key={genreId} variant="secondary" className="text-xs">
              {genre.name}
            </Badge>
          ) : null;
        })}
        {(classification.families?.length > 2) && (
          <Badge variant="outline" className="text-xs">
            +{(classification.families?.length || 0) - 2}
          </Badge>
        )}
      </div>
    );
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
              <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                {member.status}
              </Badge>
              <Badge variant="outline">{member.size_tier}</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {member.followers_count?.toLocaleString() || '0'}
              </div>
              <div className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                {member.tracks_count || '0'}
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
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
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
                    <SelectItem value="tracks">Tracks</SelectItem>
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