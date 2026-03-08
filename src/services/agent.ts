import { secureTokenStore } from '@/lib/token-store';
import type { AgentLeaderboardData, AgentLeaderboardParams, AgentProfileData } from '@/types';
import { apiService } from './api';

class AgentService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Agent olarak kayıt ol (self-registration)
   * İdempotent — birden fazla çağrılabilir.
   */
  async registerAsAgent(): Promise<{ success: boolean; message: string; data?: { id: string; slug: string } }> {
    this.setAuthHeaders();
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data?: { id: string; slug: string };
    }>('/agent/register', {});
    return response.data;
  }

  async getAgentLeaderboard(
    params: AgentLeaderboardParams = {}
  ): Promise<AgentLeaderboardData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.tier) queryParams.append('tier', params.tier);
    if (params.activityWindow) queryParams.append('activityWindow', params.activityWindow);
    if (params.network) queryParams.append('network', params.network);

    const queryString = queryParams.toString();
    const endpoint = `/agent/leaderboard${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<{
      success: boolean;
      data: AgentLeaderboardData;
      message?: string;
    }>(endpoint);

    if (!response.success || !response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch agent leaderboard');
    }

    return response.data.data;
  }

  async getAgentProfile(
    agentId: string,
    network?: string
  ): Promise<AgentProfileData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);

    const queryString = queryParams.toString();
    const endpoint = `/agent/profile/${agentId}${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<{
      success: boolean;
      data: AgentProfileData;
      message?: string;
    }>(endpoint);

    if (!response.success || !response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch agent profile');
    }

    return response.data.data;
  }
}

export const agentService = new AgentService();
