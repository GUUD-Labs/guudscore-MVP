import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { vouchService } from '@/services';
import type { GiveVouchRequest } from '@/types/vouch';

import { tokenStorage } from './use-auth';

// Query keys
export const VOUCH_QUERY_KEYS = {
  all: ['vouch'] as const,
  balance: () => [...VOUCH_QUERY_KEYS.all, 'balance'] as const,
  userStats: (userId: string) => [...VOUCH_QUERY_KEYS.all, 'stats', userId] as const,
  receivedVouches: (userId: string) => [...VOUCH_QUERY_KEYS.all, 'received', userId] as const,
  history: (params?: { limit?: number; offset?: number }) =>
    [...VOUCH_QUERY_KEYS.all, 'history', params] as const,
  rewards: (network?: string) => [...VOUCH_QUERY_KEYS.all, 'rewards', network] as const,
  season: (network: string) => [...VOUCH_QUERY_KEYS.all, 'season', network] as const,
};

/**
 * Hook to get current user's vouch balance
 */
export const useVouchBalance = () => {
  return useQuery({
    queryKey: VOUCH_QUERY_KEYS.balance(),
    queryFn: () => vouchService.getBalance(),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook to get vouch stats for a specific user
 */
export const useUserVouchStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: VOUCH_QUERY_KEYS.userStats(userId || ''),
    queryFn: () => vouchService.getUserStats(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook to give a vouch (like or dislike)
 */
export const useGiveVouch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GiveVouchRequest) => vouchService.giveVouch(request),
    onSuccess: (_, variables) => {
      // Invalidate balance and target user stats
      queryClient.invalidateQueries({ queryKey: VOUCH_QUERY_KEYS.balance() });
      queryClient.invalidateQueries({ queryKey: VOUCH_QUERY_KEYS.userStats(variables.targetUserId) });
      queryClient.invalidateQueries({ queryKey: VOUCH_QUERY_KEYS.history() });
    },
  });
};

/**
 * Hook to remove a vouch
 */
export const useRemoveVouch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => vouchService.removeVouch(targetUserId),
    onSuccess: (_, targetUserId) => {
      // Invalidate balance and target user stats
      queryClient.invalidateQueries({ queryKey: VOUCH_QUERY_KEYS.balance() });
      queryClient.invalidateQueries({ queryKey: VOUCH_QUERY_KEYS.userStats(targetUserId) });
      queryClient.invalidateQueries({ queryKey: VOUCH_QUERY_KEYS.history() });
    },
  });
};

/**
 * Hook to get vouch history
 */
export const useVouchHistory = (params: { limit?: number; offset?: number } = {}) => {
  return useQuery({
    queryKey: VOUCH_QUERY_KEYS.history(params),
    queryFn: () => vouchService.getHistory(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

/**
 * Hook to get leaderboard rewards
 */
export const useVouchRewards = (network?: string) => {
  return useQuery({
    queryKey: VOUCH_QUERY_KEYS.rewards(network),
    queryFn: () => vouchService.getRewards(network),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
};

/**
 * Hook to get current season info
 */
export const useSeasonInfo = (network: string) => {
  return useQuery({
    queryKey: VOUCH_QUERY_KEYS.season(network),
    queryFn: () => vouchService.getSeasonInfo(network),
    enabled: !!network,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
};

/**
 * Hook to get received vouches (who liked/disliked a user)
 */
export const useReceivedVouches = (userId: string | undefined) => {
  return useQuery({
    queryKey: VOUCH_QUERY_KEYS.receivedVouches(userId || ''),
    queryFn: () => vouchService.getReceivedVouches(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
