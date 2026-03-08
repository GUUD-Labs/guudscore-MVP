import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';

import {
    arenaService,
    type ArenaConnectionStatus,
    type ArenaConnectStatusResponse,
    type ArenaMonthlyHistoryResponse,
    type ArenaProgress,
    type ArenaStats,
} from '@/services/arena';

export const ARENA_QUERY_KEYS = {
  status: ['arena', 'status'] as const,
  connectionStatus: ['arena', 'connection'] as const,
  stats: ['arena', 'stats'] as const,
  progress: ['arena', 'progress'] as const,
  monthlyHistory: ['arena', 'monthly-history'] as const,
};

/**
 * Hook to get Arena connection status (legacy OAuth)
 */
export function useArenaStatus() {
  const query = useQuery<ArenaConnectStatusResponse>({
    queryKey: ARENA_QUERY_KEYS.status,
    queryFn: () => arenaService.getStatus(),
    staleTime: 30 * 1000,
    retry: 1,
  });

  return query;
}

/**
 * Hook to handle Arena callback params and refetch status
 */
export function useArenaCallback() {
  const queryClient = useQueryClient();

  let arenaParam: string | undefined;
  try {
    const search = useSearch({ strict: false }) as { arena?: string };
    arenaParam = search?.arena;
  } catch {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      arenaParam = urlParams.get('arena') || undefined;
    }
  }

  useEffect(() => {
    if (arenaParam) {
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.status });

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('arena');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [arenaParam, queryClient]);

  return arenaParam;
}

/**
 * Hook to start Arena connect flow (legacy OAuth)
 */
export function useArenaConnect() {
  return useMutation({
    mutationFn: async () => {
      await arenaService.startConnect();
    },
    onError: (error) => {
      console.error('[useArenaConnect] Failed to start connect:', error);
    },
  });
}

/**
 * Hook to disconnect Arena account (legacy OAuth)
 */
export function useArenaDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => arenaService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.status });
    },
    onError: (error) => {
      console.error('[useArenaDisconnect] Failed to disconnect:', error);
    },
  });
}

// ========== New Arena Yapping System Hooks ==========

/**
 * Hook to get Arena connection status (auto-detection)
 */
export function useArenaConnectionStatus() {
  return useQuery<ArenaConnectionStatus>({
    queryKey: ARENA_QUERY_KEYS.connectionStatus,
    queryFn: () => arenaService.getConnectionStatus(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to get Arena yapping stats
 */
export function useArenaStats() {
  return useQuery<ArenaStats>({
    queryKey: ARENA_QUERY_KEYS.stats,
    queryFn: () => arenaService.getArenaStats(),
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to sync Arena connection manually
 */
export function useSyncArena() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => arenaService.syncConnection(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.connectionStatus });
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.stats });
    },
  });
}

/**
 * Hook to enable Arena yapping
 */
export function useEnableArenaYapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => arenaService.enableYapping(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.connectionStatus });
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.stats });
    },
  });
}

/**
 * Hook to disable Arena yapping
 */
export function useDisableArenaYapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => arenaService.disableYapping(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.connectionStatus });
      queryClient.invalidateQueries({ queryKey: ARENA_QUERY_KEYS.stats });
    },
  });
}

/**
 * Hook to get Arena progress data (daily/weekly/monthly, streak)
 */
export function useArenaProgress() {
  return useQuery<ArenaProgress>({
    queryKey: ARENA_QUERY_KEYS.progress,
    queryFn: () => arenaService.getProgress(),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to get Arena monthly history for charts
 */
export function useArenaMonthlyHistory(months = 6) {
  return useQuery<ArenaMonthlyHistoryResponse>({
    queryKey: [...ARENA_QUERY_KEYS.monthlyHistory, months],
    queryFn: () => arenaService.getMonthlyHistory(months),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
