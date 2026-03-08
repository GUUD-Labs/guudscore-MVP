import type { ComponentType, FC, ReactNode } from 'react';
import { createContext, useContext, useEffect } from 'react';

import { tokenStorage, useAuth, useAutoRefresh } from '@/hooks';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  checkAndRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const { data: authData, isLoading, error } = useAuth();

  const { checkAndRefresh, isRefreshing } = useAutoRefresh();

  // Auto-refresh token on mount and periodically
  useEffect(() => {
    // Initial check
    checkAndRefresh();

    // Set up periodic refresh (every 10 minutes)
    const interval = setInterval(checkAndRefresh, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Clear tokens if validation fails and redirect to login
  useEffect(() => {
    const hasToken = !!tokenStorage.getAccessToken();
    const isExpired = tokenStorage.isTokenExpired();
    const currentPath = window.location.pathname;
    const oauthInProgress = sessionStorage.getItem('oauth_login_in_progress');

    console.log('[AuthContext] Token validation check:', {
      hasToken,
      isExpired,
      isLoading,
      authDataValid: authData?.valid,
      currentPath,
      oauthInProgress: !!oauthInProgress,
    });

    // Skip validation for callback pages
    if (currentPath.startsWith('/auth/callback/')) {
      console.log('[AuthContext] Skipping validation for callback page');
      return;
    }

    // Skip aggressive validation if OAuth login just completed
    // Give it time to settle before validating
    if (oauthInProgress) {
      console.log('[AuthContext] OAuth login in progress, skipping aggressive validation');

      // Clear the flag after a short delay to allow initial navigation
      setTimeout(() => {
        sessionStorage.removeItem('oauth_login_in_progress');
        console.log('[AuthContext] OAuth login flag cleared');
      }, 3000);

      return;
    }

    // If token exists but is expired or invalid, redirect to login
    if (
      !isLoading &&
      hasToken &&
      (isExpired || (authData && !authData.valid))
    ) {
      console.warn(
        '[AuthContext] Token validation failed, clearing tokens and redirecting'
      );
      tokenStorage.clearTokens();

      // Only redirect if not already on login/register pages
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
  }, [authData, isLoading]);

  const contextValue: AuthContextType = {
    user: authData?.valid && authData?.user ? authData.user : null,
    isAuthenticated: authData?.valid ?? false,
    isLoading: isLoading || isRefreshing,
    error,
    checkAndRefresh,
    isRefreshing,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
interface WithAuthOptions {
  redirectTo?: string;
  requireEmailVerified?: boolean;
}

export const withAuth = <P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) => {
  const { redirectTo = '/login', requireEmailVerified = false } = options;

  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, isLoading } = useAuthContext();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = redirectTo;
      }

      if (
        !isLoading &&
        isAuthenticated &&
        requireEmailVerified &&
        !user?.isEmailVerified
      ) {
        window.location.href = '/verify-email';
      }
    }, [isAuthenticated, isLoading, user]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requireEmailVerified && !user?.isEmailVerified) {
      return null;
    }

    return <Component {...props} />;
  };
};

// Hook for route guards
export const useRequireAuth = (options: WithAuthOptions = {}) => {
  const { isAuthenticated, user, isLoading } = useAuthContext();
  const { redirectTo = '/login', requireEmailVerified = false } = options;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }

    if (
      !isLoading &&
      isAuthenticated &&
      requireEmailVerified &&
      !user?.isEmailVerified
    ) {
      window.location.href = '/verify-email';
    }
  }, [isAuthenticated, isLoading, user, redirectTo, requireEmailVerified]);

  return {
    isAuthenticated,
    user,
    isLoading,
    canAccess:
      isAuthenticated && (!requireEmailVerified || user?.isEmailVerified),
  };
};
