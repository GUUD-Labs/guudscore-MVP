import { toast } from 'sonner';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useChain } from '@/contexts/chain-context';
import { tokenStorage } from '@/hooks';
import { clearCache } from '@/lib/avatar-cache';
import { userService } from '@/services';
import type { ExtendedUser, UserSearchParams } from '@/types';

// Query keys
export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  currentUser: (network?: string) => [...USER_QUERY_KEYS.all, 'current', network] as const,
  user: (key: string, network?: string) => [...USER_QUERY_KEYS.all, 'user', key, network] as const,
  dashboardMetrics: (network?: string) => [...USER_QUERY_KEYS.all, 'dashboardMetrics', network] as const,
  search: (params: UserSearchParams) =>
    [...USER_QUERY_KEYS.all, 'search', params] as const,
} as const;

/**
 * Hook to get current authenticated user with network-specific badges
 * @returns Query result with current user data, loading state, and error handling
 */
export const useCurrentUser = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: USER_QUERY_KEYS.currentUser(selectedNetwork),
    queryFn: () => userService.getCurrentUser(selectedNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(), // Only fetch if user is authenticated
  });
};

/**
 * Hook to get user by key (username/slug) with network filter
 * @param key - Username or slug identifier
 * @param network - Optional network filter for GuudScore and NFTs
 * @returns Query result with user data, loading state, and error handling
 */
export const useUserByKey = (key: string, network?: string) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.user(key, network),
    queryFn: () => userService.getUserByKey(key, network),
    enabled: !!key,
  });
};

/**
 * Hook to update current user profile
 * @returns Mutation object with mutate function, loading state, and error handling
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData: Partial<ExtendedUser>) =>
      userService.updateProfile(profileData),
    onSuccess: updatedUser => {
      // Invalidate all current user queries (for all networks)
      queryClient.invalidateQueries({
        queryKey: [...USER_QUERY_KEYS.all, 'current'],
      });

      // Update user cache if exists
      if (updatedUser.slug) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.user(updatedUser.slug),
          updatedUser
        );
      }
      if (updatedUser.username) {
        queryClient.setQueryData(
          USER_QUERY_KEYS.user(updatedUser.username),
          updatedUser
        );
      }
    },
    onError: error => {
      console.error('Failed to update profile:', error);
    },
  });
};

/**
 * Hook to invalidate user queries for cache management
 * @returns Object with functions to invalidate specific user queries
 */
export const useInvalidateUser = () => {
  const queryClient = useQueryClient();

  return {
    invalidateCurrentUser: () => {
      // Invalidate all current user queries (for all networks)
      queryClient.invalidateQueries({
        queryKey: [...USER_QUERY_KEYS.all, 'current'],
      });
    },
    invalidateUser: (key: string) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.user(key) });
    },
    invalidateAllUsers: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
    },
  };
};

/**
 * Hook to get dashboard metrics with network filter
 * @returns Query result with dashboard metrics data, loading state, and error handling
 */
export const useDashboardMetrics = (network?: string) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.dashboardMetrics(network),
    queryFn: () => userService.getDashboardMetrics(network),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to update user avatar
 * @returns Mutation object to update user avatar with avatarId, nftId
 */
export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatarData: { avatarId?: string; nftId?: string }) =>
      userService.updateAvatar(avatarData),
    onSuccess: () => {
      clearCache();

      queryClient.invalidateQueries({
        queryKey: [...USER_QUERY_KEYS.all, 'current'],
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

      toast.success('Avatar updated successfully');
    },
    onError: error => {
      console.error('Failed to update avatar:', error);
      toast.error('Failed to update avatar');
    },
  });
};

/**
 * Hook to update user profile (specific endpoint)
 * @returns Mutation object to update user profile with various profile fields
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData: {
      name?: string;
      title?: string;
      bio?: string;
      themeId?: string;
      fontId?: string;
      isPublicNft?: boolean;
      slug?: string;
      searchVisibility?: boolean;
      displayBadges?: boolean;
      displayGuudScore?: boolean;
      isSynced?: boolean;
      profileVisibility?: {
        showTwitterStats?: boolean;
        showPortfolio?: boolean;
        showFriends?: boolean;
        showSocialLinks?: boolean;
        showConnectedPlatforms?: boolean;
      };
    }) => userService.updateUserProfile(profileData),
    onSuccess: (updatedUser, variables) => {
      // Invalidate all current user queries (for all networks)
      queryClient.invalidateQueries({
        queryKey: [...USER_QUERY_KEYS.all, 'current'],
      });

      if (updatedUser && typeof updatedUser === 'object') {
        if (updatedUser.slug) {
          queryClient.setQueryData(
            USER_QUERY_KEYS.user(updatedUser.slug),
            updatedUser
          );
        }
        if (updatedUser.username) {
          queryClient.setQueryData(
            USER_QUERY_KEYS.user(updatedUser.username),
            updatedUser
          );
        }
      }

      if (variables.slug) {
        queryClient.invalidateQueries({
          queryKey: USER_QUERY_KEYS.user(variables.slug),
        });
      }
    },
    onError: error => {
      console.error('Failed to update user profile:', error);
    },
  });
};

/**
 * Hook to search users
 * @param params - Search parameters
 * @param params.query - Search query string
 * @param params.page - Page number for pagination
 * @param params.limit - Number of results per page
 * @param enabled - Whether the query should be enabled (default: true)
 * @returns Query result with search results, loading state, and error handling
 */
