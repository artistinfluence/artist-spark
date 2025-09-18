import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { AnalyticsHeader, ActionButtonGroup } from '@/components/ui/analytics-header';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Target, Calendar,
  Download, RefreshCw, Users, CreditCard, Banknote, PieChart as PieChartIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurring: number;
  oneTimePayments: number;
  projectedRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  churnRate: number;
}

interface RevenueData {
  date: string;
  recurring: number;
  oneTime: number;
  total: number;
  customers: number;
}

interface RevenueSource {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface ForecastData {
  month: string;
  projected: number;
  conservative: number;
  optimistic: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const RevenueAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    monthlyRecurring: 0,
    oneTimePayments: 0,
    projectedRevenue: 0,
    revenueGrowth: 0,
    averageOrderValue: 0,
    customerLifetimeValue: 0,
    churnRate: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);

      // Mock revenue metrics
      const mockMetrics: RevenueMetrics = {
        totalRevenue: 847250,
        monthlyRecurring: 45600,
        oneTimePayments: 22140,
        projectedRevenue: 950000,
        revenueGrowth: 23.5,
        averageOrderValue: 385,
        customerLifetimeValue: 2847,
        churnRate: 4.2,
      };

      // Mock revenue data over time
      const mockRevenueData: RevenueData[] = [
        { date: '2024-01', recurring: 38000, oneTime: 15000, total: 53000, customers: 145 },
        { date: '2024-02', recurring: 41000, oneTime: 18000, total: 59000, customers: 167 },
        { date: '2024-03', recurring: 39000, oneTime: 12000, total: 51000, customers: 134 },
        { date: '2024-04', recurring: 44000, oneTime: 22000, total: 66000, customers: 189 },
        { date: '2024-05', recurring: 45600, oneTime: 22140, total: 67740, customers: 203 },
        { date: '2024-06', recurring: 47200, oneTime: 25600, total: 72800, customers: 218 },
      ];

      // Mock revenue sources
      const mockSources: RevenueSource[] = [
        { name: 'SoundCloud Campaigns', value: 425000, color: '#0088FE', percentage: 50.2 },
        { name: 'Premium Memberships', value: 254000, color: '#00C49F', percentage: 30.0 },
        { name: 'Credit Purchases', value: 118000, color: '#FFBB28', percentage: 13.9 },
        { name: 'API Access', value: 35000, color: '#FF8042', percentage: 4.1 },
        { name: 'Consulting', value: 15250, color: '#8884d8', percentage: 1.8 },
      ];

      // Mock forecast data
      const mockForecast: ForecastData[] = [
        { month: 'Jul 2024', projected: 78000, conservative: 72000, optimistic: 85000 },
        { month: 'Aug 2024', projected: 82000, conservative: 75000, optimistic: 92000 },
        { month: 'Sep 2024', projected: 85000, conservative: 78000, optimistic: 96000 },
        { month: 'Oct 2024', projected: 88000, conservative: 81000, optimistic: 99000 },
        { month: 'Nov 2024', projected: 92000, conservative: 84000, optimistic: 104000 },
        { month: 'Dec 2024', projected: 96000, conservative: 87000, optimistic: 108000 },
      ];

      setMetrics(mockMetrics);
      setRevenueData(mockRevenueData);
      setRevenueSources(mockSources);
      setForecastData(mockForecast);

      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error: any) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: "Error",
        description: "Failed to load revenue analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast({
      title: "Export Started",
      description: "Revenue report is being prepared for download",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        title="Revenue Analytics"
        description="Comprehensive financial performance and forecasting"
        actions={
          <ActionButtonGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="2years">2 Years</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </ActionButtonGroup>
        }
      />

      {/* Key Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.totalRevenue} prefix="$" />
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{metrics.revenueGrowth}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.monthlyRecurring} prefix="$" />
            </div>
            <p className="text-xs text-muted-foreground">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Banknote className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.averageOrderValue} prefix="$" />
            </div>
            <p className="text-xs text-muted-foreground">+12.1% increase</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={metrics.customerLifetimeValue} prefix="$" />
            </div>
            <p className="text-xs text-muted-foreground">24-month average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Revenue Sources</TabsTrigger>
          <TabsTrigger value="forecast">Forecasting</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue breakdown by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="recurring" 
                      stackId="1" 
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      name="Recurring Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="oneTime" 
                      stackId="1" 
                      stroke="#00C49F" 
                      fill="#00C49F" 
                      name="One-Time Payments"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>Paying customers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue by source category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueSources.map((entry, index) => (
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
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Detailed breakdown by revenue source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${source.value.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{source.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>6-month revenue projections with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="conservative" 
                    stroke="#FF6B6B" 
                    strokeDasharray="5 5"
                    name="Conservative"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projected" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Projected"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="optimistic" 
                    stroke="#4ECDC4" 
                    strokeDasharray="5 5"
                    name="Optimistic"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-700 dark:text-green-300">Strong Growth</span>
                  </div>
                  <p className="text-sm">Revenue grew 23.5% month-over-month, driven by increased campaign volume and premium subscriptions.</p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-700 dark:text-blue-300">Campaign Success</span>
                  </div>
                  <p className="text-sm">SoundCloud campaigns represent 50.2% of revenue with highest margins and customer satisfaction.</p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold text-orange-700 dark:text-orange-300">Customer Value</span>
                  </div>
                  <p className="text-sm">Customer lifetime value increased to $2,847 with improved retention strategies.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Churn Rate</span>
                    <Badge variant={metrics.churnRate < 5 ? 'default' : 'destructive'}>
                      {metrics.churnRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Revenue Growth Rate</span>
                    <Badge variant="default">+{metrics.revenueGrowth}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Acquisition Cost</span>
                    <span className="font-bold">$247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payback Period</span>
                    <span className="font-bold">3.2 months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Revenue per User</span>
                    <span className="font-bold">$298</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};