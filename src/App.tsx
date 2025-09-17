
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
import { ErrorBoundary } from "@/components/ui/error-boundary";
import React, { Suspense } from "react";

// Lazy load dashboard pages for better performance
const UnifiedOverview = React.lazy(() => import("@/components/dashboard/UnifiedOverview").then(m => ({ default: m.UnifiedOverview })));
const PlannerPage = React.lazy(() => import("@/components/dashboard/PlannerPage").then(m => ({ default: m.PlannerPage })));
const CampaignsPage = React.lazy(() => import("@/components/dashboard/CampaignsPage"));
const QueuePage = React.lazy(() => import("@/components/dashboard/QueuePage").then(m => ({ default: m.QueuePage })));
const MembersPage = React.lazy(() => import("@/components/dashboard/MembersPage").then(m => ({ default: m.MembersPage })));
const HealthPage = React.lazy(() => import("@/components/dashboard/HealthPage").then(m => ({ default: m.HealthPage })));
const AutomationPage = React.lazy(() => import("@/components/dashboard/AutomationPage").then(m => ({ default: m.AutomationPage })));
const GenresPage = React.lazy(() => import("@/components/dashboard/GenresPage").then(m => ({ default: m.GenresPage })));
const SettingsPage = React.lazy(() => import("@/components/dashboard/SettingsPage").then(m => ({ default: m.SettingsPage })));

