/**
 * Bribe Service
 * Handles all bribe-related API calls
 */

import type {
    BribeableUser,
    BribeHistoryParams,
    BribeHistoryResponse,
    BribeNetwork,
    BribeRecord,
    BribeStats,
    BribeUsersFilter,
    BribeWalletSettings,
    BribeWalletType,
    RecordBribeRequest,
    SetBribeWalletRequest,
} from '@/types/bribe';

import { secureTokenStore } from '@/lib/token-store';
import { apiService } from './api';

// Helper to handle both wrapped and unwrapped API responses
function unwrapResponse<T>(response: any): T {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return response.data as T;
  }
  return response as T;
}

class BribeService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Get current user's bribe wallet settings
   */
  async getWalletSettings(): Promise<BribeWalletSettings> {
    this.setAuthHeaders();
    const response = await apiService.get<BribeWalletSettings>('/user/bribe/wallet');
    return unwrapResponse<BribeWalletSettings>(response);
  }

  /**
   * Set bribe wallet
   */
  async setWallet(request: SetBribeWalletRequest): Promise<BribeWalletSettings> {
    this.setAuthHeaders();
    const response = await apiService.put<BribeWalletSettings>('/user/bribe/wallet', request);
    return unwrapResponse<BribeWalletSettings>(response);
  }

  /**
   * Remove bribe wallet
   */
  async removeWallet(type: BribeWalletType): Promise<BribeWalletSettings> {
    this.setAuthHeaders();
    const response = await apiService.delete<BribeWalletSettings>(`/user/bribe/wallet?type=${type}`);
    return unwrapResponse<BribeWalletSettings>(response);
  }

  /**
   * Get bribeable users (users who have enabled bribe receiving)
   * @param network - Network to filter by
   * @param filter - Leaderboard filter (top10, top50, top100, top500)
   * @param nftContract - NFT collection contract address filter
   */
  async getBribeableUsers(
    network: BribeNetwork = 'AVAX',
    filter?: BribeUsersFilter,
    nftContract?: string
  ): Promise<BribeableUser[]> {
    this.setAuthHeaders();
    
    const queryParams = new URLSearchParams();
    queryParams.append('network', network);
    // filter and nftContract are mutually exclusive
    if (nftContract) {
      queryParams.append('nftContract', nftContract);
    } else if (filter) {
      queryParams.append('filter', filter);
    }
    
    const response = await apiService.get<BribeableUser[]>(
      `/user/bribe/users?${queryParams.toString()}`
    );
    return unwrapResponse<BribeableUser[]>(response);
  }

  /**
   * Record a bribe transaction
   */
  async recordBribe(request: RecordBribeRequest): Promise<BribeRecord> {
    this.setAuthHeaders();
    const response = await apiService.post<BribeRecord>('/user/bribe/record', request);
    return unwrapResponse<BribeRecord>(response);
  }

  /**
   * Get bribe history
   */
  async getHistory(params: BribeHistoryParams = {}): Promise<BribeHistoryResponse> {
    this.setAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.network) queryParams.append('network', params.network);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/user/bribe/history${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get<BribeHistoryResponse>(endpoint);
    const data = unwrapResponse<any>(response);
    
    // Handle both array and object responses
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
      };
    }
    
    return data;
  }

  /**
   * Get bribe stats for current user
   */
  async getStats(): Promise<BribeStats> {
    this.setAuthHeaders();
    const response = await apiService.get<BribeStats>('/user/bribe/stats');
    return unwrapResponse<BribeStats>(response);
  }

  /**
   * Check if a user is bribeable for a specific network
   */
  async checkUserBribeable(userId: string, network: BribeNetwork): Promise<{
    bribeable: boolean;
    wallet: string | null;
  }> {
    this.setAuthHeaders();
    const response = await apiService.get<{ bribeable: boolean; wallet: string | null }>(
      `/user/bribe/check/${userId}?network=${network}`
    );
    return unwrapResponse<{ bribeable: boolean; wallet: string | null }>(response);
  }
}

export const bribeService = new BribeService();
