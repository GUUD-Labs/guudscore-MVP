import { toast } from 'sonner';

import type {
    UseMutationOptions,
    UseQueryOptions,
} from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { secureTokenStore } from '@/lib/token-store';
import { authService } from '@/services';
import type {
    AuthResponse,
    AuthTokens,
    SignInRequest,
    SignUpRequest,
    User,
    ValidateResponse,
    WalletLinkRequest,
} from '@/types';

import { ALPHA_ANALYTICS_KEYS } from './use-alpha-analytics';
import { NFT_QUERY_KEYS } from './use-nft';
import { USER_QUERY_KEYS } from './use-user';

// Query keys
export const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  user: () => [...AUTH_QUERY_KEYS.all, 'user'] as const,
  validate: () => [...AUTH_QUERY_KEYS.all, 'validate'] as const,
} as const;

// Token storage utilities — delegates to secureTokenStore
export const tokenStorage = {
  getAccessToken: (): string | null => {
    return secureTokenStore.getAccessToken();
  },
  getTokenExpiry: (): number | null => {
    return secureTokenStore.getTokenExpiry();
  },
  getRefreshToken: (): string | null => {
    // Refresh token is stored in httpOnly cookie by backend
    return null;
  },
  setTokens: (tokens: AuthTokens): void => {
    secureTokenStore.setTokens(tokens.accessToken, tokens.expiresIn || 2592000);
    authService.setAuthToken(tokens.accessToken);
  },
  clearTokens: (): void => {
    secureTokenStore.clearTokens();
    authService.removeAuthToken();
  },
  isTokenExpired: (): boolean => {
    return secureTokenStore.isTokenExpired();
  },
  shouldRefreshToken: (): boolean => {
    return secureTokenStore.shouldRefreshToken();
  },
};

// Initialize auth token on app start
const initializeAuth = (): void => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    authService.setAuthToken(token);
  }
};

// Auto-initialize
initializeAuth();

/**
 * Hook to validate current session
 */
export const useAuth = (options?: UseQueryOptions<ValidateResponse, Error>) => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.validate(),
    queryFn: () => authService.validate(),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    retry: false,
    ...options,
  });
};

/**
 * Hook to get current user
 */
export const useCurrentUser = (
  options?: UseQueryOptions<User | null, Error>
) => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.user(),
    queryFn: () => authService.getCurrentUser(),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

/**
 * Hook to sign in with email and password
 */
export const useSignIn = (
  options?: UseMutationOptions<AuthResponse, Error, SignInRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: SignInRequest) => authService.signIn(credentials),
    onSuccess: data => {
      tokenStorage.setTokens(data.tokens);
      queryClient.setQueryData(AUTH_QUERY_KEYS.user(), data.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.validate(), {
        valid: true,
        user: data.user,
      });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
    },
    ...options,
  });
};

/**
 * Hook to sign up with email and password
 */
export const useSignUp = (
  options?: UseMutationOptions<AuthResponse, Error, SignUpRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: SignUpRequest) => authService.signUp(credentials),
    onSuccess: data => {
      tokenStorage.setTokens(data.tokens);
      queryClient.setQueryData(AUTH_QUERY_KEYS.user(), data.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.validate(), {
        valid: true,
        user: data.user,
      });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
    },
    ...options,
  });
};

/**
 * Hook to logout
 */
export const useLogout = (options?: UseMutationOptions<void, Error, void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      tokenStorage.clearTokens();
      queryClient.setQueryData(AUTH_QUERY_KEYS.user(), null);
      queryClient.setQueryData(AUTH_QUERY_KEYS.validate(), { valid: false });
      queryClient.clear(); // Clear all cached data on logout
    },
    onSettled: () => {
      // Always clear tokens even if logout request fails
      tokenStorage.clearTokens();
      queryClient.setQueryData(AUTH_QUERY_KEYS.user(), null);
      queryClient.setQueryData(AUTH_QUERY_KEYS.validate(), { valid: false });
    },
    ...options,
  });
};

/**
 * Hook to refresh token
 */
export const useRefreshToken = (
  options?: UseMutationOptions<AuthTokens, Error, void>
) => {
  return useMutation({
    mutationFn: () => authService.refresh(),
    onSuccess: tokens => {
      tokenStorage.setTokens(tokens);
    },
    onError: () => {
      // Clear tokens if refresh fails
      tokenStorage.clearTokens();
    },
    ...options,
  });
};

/**
 * Hook to link wallet
 */
export const useLinkWallet = (
  options?: UseMutationOptions<User, Error, WalletLinkRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WalletLinkRequest) => authService.linkWallet(data),
    onSuccess: user => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.user(), user);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user() });
      // Invalidate all user queries (all networks)
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.validate() });
      // Invalidate alpha analytics to refresh community data
      queryClient.invalidateQueries({ queryKey: ALPHA_ANALYTICS_KEYS.all });
      // Invalidate NFT queries to refresh NFT and token data
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.myCollections() });
      toast.success('Wallet linked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link wallet');
    },
    ...options,
  });
};

/**
 * Hook to unlink wallet
 */
export const useUnlinkWallet = (
  options?: UseMutationOptions<User, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletAddress: string) =>
      authService.unlinkWallet(walletAddress),
    onSuccess: user => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.user(), user);
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user() });
      // Invalidate all user queries (all networks)
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.validate() });
      // Invalidate alpha analytics to refresh community data
      queryClient.invalidateQueries({ queryKey: ALPHA_ANALYTICS_KEYS.all });
      // Invalidate NFT queries to refresh NFT and token data
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.myCollections() });
      toast.success('Wallet removed successfully!');
    },
    onError: (error: Error) => {
      // Backend returns 400 CROSSSLOT error but wallet is actually deleted
      // Refresh data to show actual state regardless of error response
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user() });
      // Invalidate all user queries (all networks)
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.validate() });
      queryClient.invalidateQueries({ queryKey: ALPHA_ANALYTICS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.myCollections() });
      
      // Check if this is the Redis CROSSSLOT error (operation likely succeeded)
      if (error.message?.includes('CROSSSLOT') || error.message?.includes("don't hash")) {
        toast.success('Wallet removal in progress, refreshing...');
      } else {
        toast.error(error.message || 'Failed to remove wallet');
      }
    },
    ...options,
  });
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { data: validateResult } = useAuth();
  return validateResult?.valid ?? false;
};

/**
 * Utility hook for automatic token refresh
 */
export const useAutoRefresh = () => {
  const refreshMutation = useRefreshToken();

  // Check and refresh token if needed
  const checkAndRefresh = async () => {
    // Skip on callback pages — the callback will handle token storage
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback/')) {
      return;
    }

    const token = tokenStorage.getAccessToken();
    
    if (!token) {
      return;
    }

    if (tokenStorage.isTokenExpired()) {
      try {
        await refreshMutation.mutateAsync();
      } catch {
        tokenStorage.clearTokens();
      }
      return;
    }

    if (tokenStorage.shouldRefreshToken()) {
      try {
        await refreshMutation.mutateAsync();
      } catch {
        // Don't clear tokens on proactive refresh failure
      }
    }
  };

  return { checkAndRefresh, isRefreshing: refreshMutation.isPending };
};
