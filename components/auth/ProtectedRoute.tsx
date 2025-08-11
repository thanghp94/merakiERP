import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = [],
  fallbackPath = '/auth/login'
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push(fallbackPath);
        return;
      }

      // Check role if required
      if (requiredRole.length > 0) {
        const userRole = user.user_metadata?.role || 'student';
        
        if (!requiredRole.includes(userRole)) {
          // User doesn't have required role
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [user, loading, router, requiredRole, fallbackPath]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or wrong role
  if (!user) {
    return null; // Will redirect
  }

  if (requiredRole.length > 0) {
    const userRole = user.user_metadata?.role || 'student';
    if (!requiredRole.includes(userRole)) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
