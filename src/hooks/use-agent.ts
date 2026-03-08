import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChain } from '@/contexts/chain-context';
import { agentService } from '@/services';
import type { AgentLeaderboardParams } from '@/types';
import { tokenStorage } from './use-auth';

export const AGENT_QUERY_KEYS = {
  all: ['agent'] as const,
  leaderboard: (params: AgentLeaderboardParams = {}) =>
    [...AGENT_QUERY_KEYS.all, 'leaderboard', params] as const,
  profile: (agentId: string, network?: string) =>
    [...AGENT_QUERY_KEYS.all, 'profile', agentId, network] as const,
};

/**
 * Hook: Agent Leaderboard (ayrı endpoint, sadece agent'ler)
 */
export const useAgentLeaderboard = (params: AgentLeaderboardParams = {}) => {
  const { selectedNetwork } = useChain();
  const paramsWithNetwork = { ...params, network: params.network || selectedNetwork };

  return useQuery({
    queryKey: AGENT_QUERY_KEYS.leaderboard(paramsWithNetwork),
    queryFn: () => agentService.getAgentLeaderboard(paramsWithNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook: Agent olarak kayıt ol (mutation)
 */
export const useRegisterAsAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => agentService.registerAsAgent(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.all });
    },
  });
};

/**
 * Hook: Agent Profile detayı
 */
export const useAgentProfile = (agentId: string, network?: string) => {
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.profile(agentId, network),
    queryFn: () => agentService.getAgentProfile(agentId, network),
    enabled: !!agentId && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
