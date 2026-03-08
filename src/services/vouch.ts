import { secureTokenStore } from '@/lib/token-store';
import type {
    GiveVouchRequest,
    GiveVouchResponse,
    ReceivedVouchesResponse,
    RemoveVouchResponse,
    RewardsResponse,
    SeasonInfo,
    UserVouchStats,
    VouchBalance,
    VouchHistoryResponse,
} from '@/types/vouch';

import { apiService } from './api';

// Helper to handle both wrapped and unwrapped API responses
function unwrapResponse<T>(response: any): T {
  // If response has success/data wrapper, unwrap it
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return response.data as T;
  }
  // Otherwise return as-is (direct data)
  return response as T;
}

class VouchService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**d
   * Get current user's vouch balance and stats
   */
  async getBalance(): Promise<VouchBalance> {
    this.setAuthHeaders();
    const response = await apiService.get<VouchBalance>('/vouch/balance');
    return unwrapResponse<VouchBalance>(response);
  }

  /**
   * Get vouch stats for a specific user (public profile)
   */
  async getUserStats(userId: string): Promise<UserVouchStats> {
    // Auth is optional for this endpoint
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    }
    
    const response = await apiService.get<UserVouchStats>(`/vouch/stats/${userId}`);
    return unwrapResponse<UserVouchStats>(response);
  }

  /**
   * Give a vouch (like or dislike) to a user
   */
  async giveVouch(request: GiveVouchRequest): Promise<GiveVouchResponse> {
    this.setAuthHeaders();
    const response = await apiService.post<GiveVouchResponse>('/vouch/give', request);
    return unwrapResponse<GiveVouchResponse>(response);
  }

  /**
   * Remove a vouch from a user
   */
  async removeVouch(targetUserId: string): Promise<RemoveVouchResponse> {
    this.setAuthHeaders();
    const response = await apiService.delete<RemoveVouchResponse>(`/vouch/remove/${targetUserId}`);
    return unwrapResponse<RemoveVouchResponse>(response);
  }

  /**
   * Get vouch transaction history
   */
  async getHistory(params: { limit?: number; offset?: number } = {}): Promise<VouchHistoryResponse> {
    this.setAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/vouch/history${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get<VouchHistoryResponse>(endpoint);
    const data = unwrapResponse<any>(response);
    
    // Handle array response (transactions directly) vs object response
    if (Array.isArray(data)) {
      return {
        transactions: data,
        total: data.length,
        limit: params.limit || 20,
        offset: params.offset || 0,
      };
    }
    return data as VouchHistoryResponse;
  }

  /**
   * Get user's leaderboard rewards
   */
  async getRewards(network?: string): Promise<RewardsResponse> {
    this.setAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/vouch/rewards${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get<RewardsResponse>(endpoint);
    const data = unwrapResponse<any>(response);
    
    // Handle array response (rewards directly) vs object response
    if (Array.isArray(data)) {
      return {
        rewards: data,
        totalRewards: data.reduce((sum: number, r: any) => sum + (r.reward || 0), 0),
      };
    }
    return data as RewardsResponse;
  }

  /**
   * Get current season info for a network
   */
  async getSeasonInfo(network: string): Promise<SeasonInfo> {
    const response = await apiService.get<SeasonInfo>(`/vouch/season/${network}`);
    return unwrapResponse<SeasonInfo>(response);
  }

  /**
   * Get received vouches for a user (who liked/disliked them)
   */
  async getReceivedVouches(userId: string): Promise<ReceivedVouchesResponse> {
    const response = await apiService.get<ReceivedVouchesResponse>(`/vouch/received/${userId}`);
    return unwrapResponse<ReceivedVouchesResponse>(response);
  }
}

export const vouchService = new VouchService();
