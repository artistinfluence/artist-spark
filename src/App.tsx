
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { RoleBasedRoute } from "@/components/auth/RoleBasedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SubmissionsPage } from "@/components/dashboard/SubmissionsPage";
import { MembersPage } from "@/components/dashboard/MembersPage";
import { MemberPortalLayout } from "@/components/portal/MemberPortalLayout";
import { EnhancedMemberDashboard } from "@/components/portal/EnhancedMemberDashboard";
import { AdvancedSubmitTrack } from "@/components/portal/AdvancedSubmitTrack";
import { MemberHistory } from "@/components/portal/MemberHistory";
import { MemberProfile } from "@/components/portal/MemberProfile";
import { EnhancedCreditSystem } from "@/components/portal/EnhancedCreditSystem";
import { InquiriesPage } from "@/components/dashboard/InquiriesPage";
import { ComplaintsPage } from "@/components/dashboard/ComplaintsPage"; 
import { HealthDashboard } from "@/components/dashboard/HealthDashboard";
import { QueueManagement } from "@/components/dashboard/QueueManagement";
import { MemberQueue } from "@/components/portal/MemberQueue";
import { AutomationHistoryPage } from "@/components/dashboard/AutomationHistoryPage";
import { GenreAdministration } from "@/components/dashboard/GenreAdministration";
import { SettingsPage } from "@/components/dashboard/SettingsPage";
import { UnauthorizedPage } from "@/components/auth/UnauthorizedPage";
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
            <Route path="/" element={<Index />} />
            <Route path="/preview" element={<PreviewTool />} />
            <Route path="/auth" element={<AuthenticatedRedirect />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Admin Dashboard - Only admins and moderators */}
            <Route path="/dashboard" 
              element={
                <RoleBasedRoute allowedRoles={['admin', 'moderator']}>
                  <DashboardLayout />
                </RoleBasedRoute>
              } 
            >
              <Route index element={<DashboardOverview />} />
              <Route path="submissions" element={<SubmissionsPage />} />
              <Route path="queue" element={<QueueManagement />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="inquiries" element={<InquiriesPage />} />
              <Route path="complaints" element={<ComplaintsPage />} />
              <Route path="health" element={<HealthDashboard />} />
              <Route path="admin/automation" element={<AutomationHistoryPage />} />
              <Route path="admin/genres" element={<GenreAdministration />} />
              <Route path="admin/settings" element={<SettingsPage />} />
            </Route>

            {/* Member Portal - Only members */}
            <Route 
              path="/portal" 
              element={
                <RoleBasedRoute requireMember={true}>
                  <MemberPortalLayout />
                </RoleBasedRoute>
              } 
            >
              <Route index element={<EnhancedMemberDashboard />} />
              <Route path="queue" element={<MemberQueue />} />
              <Route path="submit" element={<AdvancedSubmitTrack />} />
              <Route path="history" element={<MemberHistory />} />
              <Route path="credits" element={<EnhancedCreditSystem />} />
              <Route path="analytics" element={<EnhancedMemberDashboard />} />
              <Route path="profile" element={<MemberProfile />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
