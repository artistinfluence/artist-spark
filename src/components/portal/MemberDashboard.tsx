import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberSubmissions } from '@/hooks/useMemberSubmissions';
import { Music, Upload, TrendingUp, Coins, ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MemberDashboard = () => {
  const { member } = useAuth();
  const { stats, loading } = useMemberSubmissions();
  const navigate = useNavigate();

  if (!member) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading member data...
      </div>
    );
  }

  const submissionProgress = (stats.thisMonthSubmissions / member.monthly_repost_limit) * 100;
  const remainingSubmissions = member.monthly_repost_limit - stats.thisMonthSubmissions;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'qa_flag': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'qa_flag': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

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
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthSubmissions}/{member.monthly_repost_limit}</div>
            <p className="text-xs text-muted-foreground">submissions used</p>
            <Progress value={submissionProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedSubmissions}</div>
            <p className="text-xs text-muted-foreground">total approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.net_credits}</div>
            <p className="text-xs text-muted-foreground">available balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-between h-auto p-4"
            onClick={() => navigate('/portal/submit')}
            disabled={remainingSubmissions <= 0}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">Submit New Track</h3>
                <p className="text-sm text-muted-foreground">Upload your latest SoundCloud link</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {remainingSubmissions > 0 ? `${remainingSubmissions} left` : 'Limit reached'}
              </Badge>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-between h-auto p-4"
            onClick={() => navigate('/portal/history')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Music className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-left">
                <h3 className="font-medium">View History</h3>
                <p className="text-sm text-muted-foreground">Check your submission status</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {stats.totalSubmissions} total
              </Badge>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      {stats.recentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Submissions</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/portal/history')}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSubmissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(submission.status)}
                    <div>
                      <h4 className="font-medium text-sm">{submission.artist_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(submission.status)}>
                    {submission.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};