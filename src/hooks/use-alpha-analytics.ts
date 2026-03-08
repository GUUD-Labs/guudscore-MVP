import { useQuery } from '@tanstack/react-query';

import { useChain } from '@/contexts/chain-context';
import { alphaAnalyticsService } from '@/services';

import { tokenStorage } from './use-auth';

// Query Keys
export const ALPHA_ANALYTICS_KEYS = {
  all: ['alpha-analytics'] as const,
  fullAnalytics: (network?: string) => [...ALPHA_ANALYTICS_KEYS.all, 'full-analytics', network] as const,
  badges: () => [...ALPHA_ANALYTICS_KEYS.all, 'badges'] as const,
  scoreDistribution: (badgeId: string, network?: string) => [...ALPHA_ANALYTICS_KEYS.all, 'score-distribution', badgeId, network] as const,
} as const;

/**
 * Hook to fetch full analytics data with network filter
 * @returns Query result with full analytics data, loading state, and error handling
 */
export const useFullAnalytics = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: ALPHA_ANALYTICS_KEYS.fullAnalytics(selectedNetwork),
    queryFn: () => alphaAnalyticsService.getFullAnalytics(selectedNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000, // 5 minutes to see changes faster
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: true, // Refetch when tab is focused to get fresh data
    refetchOnMount: true, // Refetch on component mount to ensure fresh data
  });
};

/**
 * Hook to fetch available badges/seasons for filtering
 */
export const useAvailableBadges = () => {
  return useQuery({
    queryKey: ALPHA_ANALYTICS_KEYS.badges(),
    queryFn: () => alphaAnalyticsService.getAvailableBadges(),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 30 * 60 * 1000, // 30 minutes - badges don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
};

/**
 * Hook to fetch score distribution for a specific badge/season
 */
export const useScoreDistributionByBadge = (badgeId: string | null) => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: ALPHA_ANALYTICS_KEYS.scoreDistribution(badgeId || '', selectedNetwork),
    queryFn: () => alphaAnalyticsService.getScoreDistributionByBadge(badgeId!, selectedNetwork),
    enabled: !!badgeId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};
