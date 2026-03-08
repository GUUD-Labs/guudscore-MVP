import { useQuery } from '@tanstack/react-query';

import { useChain } from '@/contexts/chain-context';
import { seasonService } from '@/services';
import type { NetworkType, SeasonLeaderboardParams, SeasonListParams, SeasonStatus } from '@/types';

import { tokenStorage } from './use-auth';

// Query keys
export const SEASON_QUERY_KEYS = {
  all: ['seasons'] as const,
  list: (params: SeasonListParams) => [...SEASON_QUERY_KEYS.all, 'list', params] as const,
  current: (network?: NetworkType) => [...SEASON_QUERY_KEYS.all, 'current', network] as const,
  detail: (seasonId: string) => [...SEASON_QUERY_KEYS.all, 'detail', seasonId] as const,
  leaderboard: (params: SeasonLeaderboardParams) => [...SEASON_QUERY_KEYS.all, 'leaderboard', params] as const,
  userSnapshot: (seasonId: string, userId: string) => [...SEASON_QUERY_KEYS.all, 'userSnapshot', seasonId, userId] as const,
  userRank: (seasonId: string, userId: string) => [...SEASON_QUERY_KEYS.all, 'userRank', seasonId, userId] as const,
  badgeStats: (seasonId: string) => [...SEASON_QUERY_KEYS.all, 'badgeStats', seasonId] as const,
  userHistory: (userId: string, page?: number) => [...SEASON_QUERY_KEYS.all, 'userHistory', userId, page] as const,
  userBadges: (userId: string, network?: NetworkType) => [...SEASON_QUERY_KEYS.all, 'userBadges', userId, network] as const,
  myBadges: (network?: NetworkType) => [...SEASON_QUERY_KEYS.all, 'myBadges', network] as const,
} as const;

/**
 * Hook to get all seasons with pagination and filters
 */
export const useSeasons = (params: SeasonListParams = {}) => {
  const { selectedNetwork } = useChain();
  const paramsWithNetwork = { ...params, network: params.network || selectedNetwork };

  return useQuery({
    queryKey: SEASON_QUERY_KEYS.list(paramsWithNetwork),
    queryFn: () => seasonService.getSeasons(paramsWithNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get current active seasons
 */
export const useCurrentSeasons = (network?: NetworkType) => {
  return useQuery({
    queryKey: SEASON_QUERY_KEYS.current(network),
    queryFn: () => seasonService.getCurrentSeasons(network),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get season details by ID
 */
export const useSeasonDetail = (seasonId: string) => {
  return useQuery({
    queryKey: SEASON_QUERY_KEYS.detail(seasonId),
    queryFn: () => seasonService.getSeasonById(seasonId),
    enabled: !!seasonId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get season leaderboard
 */
export const useSeasonLeaderboard = (params: SeasonLeaderboardParams) => {
  return useQuery({
    queryKey: SEASON_QUERY_KEYS.leaderboard(params),
    queryFn: () => seasonService.getSeasonLeaderboard(params),
    enabled: !!params.seasonId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get user's snapshot for a specific season
 */
export const useUserSeasonSnapshot = (seasonId: string, userId: string) => {
  return useQuery({
    queryKey: SEASON_QUERY_KEYS.userSnapshot(seasonId, userId),
    queryFn: () => seasonService.getUserSeasonSnapshot(seasonId, userId),
    enabled: !!seasonId && !!userId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get user's rank in a season
 */
export const useUserSeasonRank = (seasonId: string, userId: string) => {
  return useQuery({
    queryKey: SEASON_QUERY_KEYS.userRank(seasonId, userId),
    queryFn: () => seasonService.getUserSeasonRank(seasonId, userId),
    enabled: !!seasonId && !!userId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get badge statistics for a season
 */
export const useSeasonBadgeStats = (seasonId: string) => {
  return useQuery({
    queryKey: SEASON_QUERY_KEYS.badgeStats(seasonId),
    queryFn: () => seasonService.getSeasonBadgeStats(seasonId),
    enabled: !!seasonId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get user's season history
 */
export const useUserSeasonHistory = (userId: string, params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: SEASON_QUERY_KEYS.userHistory(userId, params.page),
    queryFn: () => seasonService.getUserSeasonHistory(userId, params),
    enabled: !!userId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get user's seasonal badges
 */
export const useUserSeasonalBadges = (
  userId: string,
  params: { network?: NetworkType; status?: SeasonStatus } = {}
) => {
  const { selectedNetwork } = useChain();
  const networkToUse = params.network || selectedNetwork;

  return useQuery({
    queryKey: SEASON_QUERY_KEYS.userBadges(userId, networkToUse),
    queryFn: () => seasonService.getUserSeasonalBadges(userId, { ...params, network: networkToUse }),
    enabled: !!userId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get current user's seasonal badges
 */
export const useMySeasonalBadges = (params: { network?: NetworkType } = {}) => {
  const { selectedNetwork } = useChain();
  const networkToUse = params.network || selectedNetwork;

  return useQuery({
    queryKey: SEASON_QUERY_KEYS.myBadges(networkToUse),
    queryFn: () => seasonService.getMySeasonalBadges({ network: networkToUse }),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Utility: Get current quarter and year
 */
export const getCurrentQuarterInfo = (): { quarter: 1 | 2 | 3 | 4; year: number } => {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  
  let quarter: 1 | 2 | 3 | 4;
  if (month < 3) quarter = 1;
  else if (month < 6) quarter = 2;
  else if (month < 9) quarter = 3;
  else quarter = 4;

  return { quarter, year };
};

/**
 * Utility: Get quarter end date
 */
export const getQuarterEndDate = (quarter: 1 | 2 | 3 | 4, year: number): Date => {
  switch (quarter) {
    case 1:
      return new Date(year, 2, 31, 23, 59, 59); // March 31
    case 2:
      return new Date(year, 5, 30, 23, 59, 59); // June 30
    case 3:
      return new Date(year, 8, 30, 23, 59, 59); // September 30
    case 4:
      return new Date(year, 11, 31, 23, 59, 59); // December 31
  }
};

/**
 * Utility: Get days remaining in current quarter
 */
export const getDaysRemainingInQuarter = (): number => {
  const { quarter, year } = getCurrentQuarterInfo();
  const endDate = getQuarterEndDate(quarter, year);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Utility: Get tier from score
 */
export const getTierFromScore = (score: number, network: NetworkType): { tier: string; rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' } => {
  if (score >= 8000) {
    return { tier: 'Guudlord', rarity: 'LEGENDARY' };
  } else if (score >= 6000) {
    return { tier: 'Arena Veteran', rarity: 'EPIC' };
  } else if (score >= 4000) {
    return { tier: `${network} Maxi`, rarity: 'RARE' };
  } else if (score >= 2000) {
    return { tier: 'Paperhands', rarity: 'COMMON' };
  } else {
    return { tier: 'Tourist', rarity: 'COMMON' };
  }
};
