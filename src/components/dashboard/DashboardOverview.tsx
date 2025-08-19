import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubmissions } from "@/hooks/useSubmissions";
import {
  FileText,
  Clock,
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react";

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const { stats: submissionStats, loading: statsLoading } = useSubmissions();

  // Real data from database
  const stats = [
    {
      title: "New Submissions",
      value: statsLoading ? "..." : submissionStats.new.toString(),
      description: "Pending review",
      icon: FileText,
      change: `${submissionStats.total} total`,
      changeType: "neutral" as const,
      href: "/dashboard/submissions",
    },
    {
      title: "Today's Queue",
      value: "8",
      description: "Tracks to support",
      icon: Calendar,
      change: "5 completed",
      changeType: "neutral" as const,
      href: "/dashboard/queue",
    },
    {
      title: "Active Members",
      value: "247",
      description: "Total members",
      icon: Users,
      change: "+12",
      changeType: "positive" as const,
      href: "/dashboard/members",
    },
    {
      title: "Health Issues",
      value: "3",
      description: "Need attention",
      icon: AlertTriangle,
      change: "-2",
      changeType: "positive" as const,
      href: "/dashboard/health",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "submission",
      title: "New submission from BeatMaker_X",
      description: "Electronic - Deep House track submitted",
      time: "2 minutes ago",
      status: "new",
    },
    {
      id: 2,
      type: "approval",
      title: "Track approved for support",
      description: "Hip-Hop track scheduled for tomorrow",
      time: "15 minutes ago",
      status: "approved",
    },
    {
      id: 3,
      type: "inquiry",
      title: "New membership inquiry",
      description: "Producer from London applying to join",
      time: "1 hour ago",
      status: "pending",
    },
    {
      id: 4,
      type: "complaint",
      title: "Complaint resolved",
      description: "Member issue about missing support",
      time: "2 hours ago",
      status: "resolved",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-primary";
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "resolved":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-hero rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
        <p className="text-white/80">
          Manage your SoundCloud Groups efficiently with real-time insights and controls.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card 
            key={stat.title}
            className="hover:shadow-glow transition-all cursor-pointer"
            onClick={() => navigate(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <Badge 
                  variant={stat.changeType === "positive" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates across your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status)}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-3 bg-gradient-primary hover:shadow-glow"
              onClick={() => navigate("/dashboard/submissions")}
            >
              <FileText className="h-4 w-4" />
              Review New Submissions
              <Badge variant="secondary" className="ml-auto">{submissionStats.new}</Badge>
            </Button>
            <Button 
              variant="secondary" 
              className="w-full justify-start gap-3"
              onClick={() => navigate("/dashboard/queue")}
            >
              <Clock className="h-4 w-4" />
              Check Today's Queue
              <Badge variant="outline" className="ml-auto">8</Badge>
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={() => navigate("/dashboard/inquiries")}
            >
              <MessageSquare className="h-4 w-4" />
              Handle Inquiries
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => navigate("/dashboard/health")}
            >
              <AlertTriangle className="h-4 w-4" />
              Fix Health Issues
              <Badge variant="destructive" className="ml-auto">3</Badge>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};