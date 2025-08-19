import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Music, Upload, TrendingUp, Coins } from 'lucide-react';

export const MemberDashboard = () => {
  const { member } = useAuth();

  if (!member) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading member data...
      </div>
    );
  }

  const submissionProgress = (member.submissions_this_month / member.monthly_submission_limit) * 100;
  const creditUtilization = member.net_credits > 0 ? ((member.net_credits - member.net_credits) / member.net_credits) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {member.name}!</h1>
          <p className="text-muted-foreground">Track your submissions and performance</p>
        </div>
        <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1">
          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </Badge>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Limit</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.submissions_this_month}/{member.monthly_submission_limit}</div>
            <p className="text-xs text-muted-foreground">submissions this month</p>
            <Progress value={submissionProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Size Tier</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.size_tier}</div>
            <p className="text-xs text-muted-foreground">current tier level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.net_credits}</div>
            <p className="text-xs text-muted-foreground">net credit balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Active</div>
            <p className="text-xs text-muted-foreground">member status</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Submit New Track</h3>
                <p className="text-sm text-muted-foreground">Upload your latest SoundCloud link</p>
              </div>
            </div>
            <Badge variant="outline">
              {member.monthly_submission_limit - member.submissions_this_month} left
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Music className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium">View History</h3>
                <p className="text-sm text-muted-foreground">Check your submission status</p>
              </div>
            </div>
            <Badge variant="outline">Track progress</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};