export const useSearchUsers = (
  params: UserSearchParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.search(params),
    queryFn: () => userService.searchUsers(params),
    enabled: enabled && !!params.query && params.query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get current user's social links
 * @returns Array of user's social links or empty array
 */
export const useCurrentUserSocial = () => {
  const { data: currentUser } = useCurrentUser();
  return currentUser?.social || [];
};

/**
 * Hook to get current user's custom links
 * @returns Array of user's custom links or empty array
 */
export const useCurrentUserCustomLinks = () => {
  const { data: currentUser } = useCurrentUser();
  return currentUser?.custom || [];
};

/**
 * Hook to get current user's wallet list
 * @returns Array of user's wallets or empty array
 */
export const useWalletList = () => {
  const { data: currentUser } = useCurrentUser();
  return currentUser?.wallets || [];
};

/**
 * Hook to create a new social link
 * @returns Mutation object to create social link
 */
export const useCreateSocialLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { platform: string; url: string; isPublic?: boolean }) =>
      userService.createSocialLink(data),
    onSuccess: updatedUser => {
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser(), updatedUser);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success('Social link added successfully!');
    },
    onError: error => {
      console.error('Failed to create social link:', error);
      toast.error(error.message || 'Failed to create social link');
    },
  });
};

/**
 * Hook to update a social link
 * @returns Mutation object to update social link with id, platform, url, and isPublic
 */
export const useUpdateSocialLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      platform?: string;
      url?: string;
      isPublic?: boolean;
    }) => userService.updateSocialLink(data),
    onSuccess: updatedUser => {
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser(), updatedUser);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success('Social link updated successfully!');
    },
    onError: error => {
      console.error('Failed to update social link:', error);
      toast.error(error.message || 'Failed to update social link');
    },
  });
};

/**
 * Hook to create a new custom link
 * @returns Mutation object to create custom link
 */
export const useCreateCustomLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      url: string;
      color?: string;
      isPublic?: boolean;
    }) => userService.createCustomLink(data),
    onSuccess: updatedUser => {
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser(), updatedUser);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success('Custom link added successfully!');
    },
    onError: error => {
      console.error('Failed to create custom link:', error);
      toast.error(error.message || 'Failed to create custom link');
    },
  });
};

/**
 * Hook to update a custom link
 * @returns Mutation object to update custom link with id, name, url, color, and isPublic
 */
export const useUpdateCustomLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      name?: string;
      url?: string;
      color?: string;
      isPublic?: boolean;
    }) => userService.updateCustomLink(data),
    onSuccess: updatedUser => {
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser(), updatedUser);
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success('Custom link updated successfully!');
    },
    onError: error => {
      console.error('Failed to update custom link:', error);
      toast.error(error.message || 'Failed to update custom link');
    },
  });
};

/**
 * Hook to delete a social link
 * @returns Mutation object to delete social link by id
 */
export const useDeleteSocialLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.deleteSocialLink(id),
    onSuccess: updatedUser => {
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser(), updatedUser);

      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });

      // Show success toast
      toast.success('Social link deleted successfully!');
    },
    onError: error => {
      console.error('Failed to delete social link:', error);
      toast.error(error.message || 'Failed to delete social link');
    },
  });
};

/**
 * Hook to delete a custom link
 * @returns Mutation object to delete custom link by id
 */
export const useDeleteCustomLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.deleteCustomLink(id),
    onSuccess: updatedUser => {
      queryClient.setQueryData(USER_QUERY_KEYS.currentUser(), updatedUser);

      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });

      // Show success toast
      toast.success('Custom link deleted successfully!');
    },
    onError: error => {
      console.error('Failed to delete custom link:', error);
      toast.error(error.message || 'Failed to delete custom link');
    },
  });
};

/**
 * Hook to update badge selection with network support
 * @returns Mutation object to update badge selection (max 3)
 */
export const useUpdateBadgeSelection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      selectedBadges: Array<{
        id: string;
        type: 'poap' | 'nft';
        priority: number;
      }>;
      allBadges?: Array<{
        id: string;
        type: 'poap' | 'nft';
        priority: number;
        isVisible: boolean;
      }>;
      network?: string;
    }) => userService.updateBadgeSelection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.currentUser(),
      });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      toast.success('Badge selection updated successfully!');
    },
    onError: error => {
      console.error('Failed to update badge selection:', error);
      toast.error(error.message || 'Failed to update badge selection');
    },
  });
};
