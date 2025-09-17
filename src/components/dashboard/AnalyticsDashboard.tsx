import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, Target, 
  Calendar, Download, RefreshCw, BarChart3, PieChart as PieChartIcon,
  Activity, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExecutiveMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeMembers: number;
  memberGrowth: number;
  totalCampaigns: number;
  campaignSuccess: number;
  queueFillRate: number;
  avgResponseTime: number;
  customerSatisfaction: number;
}

interface TrendData {
  date: string;
  revenue: number;
  members: number;
  campaigns: number;
  satisfaction: number;
}

interface PlatformHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  avgLatency: number;
  errorRate: number;
  lastIncident: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<ExecutiveMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    activeMembers: 0,
    memberGrowth: 0,
    totalCampaigns: 0,
    campaignSuccess: 0,
    queueFillRate: 0,
    avgResponseTime: 0,
    customerSatisfaction: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth>({
    status: 'healthy',
    uptime: 99.9,
    avgLatency: 120,
    errorRate: 0.1,
    lastIncident: '7 days ago'
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Mock executive metrics
      const mockMetrics: ExecutiveMetrics = {
        totalRevenue: 847250,
        monthlyRevenue: 67890,
        revenueGrowth: 23.5,
        activeMembers: 2847,
        memberGrowth: 12.3,
        totalCampaigns: 1456,
        campaignSuccess: 94.2,
        queueFillRate: 87.8,
        avgResponseTime: 2.3,
        customerSatisfaction: 96.5
      };

      // Mock trend data
      const mockTrends: TrendData[] = [
        { date: 'Jan', revenue: 45000, members: 2200, campaigns: 98, satisfaction: 94 },
        { date: 'Feb', revenue: 52000, members: 2350, campaigns: 112, satisfaction: 95 },
        { date: 'Mar', revenue: 48000, members: 2180, campaigns: 87, satisfaction: 93 },
        { date: 'Apr', revenue: 61000, members: 2580, campaigns: 134, satisfaction: 96 },
        { date: 'May', revenue: 67890, members: 2847, campaigns: 156, satisfaction: 97 },
      ];

      setMetrics(mockMetrics);
      setTrendData(mockTrends);

      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    
    toast({
      title: "Analytics Updated",
      description: "Dashboard data has been refreshed",
    });
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and business metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Platform Health Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {getHealthIcon(platformHealth.status)}
            Platform Health
            <Badge variant={platformHealth.status === 'healthy' ? 'default' : 'destructive'}>
              {platformHealth.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{platformHealth.uptime}%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{platformHealth.avgLatency}ms</p>
              <p className="text-sm text-muted-foreground">Avg Latency</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{platformHealth.errorRate}%</p>
              <p className="text-sm text-muted-foreground">Error Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{platformHealth.lastIncident}</p>
              <p className="text-sm text-muted-foreground">Last Incident</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalRevenue} prefix="$" />
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{metrics.revenueGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.activeMembers} />
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{metrics.memberGrowth}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaign Success</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.campaignSuccess}%</div>
            <Progress value={metrics.campaignSuccess} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Fill Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.queueFillRate}%</div>
            <Progress value={metrics.queueFillRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
                <CardDescription>Active member count over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="members" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed financial performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">${metrics.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-muted-foreground">Monthly Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">${(metrics.monthlyRevenue / metrics.totalCampaigns * 100).toFixed(0)}</p>
                  <p className="text-muted-foreground">Avg Revenue per Campaign</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{metrics.revenueGrowth}%</p>
                  <p className="text-muted-foreground">Growth Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
              <CardDescription>Member acquisition and retention analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Member Acquisition</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>New Members This Month</span>
                      <span className="font-bold">247</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate</span>
                      <span className="font-bold">23.4%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Member Retention</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>30-Day Retention</span>
                      <span className="font-bold">87.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>90-Day Retention</span>
                      <span className="font-bold">72.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>System metrics and operational efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics.avgResponseTime}h</p>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics.queueFillRate}%</p>
                  <p className="text-sm text-muted-foreground">Queue Fill Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics.customerSatisfaction}%</p>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{metrics.totalCampaigns}</p>
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};