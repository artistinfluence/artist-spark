
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { RoleBasedRoute } from "@/components/auth/RoleBasedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MemberPortalLayout } from "@/components/portal/MemberPortalLayout";
import { UnauthorizedPage } from "@/components/auth/UnauthorizedPage";

// Dashboard Pages - New 9-Section Architecture
import { UnifiedOverview } from "@/components/dashboard/UnifiedOverview";
import { PlannerPage } from "@/components/dashboard/PlannerPage";
import CampaignsPage from "@/components/dashboard/CampaignsPage";
import { QueuePage } from "@/components/dashboard/QueuePage";
import { MembersPage } from "@/components/dashboard/MembersPage";
import { HealthPage } from "@/components/dashboard/HealthPage";
import { AutomationPage } from "@/components/dashboard/AutomationPage";
import { GenresPage } from "@/components/dashboard/GenresPage";
import { SettingsPage } from "@/components/dashboard/SettingsPage";

// Portal Pages - Enhanced Member Experience
import { MemberDashboard } from "@/components/portal/MemberDashboard";
import { MemberQueue } from "@/components/portal/MemberQueue";
import { SubmitTrack } from "@/components/portal/SubmitTrack";
import { MemberHistory } from "@/components/portal/MemberHistory";
import { CreditSystem } from "@/components/portal/CreditSystem";
import { MemberAnalytics } from "@/components/portal/MemberAnalytics";
import { MemberProfile } from "@/components/portal/MemberProfile";

import Index from "./pages/Index";
import PreviewTool from "./pages/PreviewTool";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Auto-redirect component for authenticated users
const AuthenticatedRedirect = () => {
  const { user, loading, isAdmin, isModerator, isMember } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    // Check if user has any valid role or membership
    if (isAdmin || isModerator) {
      return <Navigate to="/dashboard" replace />;
    } else if (isMember) {
      return <Navigate to="/portal" replace />;
    } else {
      // User is authenticated but not authorized
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  return <LoginPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<AuthenticatedRedirect />} />
            <Route path="/preview" element={<PreviewTool />} />
            <Route path="/auth" element={<AuthenticatedRedirect />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Admin Dashboard - New 9-Section Architecture */}
            <Route path="/dashboard" element={
              <RoleBasedRoute allowedRoles={['admin', 'moderator']}>
                <DashboardLayout />
              </RoleBasedRoute>
            }>
              <Route index element={<UnifiedOverview />} />
              <Route path="planner" element={<PlannerPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="queue" element={<QueuePage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="health" element={<HealthPage />} />
              <Route path="automation" element={<AutomationPage />} />
              <Route path="genres" element={<GenresPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Member Portal - Enhanced Experience */}
            <Route path="/portal" element={
              <RoleBasedRoute requireMember={true}>
                <MemberPortalLayout />
              </RoleBasedRoute>
            }>
              <Route index element={<MemberDashboard />} />
              <Route path="queue" element={<MemberQueue />} />
              <Route path="submit" element={<SubmitTrack />} />
              <Route path="history" element={<MemberHistory />} />
              <Route path="credits" element={<CreditSystem />} />
              <Route path="analytics" element={<MemberAnalytics />} />
              <Route path="profile" element={<MemberProfile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
