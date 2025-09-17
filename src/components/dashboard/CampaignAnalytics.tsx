import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Target, TrendingUp, DollarSign, Users, Music, Clock, 
  Download, RefreshCw, Award, AlertCircle, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalRevenue: number;
  avgROI: number;
  successRate: number;
  avgCompletionTime: number;
  clientSatisfaction: number;
}

interface CampaignData {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  targetReach: number;
  actualReach: number;
  roi: number;
  satisfaction: number;
  genre: string;
}

interface PerformanceTrend {
  month: string;
  campaigns: number;
  revenue: number;
  reach: number;
  roi: number;
  satisfaction: number;
}

interface ROIAnalysis {
  campaignType: string;
  averageROI: number;
  campaigns: number;
  totalRevenue: number;
  color: string;
}

interface ClientPerformance {
  clientName: string;
  totalCampaigns: number;
  totalSpent: number;
  avgROI: number;
  satisfaction: number;
  retentionRate: number;
}

export const CampaignAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalRevenue: 0,
    avgROI: 0,
    successRate: 0,
    avgCompletionTime: 0,
    clientSatisfaction: 0,
  });
  
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [roiAnalysis, setROIAnalysis] = useState<ROIAnalysis[]>([]);
  const [clientPerformance, setClientPerformance] = useState<ClientPerformance[]>([]);

  useEffect(() => {
    fetchCampaignAnalytics();
  }, [timeRange]);

  const fetchCampaignAnalytics = async () => {
    try {
      setLoading(true);

      // Mock campaign metrics
      const mockMetrics: CampaignMetrics = {
        totalCampaigns: 1456,
        activeCampaigns: 73,
        completedCampaigns: 1298,
        totalRevenue: 847250,
        avgROI: 312.5,
        successRate: 94.2,
        avgCompletionTime: 5.3,
        clientSatisfaction: 96.8,
      };

      // Mock campaign data
      const mockCampaigns: CampaignData[] = [
        {
          id: '1',
          name: 'Summer Vibes Campaign',
          client: 'Sunset Records',
          status: 'completed',
          startDate: '2024-06-01',
          endDate: '2024-06-15',
          budget: 5000,
          spent: 4750,
          targetReach: 50000,
          actualReach: 67500,
          roi: 345.2,
          satisfaction: 98,
          genre: 'Pop'
        },
        {
          id: '2',
          name: 'Electronic Beats Push',
          client: 'Beat Digital',
          status: 'active',
          startDate: '2024-07-01',
          endDate: '2024-07-20',
          budget: 8000,
          spent: 3200,
          targetReach: 80000,
          actualReach: 34000,
          roi: 0,
          satisfaction: 0,
          genre: 'Electronic'
        },
        // ... more mock data
      ];

      // Mock performance trends
      const mockTrends: PerformanceTrend[] = [
        { month: 'Jan', campaigns: 98, revenue: 67500, reach: 1240000, roi: 289.3, satisfaction: 94.2 },
        { month: 'Feb', campaigns: 112, revenue: 78900, reach: 1456000, roi: 305.7, satisfaction: 95.1 },
        { month: 'Mar', campaigns: 87, revenue: 61200, reach: 1123000, roi: 278.4, satisfaction: 93.8 },
        { month: 'Apr', campaigns: 134, revenue: 94300, reach: 1789000, roi: 325.6, satisfaction: 96.5 },
        { month: 'May', campaigns: 156, revenue: 108750, reach: 2045000, roi: 342.1, satisfaction: 97.2 },
        { month: 'Jun', campaigns: 141, revenue: 97400, reach: 1834000, roi: 315.8, satisfaction: 96.8 },
      ];

      // Mock ROI analysis
      const mockROI: ROIAnalysis[] = [
        { campaignType: 'Reposts Only', averageROI: 285.3, campaigns: 456, totalRevenue: 234500, color: '#0088FE' },
        { campaignType: 'Likes + Reposts', averageROI: 342.7, campaigns: 298, totalRevenue: 298700, color: '#00C49F' },
        { campaignType: 'Full Engagement', averageROI: 412.1, campaigns: 156, totalRevenue: 187300, color: '#FFBB28' },
        { campaignType: 'Playlist Placement', averageROI: 378.9, campaigns: 89, totalRevenue: 98450, color: '#FF8042' },
      ];

      // Mock client performance
      const mockClients: ClientPerformance[] = [
        { clientName: 'Sunset Records', totalCampaigns: 45, totalSpent: 187500, avgROI: 367.2, satisfaction: 98.1, retentionRate: 95.6 },
        { clientName: 'Beat Digital', totalCampaigns: 32, totalSpent: 142300, avgROI: 289.7, satisfaction: 94.3, retentionRate: 87.5 },
        { clientName: 'Urban Sound Co.', totalCampaigns: 28, totalSpent: 98750, avgROI: 312.5, satisfaction: 96.8, retentionRate: 92.9 },
        { clientName: 'Indie Wave Music', totalCampaigns: 23, totalSpent: 76400, avgROI: 245.8, satisfaction: 91.2, retentionRate: 78.3 },
      ];

      setMetrics(mockMetrics);
      setCampaignData(mockCampaigns);
      setPerformanceTrends(mockTrends);
      setROIAnalysis(mockROI);
      setClientPerformance(mockClients);

      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error: any) {
      console.error('Error fetching campaign analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      active: 'default',
      pending: 'secondary',
      cancelled: 'destructive'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCampaigns = campaignData.filter(campaign => 
    selectedStatus === 'all' || campaign.status === selectedStatus
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading campaign analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Campaign Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive campaign performance, ROI analysis, and client insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalCampaigns} />
            </div>
            <p className="text-xs text-muted-foreground">{metrics.activeCampaigns} currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalRevenue} prefix="$" />
            </div>
            <p className="text-xs text-muted-foreground">+18.2% from last quarter</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgROI}%</div>
            <Progress value={Math.min(metrics.avgROI / 5, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate}%</div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="clients">Client Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Trends</CardTitle>
                <CardDescription>Monthly campaign volume and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="1" 
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      name="Revenue ($)"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="campaigns" 
                      stroke="#00C49F" 
                      strokeWidth={2}
                      name="Campaigns"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI & Satisfaction Trends</CardTitle>
                <CardDescription>Performance quality metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="roi" 
                      stroke="#FF8042" 
                      strokeWidth={2}
                      name="ROI (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="satisfaction" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Satisfaction (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campaign Overview</CardTitle>
                  <CardDescription>Detailed view of all campaigns</CardDescription>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {getStatusIcon(campaign.status)}
                          {campaign.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{campaign.client} • {campaign.genre}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(campaign.status)}
                        {campaign.roi > 0 && (
                          <Badge variant="outline" className="bg-green-50">
                            {campaign.roi}% ROI
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-bold">${campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-bold">${campaign.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target Reach</p>
                        <p className="font-bold">{campaign.targetReach.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual Reach</p>
                        <p className="font-bold">{campaign.actualReach.toLocaleString()}</p>
                      </div>
                    </div>

                    {campaign.status === 'active' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round((campaign.spent / campaign.budget) * 100)}%</span>
                        </div>
                        <Progress value={(campaign.spent / campaign.budget) * 100} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ROI by Campaign Type</CardTitle>
                <CardDescription>Average return on investment by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roiAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="campaignType" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="averageROI" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue breakdown by campaign type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roiAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ campaignType, totalRevenue }) => 
                        `${campaignType}: $${totalRevenue.toLocaleString()}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalRevenue"
                    >
                      {roiAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Performance Dashboard</CardTitle>
              <CardDescription>Key metrics for top clients and retention analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientPerformance.map((client, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{client.clientName}</h4>
                      <Badge variant="outline">{client.totalCampaigns} campaigns</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Spent</p>
                        <p className="font-bold">${client.totalSpent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg ROI</p>
                        <p className="font-bold">{client.avgROI}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Satisfaction</p>
                        <p className="font-bold">{client.satisfaction}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retention</p>
                        <p className="font-bold">{client.retentionRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant={client.retentionRate > 85 ? 'default' : 'secondary'}>
                          {client.retentionRate > 85 ? 'Excellent' : 'Good'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Satisfaction Score</span>
                          <span>{client.satisfaction}%</span>
                        </div>
                        <Progress value={client.satisfaction} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Trend Analysis</CardTitle>
              <CardDescription>Seasonal patterns and predictive insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Seasonal trend analysis, predictive modeling, and AI-powered insights will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};