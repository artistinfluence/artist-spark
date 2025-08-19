import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  MessageSquare,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  Waves,
  Home,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigation: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Submissions", href: "/dashboard/submissions", icon: FileText },
  { name: "Today's Queue", href: "/dashboard/queue", icon: Calendar },
  { name: "Members", href: "/dashboard/members", icon: Users },
  { name: "Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
  { name: "Complaints", href: "/dashboard/complaints", icon: AlertTriangle },
  { name: "Health", href: "/dashboard/health", icon: AlertTriangle, badge: "3" },
];

const adminNavigation: NavItem[] = [
  { name: "Genre Admin", href: "/dashboard/admin/genres", icon: Settings },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="bg-gradient-primary p-2 rounded-lg shadow-glow">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">SoundCloud Groups</h1>
              <p className="text-sm text-muted-foreground">Artist Influence</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {/* Main Navigation */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = currentPath === item.href || 
                  (item.href !== "/dashboard" && currentPath.startsWith(item.href));
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-primary/10 text-primary border-primary/20"
                    )}
                    onClick={() => {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Admin Navigation */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                ADMIN
              </div>
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = currentPath === item.href || 
                    currentPath.startsWith(item.href);
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-primary/10 text-primary border-primary/20"
                      )}
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* User menu */}
          <div className="border-t border-border p-4 space-y-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4" />
              Public Site
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-accent hover:bg-accent/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};