/**
 * Bribe Hook
 * React Query hooks for bribe functionality
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bribeService } from '@/services/bribe';
import type {
    BribeHistoryParams,
    BribeNetwork,
    BribeUsersFilter,
    BribeWalletType,
    RecordBribeRequest,
    SetBribeWalletRequest,
} from '@/types/bribe';

import { tokenStorage } from './use-auth';

// Query keys
export const BRIBE_QUERY_KEYS = {
  all: ['bribe'] as const,
  walletSettings: () => [...BRIBE_QUERY_KEYS.all, 'walletSettings'] as const,
  bribeableUsers: (network: BribeNetwork, filter?: BribeUsersFilter) =>
    [...BRIBE_QUERY_KEYS.all, 'users', network, filter] as const,
  bribeableUsersByNft: (network: BribeNetwork, nftContract: string) =>
    [...BRIBE_QUERY_KEYS.all, 'users', 'nft', network, nftContract] as const,
  history: (params?: BribeHistoryParams) =>
    [...BRIBE_QUERY_KEYS.all, 'history', params] as const,
  stats: () => [...BRIBE_QUERY_KEYS.all, 'stats'] as const,
  userBribeable: (userId: string, network: BribeNetwork) =>
    [...BRIBE_QUERY_KEYS.all, 'check', userId, network] as const,
};

/**
 * Hook to get current user's bribe wallet settings
 */
export const useBribeWalletSettings = () => {
  return useQuery({
    queryKey: BRIBE_QUERY_KEYS.walletSettings(),
    queryFn: () => bribeService.getWalletSettings(),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
};

/**
 * Hook to set bribe wallet
 */
export const useSetBribeWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SetBribeWalletRequest) => bribeService.setWallet(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRIBE_QUERY_KEYS.walletSettings() });
    },
  });
};

/**
 * Hook to remove bribe wallet
 */
export const useRemoveBribeWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type: BribeWalletType) => bribeService.removeWallet(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRIBE_QUERY_KEYS.walletSettings() });
    },
  });
};

/**
 * Hook to get bribeable users
 */
export const useBribeableUsers = (network: BribeNetwork, filter?: BribeUsersFilter) => {
  return useQuery({
    queryKey: BRIBE_QUERY_KEYS.bribeableUsers(network, filter),
    queryFn: () => bribeService.getBribeableUsers(network, filter),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook to get bribeable users by NFT collection
 */
export const useBribeableUsersByNft = (network: BribeNetwork, nftContract?: string) => {
  return useQuery({
    queryKey: BRIBE_QUERY_KEYS.bribeableUsersByNft(network, nftContract || ''),
    queryFn: () => bribeService.getBribeableUsers(network, undefined, nftContract),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired() && !!nftContract && nftContract !== 'all',
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook to record a bribe transaction
 */
export const useRecordBribe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RecordBribeRequest) => bribeService.recordBribe(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRIBE_QUERY_KEYS.history() });
      queryClient.invalidateQueries({ queryKey: BRIBE_QUERY_KEYS.stats() });
    },
  });
};

/**
 * Hook to get bribe history
 */
export const useBribeHistory = (params: BribeHistoryParams = {}) => {
  return useQuery({
    queryKey: BRIBE_QUERY_KEYS.history(params),
    queryFn: () => bribeService.getHistory(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

/**
 * Hook to get bribe stats
 */
export const useBribeStats = () => {
  return useQuery({
    queryKey: BRIBE_QUERY_KEYS.stats(),
    queryFn: () => bribeService.getStats(),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
};

/**
 * Hook to check if a user is bribeable
 */
export const useUserBribeable = (userId: string | undefined, network: BribeNetwork) => {
  return useQuery({
    queryKey: BRIBE_QUERY_KEYS.userBribeable(userId || '', network),
    queryFn: () => bribeService.checkUserBribeable(userId!, network),
    enabled: !!userId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
};
