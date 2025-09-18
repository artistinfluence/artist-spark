import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import { 
  Users, UserCheck, UserX, Star, Activity, Clock, 
  Search, Download, Filter, TrendingUp, Award, Music
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MemberMetrics {
  totalMembers: number;
  activeMembers: number;
  newThisMonth: number;
  retentionRate: number;
  avgEngagement: number;
  topPerformers: number;
}

interface MemberSegment {
  segment: string;
  count: number;
  percentage: number;
  avgScore: number;
  color: string;
}

interface PerformanceData {
  memberId: string;
  name: string;
  handle: string;
  score: number;
  submissions: number;
  completionRate: number;
  avgResponseTime: number;
  tier: string;
  genres: string[];
  lastActive: string;
}

interface EngagementTrend {
  date: string;
  activeUsers: number;
  submissions: number;
  completionRate: number;
  responseTime: number;
}

interface GenrePerformance {
  genre: string;
  memberCount: number;
  avgScore: number;
  successRate: number;
  growthRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const MemberInsights: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  
  const [metrics, setMetrics] = useState<MemberMetrics>({
    totalMembers: 0,
    activeMembers: 0,
    newThisMonth: 0,
    retentionRate: 0,
    avgEngagement: 0,
    topPerformers: 0,
  });
  
  const [segments, setSegments] = useState<MemberSegment[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [engagementTrend, setEngagementTrend] = useState<EngagementTrend[]>([]);
  const [genrePerformance, setGenrePerformance] = useState<GenrePerformance[]>([]);

  useEffect(() => {
    fetchMemberInsights();
  }, []);

  const fetchMemberInsights = async () => {
    try {
      setLoading(true);

      // Mock member metrics
      const mockMetrics: MemberMetrics = {
        totalMembers: 2847,
        activeMembers: 2231,
        newThisMonth: 247,
        retentionRate: 87.3,
        avgEngagement: 76.8,
        topPerformers: 142,
      };

      // Mock member segments
      const mockSegments: MemberSegment[] = [
        { segment: 'Power Users', count: 284, percentage: 10, avgScore: 94.2, color: '#0088FE' },
        { segment: 'Regular Users', count: 1423, percentage: 50, avgScore: 78.5, color: '#00C49F' },
        { segment: 'Casual Users', count: 854, percentage: 30, avgScore: 61.3, color: '#FFBB28' },
        { segment: 'New Users', count: 286, percentage: 10, avgScore: 45.7, color: '#FF8042' },
      ];

      // Mock performance data
      const mockPerformance: PerformanceData[] = [
        {
          memberId: '1',
          name: 'Alex Chen',
          handle: 'alexchen_music',
          score: 96.5,
          submissions: 45,
          completionRate: 98.2,
          avgResponseTime: 1.2,
          tier: 'T4',
          genres: ['Electronic', 'House'],
          lastActive: '2 hours ago'
        },
        {
          memberId: '2', 
          name: 'Sarah Miller',
          handle: 'sarahmiller_beats',
          score: 94.3,
          submissions: 38,
          completionRate: 96.8,
          avgResponseTime: 1.5,
          tier: 'T3',
          genres: ['Hip Hop', 'R&B'],
          lastActive: '5 hours ago'
        },
        {
          memberId: '3',
          name: 'Mike Johnson',
          handle: 'mikej_producer',
          score: 92.1,
          submissions: 52,
          completionRate: 94.2,
          avgResponseTime: 2.1,
          tier: 'T4',
          genres: ['Pop', 'Rock'],
          lastActive: '1 day ago'
        },
        // ... more mock data
      ];

      // Mock engagement trends
      const mockEngagement: EngagementTrend[] = [
        { date: '2024-01', activeUsers: 1834, submissions: 1240, completionRate: 89.2, responseTime: 2.8 },
        { date: '2024-02', activeUsers: 1967, submissions: 1356, completionRate: 91.5, responseTime: 2.5 },
        { date: '2024-03', activeUsers: 2043, submissions: 1423, completionRate: 88.7, responseTime: 2.9 },
        { date: '2024-04', activeUsers: 2156, submissions: 1589, completionRate: 92.3, responseTime: 2.2 },
        { date: '2024-05', activeUsers: 2231, submissions: 1674, completionRate: 94.1, responseTime: 2.0 },
      ];

      // Mock genre performance
      const mockGenreData: GenrePerformance[] = [
        { genre: 'Electronic', memberCount: 542, avgScore: 84.2, successRate: 91.7, growthRate: 15.3 },
        { genre: 'Hip Hop', memberCount: 487, avgScore: 81.5, successRate: 89.2, growthRate: 12.8 },
        { genre: 'Pop', memberCount: 423, avgScore: 79.8, successRate: 87.4, growthRate: 8.9 },
        { genre: 'Rock', memberCount: 356, avgScore: 77.2, successRate: 85.1, growthRate: 6.2 },
        { genre: 'R&B', memberCount: 298, avgScore: 82.7, successRate: 90.3, growthRate: 18.7 },
        { genre: 'Indie', memberCount: 267, avgScore: 76.4, successRate: 83.9, growthRate: 22.1 },
      ];

      setMetrics(mockMetrics);
      setSegments(mockSegments);
      setPerformanceData(mockPerformance);
      setEngagementTrend(mockEngagement);
      setGenrePerformance(mockGenreData);

      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error: any) {
      console.error('Error fetching member insights:', error);
      toast({
        title: "Error",
        description: "Failed to load member insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const tierColors = {
      T1: 'bg-gray-500',
      T2: 'bg-blue-500', 
      T3: 'bg-purple-500',
      T4: 'bg-orange-500'
    };
    return (
      <Badge className={`${tierColors[tier as keyof typeof tierColors]} text-white`}>
        {tier}
      </Badge>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500 text-white">Excellent</Badge>;
    if (score >= 80) return <Badge className="bg-blue-500 text-white">Good</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500 text-white">Fair</Badge>;
    return <Badge className="bg-red-500 text-white">Needs Improvement</Badge>;
  };

  const filteredPerformanceData = performanceData.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || member.tier === filterTier;
    return matchesSearch && matchesTier;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading member insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Member Insights
          </h1>
          <p className="text-muted-foreground">
            Deep analysis of member behavior, performance, and engagement patterns
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Insights
        </Button>
      </div>

      {/* Key Member Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-primary shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              <AnimatedCounter value={metrics.totalMembers} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-accent shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              <AnimatedCounter value={metrics.activeMembers} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-primary-glow shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-glow">
              <AnimatedCounter value={metrics.newThisMonth} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-accent shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{metrics.retentionRate}%</div>
            <Progress value={metrics.retentionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-primary shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.avgEngagement}%</div>
            <Progress value={metrics.avgEngagement} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-primary-glow shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-primary-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-glow">
              <AnimatedCounter value={metrics.topPerformers} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="genres">By Genre</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Segmentation</CardTitle>
                <CardDescription>Distribution of members by engagement level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, percentage }) => `${segment}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {segments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
                <CardDescription>Average performance scores by segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segments.map((segment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{segment.segment}</span>
                        <span className="text-sm text-muted-foreground">
                          {segment.count} members ({segment.percentage}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={segment.avgScore} className="flex-1" />
                        <span className="text-sm font-bold w-12">{segment.avgScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Member Performance Leaderboard</CardTitle>
                  <CardDescription>Top performing members by engagement score</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="T1">T1</SelectItem>
                      <SelectItem value="T2">T2</SelectItem>
                      <SelectItem value="T3">T3</SelectItem>
                      <SelectItem value="T4">T4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPerformanceData.map((member, index) => (
                  <div key={member.memberId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{member.name}</h4>
                          {getTierBadge(member.tier)}
                          {getScoreBadge(member.score)}
                        </div>
                        <p className="text-sm text-muted-foreground">@{member.handle}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{member.submissions} submissions</span>
                          <span>{member.completionRate}% completion</span>
                          <span>{member.avgResponseTime}h avg response</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{member.score}%</div>
                      <div className="flex gap-1 mt-1">
                        {member.genres.map((genre, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active {member.lastActive}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>Member activity and response patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="submissions" fill="#0088FE" name="Submissions" />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#00C49F" 
                    name="Completion Rate (%)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#FF8042" 
                    name="Response Time (hrs)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genre Performance Analysis</CardTitle>
              <CardDescription>Member engagement and success rates by music genre</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genrePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="genre" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="memberCount" fill="hsl(var(--primary))" name="Member Count" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  {genrePerformance.map((genre, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          {genre.genre}
                        </h4>
                        <Badge variant="outline">{genre.memberCount} members</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Avg Score</p>
                          <p className="font-bold">{genre.avgScore}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-bold">{genre.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Growth</p>
                          <p className="font-bold text-green-600">+{genre.growthRate}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
              <CardDescription>Member retention and behavior by signup period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cohort Analysis Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced cohort tracking and retention analysis will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};