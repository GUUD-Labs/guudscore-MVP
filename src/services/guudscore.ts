import { secureTokenStore } from '@/lib/token-store';
import type {
    AssetsData,
    GuudScoreHistory,
    LeaderboardData,
    LeaderboardParams,
} from '@/types';

import { apiService } from './api';

export type NetworkType = 'AVAX' | 'BASE' | 'SOLANA' | 'ARBITRUM' | 'MONAD';

class GuudscoreService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  async getLeaderboard(
    params: LeaderboardParams = {}
  ): Promise<LeaderboardData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.tier) queryParams.append('tier', params.tier);
    if (params.activityWindow)
      queryParams.append('activityWindow', params.activityWindow);
    if (params.network) queryParams.append('network', params.network);
    if (params.nftCollection) queryParams.append('nftCollection', params.nftCollection);

    const queryString = queryParams.toString();
    const endpoint = `/guudscore/leaderboard${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<{
      success: boolean;
      data: LeaderboardData;
      message?: string;
    }>(endpoint);

    if (!response.success || !response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch leaderboard');
    }

    return response.data.data;
  }

  async getGuudScoreHistory(network?: NetworkType): Promise<GuudScoreHistory[]> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/guudscore/history${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<GuudScoreHistory[]>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch GuudScore history');
    }

    return response.data;
  }

  async getAssets(network?: NetworkType): Promise<AssetsData> {
    this.setAuthHeaders();

    try {
      const queryParams = new URLSearchParams();
      if (network) queryParams.append('network', network);
      
      const queryString = queryParams.toString();
      const endpoint = `/guudscore/assets${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get<any>(endpoint);

      if (!response.success) {
        throw new Error('API request failed');
      }

      // API response'da data doğrudan tokenHoldings ve historyData içeriyor

      if (!response.data) {
        throw new Error('No data in API response');
      }

      if (!response.data.tokenHoldings) {
        throw new Error('No token holdings in API response');
      }

      if (!response.data.historyData) {
        throw new Error('No history data in API response');
      }

      return response.data as AssetsData;
    } catch (error) {
      throw error;
    }
  }

  async getArenaLeaderboard(
    params: { page?: number; limit?: number } = {}
  ): Promise<LeaderboardData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/arena/leaderboard${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<LeaderboardData>(endpoint);

    if (!response.success) {
      throw new Error('Failed to fetch arena leaderboard');
    }

    return response.data;
  }

  async getCompleteProfile(network?: NetworkType): Promise<any> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/guudscore/complete-profile${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<any>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch complete profile');
    }

    return response.data;
  }

  async getProtocols(network?: NetworkType): Promise<any> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/guudscore/protocols${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<any>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch protocols');
    }

    return response.data;
  }
}

export const guudscoreService = new GuudscoreService();
