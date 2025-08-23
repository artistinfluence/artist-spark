import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Search,
  Filter,
  Mail,
  Activity,
  TrendingUp,
  Crown,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Music,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { MemberDetailModal } from './MemberDetailModal';
import { AddMemberModal } from './AddMemberModal';

type MemberStatus = 'active' | 'needs_reconnect';
type SizeTier = 'T1' | 'T2' | 'T3' | 'T4';

interface Member {
  id: string;
  name: string;
  primary_email: string;
  emails: string[];
  status: MemberStatus;
  size_tier: SizeTier;
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
  last_submission_at: string;
}

interface MemberStats {
  total: number;
  active: number;
  needs_reconnect: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
}

export const MembersPage = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats>({
    total: 0,
    active: 0,
    needs_reconnect: 0,
    t1: 0,
    t2: 0,
    t3: 0,
    t4: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkClassifying, setIsBulkClassifying] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ processed: 0, total: 0 });

  const statusConfig = {
    active: { label: 'Active', color: 'bg-green-500', icon: CheckCircle },
    needs_reconnect: { label: 'Needs Reconnect', color: 'bg-orange-500', icon: AlertCircle },
  };

  const tierConfig = {
    T1: { label: 'Tier 1', color: 'bg-gray-500', followers: '0-1K' },
    T2: { label: 'Tier 2', color: 'bg-blue-500', followers: '1K-10K' },
    T3: { label: 'Tier 3', color: 'bg-purple-500', followers: '10K-100K' },
    T4: { label: 'Tier 4', color: 'bg-yellow-500', followers: '100K+' },
  };

  const fetchMembers = async () => {
    try {
      let query = supabase
        .from('members')
        .select('*')
        .order(sortBy, { ascending: sortDirection === 'asc' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as MemberStatus);
      }

      if (tierFilter !== 'all') {
        query = query.eq('size_tier', tierFilter as SizeTier);
      }

      const { data, error } = await query;

      if (error) throw error;

      const membersData = data || [];
      setMembers(membersData);

      // Calculate stats
      const newStats = {
        total: membersData.length,
        active: membersData.filter(m => m.status === 'active').length,
        needs_reconnect: membersData.filter(m => m.status === 'needs_reconnect').length,
        t1: membersData.filter(m => m.size_tier === 'T1').length,
        t2: membersData.filter(m => m.size_tier === 'T2').length,
        t3: membersData.filter(m => m.size_tier === 'T3').length,
        t4: membersData.filter(m => m.size_tier === 'T4').length,
      };
      setStats(newStats);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter, tierFilter, sortBy, sortDirection]);

  const updateMemberStatus = async (memberId: string, newStatus: MemberStatus) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Member status changed to ${statusConfig[newStatus]?.label || newStatus}`,
      });

      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleBulkClassify = async (scope: 'all' | 'spotify-only' = 'spotify-only') => {
    const membersToClassify = scope === 'all' 
      ? members 
      : members.filter(member => member.spotify_url);

    if (membersToClassify.length === 0) {
      toast({
        title: "No members to classify",
        description: scope === 'all' 
          ? "No members found in the current filter"
          : "No members with Spotify URLs found",
        variant: "destructive"
      });
      return;
    }

    setIsBulkClassifying(true);
    setBulkProgress({ processed: 0, total: membersToClassify.length });

    try {
      const { data, error } = await supabase.functions.invoke('bulk-classify-members', {
        body: {
          memberIds: membersToClassify.map(m => m.id),
          scope
        }
      });

      if (error) throw error;

      toast({
        title: "Bulk Classification Started",
        description: `Processing ${membersToClassify.length} members in the background. This may take a few minutes.`,
      });

      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const { data: progressData } = await supabase.functions.invoke('bulk-classify-status', {
            body: { jobId: data.jobId }
          });

          if (progressData) {
            setBulkProgress({ 
              processed: progressData.processed, 
              total: progressData.total 
            });

            if (progressData.completed) {
              clearInterval(pollInterval);
              setIsBulkClassifying(false);
              toast({
                title: "Bulk Classification Complete",
                description: `Successfully processed ${progressData.processed} members`,
              });
              fetchMembers(); // Refresh the members list
            }
          }
        } catch (error) {
          console.error('Error polling progress:', error);
        }
      }, 2000);

      // Cleanup interval after 10 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsBulkClassifying(false);
      }, 600000);

    } catch (error: any) {
      console.error('Error starting bulk classification:', error);
      toast({
        title: "Bulk Classification Failed",
        description: error.message || "Failed to start bulk classification",
        variant: "destructive"
      });
      setIsBulkClassifying(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.primary_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.emails?.some(email => email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: MemberStatus) => {
    const config = statusConfig[status] || {
      label: status,
      color: 'bg-gray-500',
      icon: AlertCircle
    };
    
    return (
      <Badge className={`${config.color} text-white hover:${config.color}/80`}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTierBadge = (tier: SizeTier) => {
    const config = tierConfig[tier];
    
    return (
      <Badge className={`${config.color} text-white hover:${config.color}/80`}>
        <Crown className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleColumnSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleColumnSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground">Manage member accounts and permissions</p>
        </div>
        <div className="flex items-center gap-4">
          {isBulkClassifying && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Bulk Classification: {bulkProgress.processed}/{bulkProgress.total}
            </div>
          )}
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Tiers</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.t3 + stats.t4}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.needs_reconnect}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Music className="w-5 h-5" />
            Genre Classification
          </CardTitle>
          <CardDescription>
            Automatically classify members' genres using their Spotify profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              onClick={() => handleBulkClassify('spotify-only')}
              disabled={isBulkClassifying}
              className="flex items-center gap-2"
            >
              {isBulkClassifying ? (
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
              ) : (
                <Music className="w-4 h-4" />
              )}
              Re-Classify Members with Spotify URLs
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleBulkClassify('all')}
              disabled={isBulkClassifying}
              className="flex items-center gap-2"
            >
              Force Re-Classify All Members
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              {members.filter(m => m.spotify_url).length} members have Spotify URLs
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="needs_reconnect">Needs Reconnect</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="T1">Tier 1 (0-1K)</SelectItem>
                <SelectItem value="T2">Tier 2 (1K-10K)</SelectItem>
                <SelectItem value="T3">Tier 3 (10K-100K)</SelectItem>
                <SelectItem value="T4">Tier 4 (100K+)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest First</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="last_submission_at">Last Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>
            Manage member accounts, tiers, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No members found matching your criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader column="name">Member</SortableHeader>
                    <SortableHeader column="status">Status</SortableHeader>
                    <SortableHeader column="size_tier">Tier</SortableHeader>
                    <SortableHeader column="followers">Followers</SortableHeader>
                    <SortableHeader column="submissions_this_month">Activity</SortableHeader>
                    <SortableHeader column="net_credits">Monthly Reposts</SortableHeader>
                    <SortableHeader column="created_at">Joined</SortableHeader>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                 <TableBody>
                   {filteredMembers.map((member) => (
                     <TableRow 
                       key={member.id} 
                       className="cursor-pointer hover:bg-muted/50"
                       onClick={() => {
                         setSelectedMember(member);
                         setIsModalOpen(true);
                       }}
                     >
                       <TableCell>
                         <div className="flex flex-col">
                           <div className="flex items-center gap-2">
                             <span className="font-medium">{member.name}</span>
                              <div className="flex gap-1">
                                {member.soundcloud_url && (
                                  <span title="SoundCloud">
                                    <ExternalLink className="w-3 h-3 text-orange-500" />
                                  </span>
                                )}
                                {member.spotify_url && (
                                  <span title="Spotify">
                                    <ExternalLink className="w-3 h-3 text-green-500" />
                                  </span>
                                )}
                              </div>
                           </div>
                           <div className="flex items-center gap-1 text-xs text-muted-foreground">
                             <Mail className="w-3 h-3" />
                             {member.primary_email}
                           </div>
                         </div>
                       </TableCell>
                      <TableCell>
                        {getStatusBadge(member.status)}
                      </TableCell>
                      <TableCell>
                        {getTierBadge(member.size_tier)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          {member.followers?.toLocaleString() || '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="text-sm">
                           <div>{member.submissions_this_month}/{member.monthly_repost_limit} this month</div>
                           {member.last_submission_at && (
                             <div className="text-xs text-muted-foreground">
                               Last: {format(new Date(member.last_submission_at), 'MMM d')}
                             </div>
                           )}
                         </div>
                      </TableCell>
                       <TableCell>
                         <div className="text-sm">
                           <span className={member.net_credits >= 0 ? 'text-green-600' : 'text-red-600'}>
                             {member.net_credits}
                           </span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="text-sm text-muted-foreground">
                           {format(new Date(member.created_at), 'MMM d, yyyy')}
                         </div>
                       </TableCell>
                        <TableCell>
                         <div className="flex gap-1">
                           {member.status === 'active' && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 updateMemberStatus(member.id, 'needs_reconnect');
                               }}
                             >
                               Flag Issue
                             </Button>
                           )}
                           {member.status === 'needs_reconnect' && (
                             <Button
                               size="sm"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 updateMemberStatus(member.id, 'active');
                               }}
                             >
                               Resolve
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>

        {/* Member Detail Modal */}
        <MemberDetailModal
          member={selectedMember}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMember(null);
          }}
          onUpdate={() => {
            fetchMembers();
          }}
        />

        {/* Add Member Modal */}
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            fetchMembers();
          }}
        />
     </div>
  );
};