// Lazy load analytics pages
const AnalyticsDashboard = React.lazy(() => import("@/components/dashboard/AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard })));
const RevenueAnalytics = React.lazy(() => import("@/components/dashboard/RevenueAnalytics").then(m => ({ default: m.RevenueAnalytics })));
const MemberInsights = React.lazy(() => import("@/components/dashboard/MemberInsights").then(m => ({ default: m.MemberInsights })));
const CampaignAnalytics = React.lazy(() => import("@/components/dashboard/CampaignAnalytics").then(m => ({ default: m.CampaignAnalytics })));
const ReportBuilder = React.lazy(() => import("@/components/dashboard/ReportBuilder").then(m => ({ default: m.ReportBuilder })));
const DataExportManager = React.lazy(() => import("@/components/dashboard/DataExportManager").then(m => ({ default: m.DataExportManager })));
const BusinessIntelligence = React.lazy(() => import("@/components/dashboard/BusinessIntelligence").then(m => ({ default: m.BusinessIntelligence })));
const IntegratedAnalytics = React.lazy(() => import("@/components/dashboard/IntegratedAnalytics").then(m => ({ default: m.IntegratedAnalytics })));

// Lazy load portal pages for better performance
const MemberDashboard = React.lazy(() => import("@/components/portal/MemberDashboard").then(m => ({ default: m.MemberDashboard })));
const MemberQueue = React.lazy(() => import("@/components/portal/MemberQueue").then(m => ({ default: m.MemberQueue })));
const SubmitTrack = React.lazy(() => import("@/components/portal/SubmitTrack").then(m => ({ default: m.SubmitTrack })));
const AdvancedSubmitTrack = React.lazy(() => import("@/components/portal/AdvancedSubmitTrack").then(m => ({ default: m.AdvancedSubmitTrack })));
const MemberHistory = React.lazy(() => import("@/components/portal/MemberHistory").then(m => ({ default: m.MemberHistory })));
const CreditSystem = React.lazy(() => import("@/components/portal/CreditSystem").then(m => ({ default: m.CreditSystem })));
const MemberAnalytics = React.lazy(() => import("@/components/portal/MemberAnalytics").then(m => ({ default: m.MemberAnalytics })));
const PerformanceAnalytics = React.lazy(() => import("@/components/portal/PerformanceAnalytics").then(m => ({ default: m.PerformanceAnalytics })));
const AttributionDashboard = React.lazy(() => import("@/components/portal/AttributionDashboard").then(m => ({ default: m.AttributionDashboard })));
const AvoidListManager = React.lazy(() => import("@/components/portal/AvoidListManager").then(m => ({ default: m.AvoidListManager })));
const MemberProfile = React.lazy(() => import("@/components/portal/MemberProfile").then(m => ({ default: m.MemberProfile })));

// Loading component for Suspense
const PageLoadingSpinner = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
  <ErrorBoundary>
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
                <Route index element={<Suspense fallback={<PageLoadingSpinner />}><UnifiedOverview /></Suspense>} />
                <Route path="planner" element={<Suspense fallback={<PageLoadingSpinner />}><PlannerPage /></Suspense>} />
                <Route path="campaigns" element={<Suspense fallback={<PageLoadingSpinner />}><CampaignsPage /></Suspense>} />
                <Route path="queue" element={<Suspense fallback={<PageLoadingSpinner />}><QueuePage /></Suspense>} />
                <Route path="members" element={<Suspense fallback={<PageLoadingSpinner />}><MembersPage /></Suspense>} />
                <Route path="health" element={<Suspense fallback={<PageLoadingSpinner />}><HealthPage /></Suspense>} />
                <Route path="automation" element={<Suspense fallback={<PageLoadingSpinner />}><AutomationPage /></Suspense>} />
                <Route path="genres" element={<Suspense fallback={<PageLoadingSpinner />}><GenresPage /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<PageLoadingSpinner />}><SettingsPage /></Suspense>} />
                
                {/* Analytics Routes */}
                <Route path="analytics" element={<Suspense fallback={<PageLoadingSpinner />}><AnalyticsDashboard /></Suspense>} />
                <Route path="analytics/revenue" element={<Suspense fallback={<PageLoadingSpinner />}><RevenueAnalytics /></Suspense>} />
                <Route path="analytics/members" element={<Suspense fallback={<PageLoadingSpinner />}><MemberInsights /></Suspense>} />
                <Route path="analytics/campaigns" element={<Suspense fallback={<PageLoadingSpinner />}><CampaignAnalytics /></Suspense>} />
                <Route path="analytics/reports" element={<Suspense fallback={<PageLoadingSpinner />}><ReportBuilder /></Suspense>} />
                <Route path="analytics/exports" element={<Suspense fallback={<PageLoadingSpinner />}><DataExportManager /></Suspense>} />
                <Route path="analytics/intelligence" element={<Suspense fallback={<PageLoadingSpinner />}><BusinessIntelligence /></Suspense>} />
                <Route path="analytics/integrated" element={<Suspense fallback={<PageLoadingSpinner />}><IntegratedAnalytics /></Suspense>} />
              </Route>

              {/* Member Portal - Enhanced Experience */}
              <Route path="/portal" element={
                <RoleBasedRoute requireMember={true}>
                  <MemberPortalLayout />
                </RoleBasedRoute>
              }>
                <Route index element={<Suspense fallback={<PageLoadingSpinner />}><MemberDashboard /></Suspense>} />
                <Route path="queue" element={<Suspense fallback={<PageLoadingSpinner />}><MemberQueue /></Suspense>} />
                <Route path="submit" element={<Suspense fallback={<PageLoadingSpinner />}><SubmitTrack /></Suspense>} />
                <Route path="submit-advanced" element={<Suspense fallback={<PageLoadingSpinner />}><AdvancedSubmitTrack /></Suspense>} />
                <Route path="history" element={<Suspense fallback={<PageLoadingSpinner />}><MemberHistory /></Suspense>} />
                <Route path="credits" element={<Suspense fallback={<PageLoadingSpinner />}><CreditSystem /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<PageLoadingSpinner />}><MemberAnalytics /></Suspense>} />
                <Route path="performance" element={<Suspense fallback={<PageLoadingSpinner />}><PerformanceAnalytics /></Suspense>} />
                <Route path="attribution" element={<Suspense fallback={<PageLoadingSpinner />}><AttributionDashboard /></Suspense>} />
                <Route path="avoid-list" element={<Suspense fallback={<PageLoadingSpinner />}><AvoidListManager /></Suspense>} />
                <Route path="profile" element={<Suspense fallback={<PageLoadingSpinner />}><MemberProfile /></Suspense>} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
