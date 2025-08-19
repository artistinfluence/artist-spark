import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
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
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
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
            <Route path="/auth" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<DashboardOverview />} />
              <Route path="submissions" element={<div className="p-8 text-center text-muted-foreground">Submissions page coming soon...</div>} />
              <Route path="queue" element={<div className="p-8 text-center text-muted-foreground">Queue page coming soon...</div>} />
              <Route path="members" element={<div className="p-8 text-center text-muted-foreground">Members page coming soon...</div>} />
              <Route path="inquiries" element={<div className="p-8 text-center text-muted-foreground">Inquiries page coming soon...</div>} />
              <Route path="complaints" element={<div className="p-8 text-center text-muted-foreground">Complaints page coming soon...</div>} />
              <Route path="health" element={<div className="p-8 text-center text-muted-foreground">Health dashboard coming soon...</div>} />
              <Route path="admin/genres" element={<div className="p-8 text-center text-muted-foreground">Genre admin coming soon...</div>} />
              <Route path="admin/settings" element={<div className="p-8 text-center text-muted-foreground">Settings coming soon...</div>} />
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
