import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const hasLoggedRef = useRef(false);

  // Debug logging for iOS Chrome issue
  useEffect(() => {
    if (!hasLoggedRef.current) {
      console.log('[ProtectedRoute] Initial state:', {
        loading,
        hasUser: !!currentUser,
        path: location.pathname
      });
      hasLoggedRef.current = true;
    }
  }, []);

  useEffect(() => {
    console.log('[ProtectedRoute] State changed:', {
      loading,
      hasUser: !!currentUser,
      path: location.pathname
    });
  }, [loading, currentUser, location.pathname]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('[ProtectedRoute] No user, redirecting to login from:', location.pathname);
    return <Navigate to='/login' replace />;
  }

  return <>{children}</>;
}
