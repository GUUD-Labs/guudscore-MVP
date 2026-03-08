import { useQuery } from '@tanstack/react-query';

import { useChain } from '@/contexts/chain-context';
import { guudscoreService } from '@/services';
import type { AssetsData, LeaderboardParams } from '@/types';

import { tokenStorage } from './use-auth';

// Query keys
export const GUUD_SCORE_QUERY_KEYS = {
  all: ['guudscore'] as const,
  leaderboard: (params: LeaderboardParams = {}) =>
    [...GUUD_SCORE_QUERY_KEYS.all, 'leaderboard', params] as const,
  arenaLeaderboard: (params: { page?: number; limit?: number } = {}) =>
    [...GUUD_SCORE_QUERY_KEYS.all, 'arena-leaderboard', params] as const,
  guudScoreHistory: (network?: string) =>
    [...GUUD_SCORE_QUERY_KEYS.all, 'guudScoreHistory', network] as const,
  assets: (network?: string) => [...GUUD_SCORE_QUERY_KEYS.all, 'assets', network] as const,
  completeProfile: (network?: string) => [...GUUD_SCORE_QUERY_KEYS.all, 'complete-profile', network] as const,
  protocols: (network?: string) => [...GUUD_SCORE_QUERY_KEYS.all, 'protocols', network] as const,
};

/**
 * Hook to get leaderboard data with pagination and network filter
 * @param params - Leaderboard parameters
 * @param params.page - Page number for pagination (optional)
 * @param params.limit - Number of items per page (optional)
 * @returns Query result with leaderboard data, pagination info, loading state, and error handling
 */
export const useLeaderboard = (params: LeaderboardParams = {}) => {
  const { selectedNetwork } = useChain();
  const paramsWithNetwork = { ...params, network: params.network || selectedNetwork };
  
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.leaderboard(paramsWithNetwork),
    queryFn: () => guudscoreService.getLeaderboard(paramsWithNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000, // 5 minutes - leaderboard doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get Arena Yapping leaderboard (dedicated endpoint)
 */
export const useArenaLeaderboard = (params: { page?: number; limit?: number } = {}) => {
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.arenaLeaderboard(params),
    queryFn: () => guudscoreService.getArenaLeaderboard(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get current user's GuudScore history with network filter
 * @returns Query result with score history data, loading state, and error handling
 */
export const useGuudScoreHistory = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.guudScoreHistory(selectedNetwork),
    queryFn: () => guudscoreService.getGuudScoreHistory(selectedNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get user's assets with network filter
 * @returns Query result with user's assets data, loading state, and error handling
 */
export const useAssets = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.assets(selectedNetwork),
    queryFn: () => guudscoreService.getAssets(selectedNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 15 * 60 * 1000, // 15 minutes - assets change slowly
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for token holdings specifically with network filter
 * @returns Query result with user's token holdings data, loading state, and error handling
 */
export const useTokenHoldings = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.assets(selectedNetwork),
    queryFn: () => guudscoreService.getAssets(selectedNetwork),
    select: (data: AssetsData) => data.tokenHoldings,
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook for asset history specifically with network filter
 * @returns Query result with user's asset history data, loading state, and error handling
 */
export const useAssetHistory = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.assets(selectedNetwork),
    queryFn: () => guudscoreService.getAssets(selectedNetwork),
    select: (data: AssetsData) => data.historyData,
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get user's complete profile with network filter
 * @returns Query result with user's complete profile data, loading state, and error handling
 */
export const useCompleteProfile = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.completeProfile(selectedNetwork),
    queryFn: () => guudscoreService.getCompleteProfile(selectedNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to get user's protocol interactions with network filter
 * @returns Query result with user's protocol data, loading state, and error handling
 */
export const useProtocols = () => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: GUUD_SCORE_QUERY_KEYS.protocols(selectedNetwork),
    queryFn: () => guudscoreService.getProtocols(selectedNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
