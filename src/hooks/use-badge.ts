import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useChain } from '@/contexts/chain-context';
import { badgeService } from '@/services';
import type { BadgeListParams } from '@/types';

import { tokenStorage } from './use-auth';
import { USER_QUERY_KEYS } from './use-user';

// Query keys
export const BADGE_QUERY_KEYS = {
  all: ['badges'] as const,
  list: (params: BadgeListParams) =>
    [...BADGE_QUERY_KEYS.all, 'list', params] as const,
} as const;

/**
 * Hook to get badges list with pagination and network filter
 * @param params - Badge list parameters
 * @param params.page - Page number for pagination (optional)
 * @param params.limit - Number of items per page (optional)
 * @param params.network - Network filter (optional, defaults to selectedNetwork)
 * @returns Query result with badges list, loading state, and error handling
 */
export const useBadgesList = (params: BadgeListParams = {}) => {
  const { selectedNetwork } = useChain();
  const paramsWithNetwork = { ...params, network: params.network || selectedNetwork };
  
  return useQuery({
    queryKey: BADGE_QUERY_KEYS.list(paramsWithNetwork),
    queryFn: () => badgeService.getBadgesList(paramsWithNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to reset all featured badges for a specific network
 * @returns Mutation object to reset all featured badges
 */
export const useResetAllBadges = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (network?: string) => badgeService.resetAllFeaturedBadges(network),
    onSuccess: (_data, network) => {
      // Invalidate all user queries (all networks)
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      const networkName = network === 'SOLANA' ? 'Solana' : network === 'BASE' ? 'Base' : network === 'AVAX' ? 'Avalanche' : 'all networks';
      toast.success(`Badges reset successfully for ${networkName}!`);
    },
    onError: error => {
      console.error('Failed to reset badges:', error);
      toast.error(error.message || 'Failed to reset badges');
    },
  });
};
