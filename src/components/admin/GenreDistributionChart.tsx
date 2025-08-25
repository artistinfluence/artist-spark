import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, Music, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

interface GenreStats {
  family_name: string;
  member_count: number;
  total_followers: number;
  avg_followers: number;
  percentage: number;
  submissions_count: number;
}

interface TierDistribution {
  tier: string;
  count: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  submissions: number;
  new_members: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(0 75% 52%)',
  'hsl(45 92% 53%)',
  'hsl(120 75% 42%)',
  'hsl(240 75% 42%)',
  'hsl(300 75% 42%)',
  'hsl(180 75% 42%)',
];

export const GenreDistributionChart: React.FC = () => {
  const { toast } = useToast();
  const [genreStats, setGenreStats] = useState<GenreStats[]>([]);
  const [tierDistribution, setTierDistribution] = useState<TierDistribution[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch genre distribution
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('families, size_tier, soundcloud_followers, created_at')
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Fetch submissions count
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('created_at, member_id');

      if (submissionsError) throw submissionsError;

      // Fetch genre families for names
      const { data: families, error: familiesError } = await supabase
        .from('genre_families')
        .select('id, name');

      if (familiesError) throw familiesError;

      setTotalMembers(members?.length || 0);
      setTotalSubmissions(submissions?.length || 0);

      // Process genre distribution
      const genreMap = new Map<string, {
        count: number;
        totalFollowers: number;
        submissions: number;
      }>();

      // Create family name lookup
      const familyLookup = new Map(families?.map(f => [f.id, f.name]) || []);

      members?.forEach(member => {
        const memberFamilies = member.families || [];
        memberFamilies.forEach((familyId: string) => {
          const familyName = familyLookup.get(familyId) || 'Unknown';
          const current = genreMap.get(familyName) || { count: 0, totalFollowers: 0, submissions: 0 };
          genreMap.set(familyName, {
            count: current.count + 1,
            totalFollowers: current.totalFollowers + (member.soundcloud_followers || 0),
            submissions: current.submissions
          });
        });
      });

      // Skip submission counts for now due to data complexity
      // submissions?.forEach(submission => {
      //   // Complex member-submission relationship matching would go here
      // });

      const genreStatsData: GenreStats[] = Array.from(genreMap.entries()).map(([name, data]) => ({
        family_name: name,
        member_count: data.count,
        total_followers: data.totalFollowers,
        avg_followers: Math.round(data.totalFollowers / data.count),
        percentage: Math.round((data.count / (members?.length || 1)) * 100),
        submissions_count: data.submissions
      })).sort((a, b) => b.member_count - a.member_count);

      setGenreStats(genreStatsData);

      // Process tier distribution
      const tierMap = new Map<string, number>();
      members?.forEach(member => {
        const tier = member.size_tier || 'T1';
        tierMap.set(tier, (tierMap.get(tier) || 0) + 1);
      });

      const tierData: TierDistribution[] = Array.from(tierMap.entries()).map(([tier, count]) => ({
        tier,
        count,
        percentage: Math.round((count / (members?.length || 1)) * 100)
      })).sort((a, b) => a.tier.localeCompare(b.tier));

      setTierDistribution(tierData);

      // Process monthly trends (last 6 months)
      const now = new Date();
      const monthlyData: MonthlyTrend[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        const monthSubmissions = submissions?.filter(s => {
          const subDate = new Date(s.created_at);
          return subDate.getMonth() === date.getMonth() && subDate.getFullYear() === date.getFullYear();
        }).length || 0;

        const newMembers = members?.filter(m => {
          const memberDate = new Date(m.created_at);
          return memberDate.getMonth() === date.getMonth() && memberDate.getFullYear() === date.getFullYear();
        }).length || 0;

        monthlyData.push({
          month: monthStr,
          submissions: monthSubmissions,
          new_members: newMembers
        });
      }

      setMonthlyTrends(monthlyData);

    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{totalMembers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-bold">{totalSubmissions.toLocaleString()}</p>
                </div>
                <Music className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Genres</p>
                  <p className="text-2xl font-bold">{genreStats.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Genre Distribution
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Size Tiers
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monthly Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genre Family Distribution</CardTitle>
              <CardDescription>
                Member count and activity by genre family
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={genreStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="family_name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Bar dataKey="member_count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genre Performance Metrics</CardTitle>
              <CardDescription>
                Detailed breakdown of each genre family
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {genreStats.map((genre, index) => (
                  <motion.div
                    key={genre.family_name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <h4 className="font-medium">{genre.family_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {genre.member_count} members • {genre.submissions_count} submissions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {genre.percentage}%
                      </Badge>
                      <Badge variant="secondary">
                        {genre.avg_followers.toLocaleString()} avg followers
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Size Tier Distribution</CardTitle>
              <CardDescription>
                Member distribution across size tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ tier, percentage }) => `${tier} (${percentage}%)`}
                  >
                    {tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity Trends</CardTitle>
              <CardDescription>
                New members and submissions over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="submissions"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="new_members"
                    stackId="1"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};