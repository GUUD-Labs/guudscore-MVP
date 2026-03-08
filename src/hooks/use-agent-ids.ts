import { useQuery } from '@tanstack/react-query';
import { agentService } from '@/services';
import { tokenStorage } from './use-auth';
import { AGENT_QUERY_KEYS } from './use-agent';

/**
 * Fetches all agent user IDs and provides a lookup set.
 * Used globally to identify agent users across the app.
 */
export const useAgentIds = () => {
  const { data } = useQuery({
    queryKey: [...AGENT_QUERY_KEYS.all, 'all-ids'] as const,
    queryFn: async () => {
      // Fetch a large page to get all agents
      const result = await agentService.getAgentLeaderboard({ page: 1, limit: 500 });
      return new Set(result.leaderboard.map(entry => entry.user.id));
    },
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return data ?? new Set<string>();
};
