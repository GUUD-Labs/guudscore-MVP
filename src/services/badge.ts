import { secureTokenStore } from '@/lib/token-store';
import type { ApiResponse, BadgeListParams, BadgeListResponse } from '@/types';

import { apiService } from './api';

class BadgeService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  async getBadgesList(
    params: BadgeListParams = {}
  ): Promise<ApiResponse<BadgeListResponse>> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.network) {
      queryParams.append('network', params.network);
    }

    const queryString = queryParams.toString();
    const endpoint = `/badges/list${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<BadgeListResponse>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch badges');
    }

    return response;
  }

  async resetAllFeaturedBadges(network?: string): Promise<ApiResponse<void>> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) {
      queryParams.append('network', network);
    }
    const queryString = queryParams.toString();
    const endpoint = `/badges/featured/all${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.delete<void>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to reset featured badges');
    }

    return response;
  }
}

export const badgeService = new BadgeService();
