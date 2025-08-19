import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireMember?: boolean;
  requireAuth?: boolean;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  requireMember = false,
  requireAuth = true 
}) => {
  const { user, loading, userRoles, member } = useAuth();
  const location = useLocation();
  
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
  
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  if (requireMember && !member) {
    return <Navigate to="/auth" replace />;
  }
  
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
    if (!hasAllowedRole) {
      // Redirect based on user type
      if (member && !userRoles.includes('admin') && !userRoles.includes('moderator')) {
        return <Navigate to="/portal" replace />;
      } else if (userRoles.includes('admin') || userRoles.includes('moderator')) {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/auth" replace />;
      }
    }
  }
  
  return <>{children}</>;
};