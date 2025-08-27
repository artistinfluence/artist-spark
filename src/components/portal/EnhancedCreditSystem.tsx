import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, Clock, Info, Target, Zap, Gift, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { InteractiveCard } from '@/components/ui/interactive-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface CreditTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus' | 'penalty';
  amount: number;
  description: string;
  date: string;
  related_submission?: {
    artist_name: string;
    track_url: string;
  };
  category: 'support' | 'monthly' | 'bonus' | 'transfer' | 'penalty';
}

interface CreditForecast {
  month: string;
  projected: number;
  actual?: number;
}

interface EarningOpportunity {
  id: string;
  title: string;
  description: string;
  potential_credits: number;
  difficulty: 'easy' | 'medium' | 'hard';
  action_url?: string;
}

export const EnhancedCreditSystem: React.FC = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [forecast, setForecast] = useState<CreditForecast[]>([]);
  const [opportunities, setOpportunities] = useState<EarningOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const { member } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (member) {
      fetchCreditData();
      generateForecast();
      generateOpportunities();
    }
  }, [member]);

  const fetchCreditData = async () => {
    if (!member) return;

    try {
      // Fetch queue assignments (spent credits)
      const { data: assignments, error: assignmentError } = await supabase
        .from('queue_assignments')
        .select(`
          id,
          credits_allocated,
          created_at,
          status,
          submissions!inner(
            artist_name,
            track_url
          )
        `)
        .eq('supporter_id', member.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (assignmentError) throw assignmentError;

      // Convert to enhanced transactions
      const enhancedTransactions: CreditTransaction[] = [
        // Spent credits
        ...(assignments?.map(assignment => ({
          id: assignment.id,
          type: 'spent' as const,
          amount: assignment.credits_allocated,
          description: `Supported "${assignment.submissions.artist_name}"`,
          date: assignment.created_at,
          related_submission: assignment.submissions,
          category: 'support' as const
        })) || []),
        
        // Mock additional transaction types
        ...generateMockTransactions(member)
      ];

      // Sort by date
      enhancedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(enhancedTransactions);
    } catch (error) {
      console.error('Error fetching credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockTransactions = (member: any): CreditTransaction[] => {
    const mockTransactions: CreditTransaction[] = [];
    const today = new Date();
    
    // Monthly allocation
    mockTransactions.push({
      id: 'monthly-allocation',
      type: 'earned',
      amount: member.monthly_repost_limit * 100 || 1000,
      description: 'Monthly credit allocation',
      date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
      category: 'monthly'
    });

    // Bonus credits
    if (member.credits_given > 0) {
      mockTransactions.push({
        id: 'participation-bonus',
        type: 'bonus',
        amount: Math.floor(member.credits_given * 0.1),
        description: 'Community participation bonus',
        date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'bonus'
      });
    }

    // Quality bonus
    mockTransactions.push({
      id: 'quality-bonus',
      type: 'bonus',
      amount: 50,
      description: 'High-quality submission bonus',
      date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'bonus'
    });

    return mockTransactions;
  };

  const generateForecast = () => {
    if (!member) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const forecastData: CreditForecast[] = months.map((month, index) => ({
      month,
      projected: member.monthly_repost_limit * 100 + Math.floor(Math.random() * 200),
      actual: index < 3 ? member.monthly_repost_limit * 100 + Math.floor(Math.random() * 100) : undefined
    }));

    setForecast(forecastData);
  };

  const generateOpportunities = () => {
    const opportunities: EarningOpportunity[] = [
      {
        id: 'daily-support',
        title: 'Daily Support Goal',
        description: 'Support 3 artists today to earn bonus credits',
        potential_credits: 50,
        difficulty: 'easy',
        action_url: '/portal/queue'
      },
      {
        id: 'genre-expert',
        title: 'Genre Expert',
        description: 'Support 10 tracks in your favorite genre this week',
        potential_credits: 200,
        difficulty: 'medium'
      },
      {
        id: 'community-leader',
        title: 'Community Leader',
        description: 'Achieve 95%+ approval rate with 20+ submissions',
        potential_credits: 500,
        difficulty: 'hard'
      },
      {
        id: 'feedback-champion',
        title: 'Feedback Champion',
        description: 'Provide detailed feedback on 5 submissions',
        potential_credits: 100,
        difficulty: 'medium'
      }
    ];

    setOpportunities(opportunities);
  };

  const handleTransfer = async () => {
    if (!member || !transferAmount || !transferRecipient) return;

    const amount = parseInt(transferAmount);
    if (amount <= 0 || amount > member.net_credits) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid transfer amount",
        variant: "destructive",
      });
      return;
    }

    setTransferLoading(true);
    try {
      // In a real app, this would call an edge function to handle the transfer
      toast({
        title: "Transfer Initiated",
        description: `Transferring ${amount} credits to ${transferRecipient}`,
      });
      
      setTransferAmount('');
      setTransferRecipient('');
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: "Could not complete the transfer",
        variant: "destructive",
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const thisMonthEarned = transactions
    .filter(t => ['earned', 'bonus'].includes(t.type) && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthSpent = transactions
    .filter(t => t.type === 'spent' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyLimit = member ? (member.monthly_repost_limit * 100 || 1000) : 1000;
  const creditUtilization = member ? (thisMonthSpent / monthlyLimit) * 100 : 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Enhanced Credit System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-foreground">Enhanced Credit System</h2>
        <p className="text-muted-foreground">
          Comprehensive credit management with forecasting and earning opportunities
        </p>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Credit Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                title: "Available Balance",
                icon: Coins,
                value: member?.net_credits || 0,
                description: "credits ready to use",
                color: "text-green-600"
              },
              {
                title: "This Month Earned",
                icon: TrendingUp,
                value: thisMonthEarned,
                description: "credits gained",
                color: "text-blue-600"
              },
              {
                title: "This Month Spent",
                icon: TrendingDown,
                value: thisMonthSpent,
                description: "credits used",
                color: "text-orange-600"
              },
              {
                title: "Utilization Rate",
                icon: Target,
                value: `${creditUtilization.toFixed(1)}%`,
                description: "of monthly limit",
                color: "text-purple-600"
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <InteractiveCard hoverScale={1.03}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {typeof stat.value === 'number' ? (
                        <AnimatedCounter value={stat.value} />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </InteractiveCard>
              </motion.div>
            ))}
          </div>

          {/* Credit Utilization Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Credit Usage</span>
                  <span className="text-sm text-muted-foreground">
                    {thisMonthSpent} / {monthlyLimit}
                  </span>
                </div>
                <Progress value={creditUtilization} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {creditUtilization.toFixed(1)}% of monthly limit used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No credit activity yet</p>
                  <p className="text-sm">Start supporting other artists to see your credit history</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {format(new Date(transaction.date), 'MMM d')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={['earned', 'bonus'].includes(transaction.type) ? 'default' : 'secondary'}
                            className={['earned', 'bonus'].includes(transaction.type) ? 'bg-green-500' : 'bg-red-500'}
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.category}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          ['earned', 'bonus'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {['earned', 'bonus'].includes(transaction.type) ? '+' : '-'}{transaction.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Credit Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Forecast</CardTitle>
              <CardDescription>
                Projected credit earnings based on your activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Area 
                    type="monotone" 
                    dataKey="projected" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Usage Patterns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-medium text-primary">Peak Usage</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    You typically spend more credits on weekends and early in the month.
                  </p>
                </div>
                
                <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                  <h4 className="font-medium text-secondary">Earning Pattern</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your credit earning is consistent with monthly allocations and occasional bonuses.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Credits per Support</span>
                  <span className="font-medium">~50 credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Monthly Burn Rate</span>
                  <span className="font-medium">{Math.round(creditUtilization)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Efficiency Score</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          {/* Earning Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Earning Opportunities
              </CardTitle>
              <CardDescription>
                Complete these activities to earn additional credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map((opportunity) => (
                  <InteractiveCard key={opportunity.id} hoverScale={1.02}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{opportunity.title}</h4>
                          <p className="text-sm text-muted-foreground">{opportunity.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={getDifficultyColor(opportunity.difficulty)}
                        >
                          {opportunity.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">+{opportunity.potential_credits}</span>
                          <span className="text-sm text-muted-foreground">credits</span>
                        </div>
                        
                        {opportunity.action_url && (
                          <Button variant="outline" size="sm">
                            Start <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </InteractiveCard>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-6">
          {/* Credit Transfer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Transfer Credits
              </CardTitle>
              <CardDescription>
                Send credits to other community members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Username</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter username"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    max={member?.net_credits || 0}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                Available balance: {member?.net_credits || 0} credits
              </div>
              
              <Button 
                onClick={handleTransfer}
                disabled={transferLoading || !transferAmount || !transferRecipient}
                className="w-full"
              >
                {transferLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Processing Transfer...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Send Credits
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};