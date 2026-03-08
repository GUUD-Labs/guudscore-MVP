import { secureTokenStore } from '@/lib/token-store';
import type {
    NetworkType,
    Season,
    SeasonBadge,
    SeasonBadgeStatsResponse,
    SeasonLeaderboardParams,
    SeasonLeaderboardResponse,
    SeasonListParams,
    SeasonListResponse,
    SeasonSnapshot,
    SeasonStatus,
    UserSeasonHistoryResponse,
} from '@/types';

import { apiService } from './api';

class SeasonService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Get all seasons with pagination and filters
   */
  async getSeasons(params: SeasonListParams = {}): Promise<SeasonListResponse> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.network) queryParams.append('network', params.network);

    const queryString = queryParams.toString();
    const endpoint = `/seasons${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<SeasonListResponse>(endpoint);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch seasons');
    }
    return response.data!;
  }

  /**
   * Get current active seasons (one per network)
   */
  async getCurrentSeasons(network?: NetworkType): Promise<Season[]> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);

    const queryString = queryParams.toString();
    const endpoint = `/seasons/current${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<Season | Season[]>(endpoint);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch current seasons');
    }
    
    // API might return single season or array
    const data = response.data!;
    return Array.isArray(data) ? data : [data];
  }

  /**
   * Get season details by ID
   */
  async getSeasonById(seasonId: string): Promise<{
    season: Season;
    stats: {
      totalUsers: number;
      snapshotCompleted: number;
      badgesAwarded: number;
      averageScore: number;
      tierDistribution: Record<string, number>;
    };
  }> {
    this.setAuthHeaders();

    const response = await apiService.get<{
      season: Season;
      stats: {
        totalUsers: number;
        snapshotCompleted: number;
        badgesAwarded: number;
        averageScore: number;
        tierDistribution: Record<string, number>;
      };
    }>(`/seasons/${seasonId}`);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch season details');
    }
    return response.data!;
  }

  /**
   * Get season leaderboard
   */
  async getSeasonLeaderboard(params: SeasonLeaderboardParams): Promise<SeasonLeaderboardResponse> {
    this.setAuthHeaders();

    const { seasonId, ...queryParams } = params;
    const searchParams = new URLSearchParams();
    if (queryParams.page !== undefined) searchParams.append('page', queryParams.page.toString());
    if (queryParams.limit !== undefined) searchParams.append('limit', queryParams.limit.toString());
    if (queryParams.tier) searchParams.append('tier', queryParams.tier);

    const queryString = searchParams.toString();
    const endpoint = `/seasons/${seasonId}/leaderboard${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<SeasonLeaderboardResponse>(endpoint);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch season leaderboard');
    }
    return response.data!;
  }

  /**
   * Get user's snapshot for a specific season
   */
  async getUserSeasonSnapshot(seasonId: string, userId: string): Promise<SeasonSnapshot> {
    this.setAuthHeaders();

    const response = await apiService.get<SeasonSnapshot>(`/seasons/${seasonId}/users/${userId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch user season snapshot');
    }
    return response.data!;
  }

  /**
   * Get user's rank in a season
   */
  async getUserSeasonRank(seasonId: string, userId: string): Promise<{ rank: number; totalUsers: number }> {
    this.setAuthHeaders();

    const response = await apiService.get<{ rank: number; totalUsers: number }>(`/seasons/${seasonId}/users/${userId}/rank`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch user rank');
    }
    return response.data!;
  }

  /**
   * Get badge statistics for a season
   */
  async getSeasonBadgeStats(seasonId: string): Promise<SeasonBadgeStatsResponse> {
    this.setAuthHeaders();

    const response = await apiService.get<SeasonBadgeStatsResponse>(`/seasons/${seasonId}/badge-stats`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch badge stats');
    }
    return response.data!;
  }

  /**
   * Get user's season history (all seasons user participated in)
   */
  async getUserSeasonHistory(
    userId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<UserSeasonHistoryResponse> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/seasons/users/${userId}/history${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<UserSeasonHistoryResponse>(endpoint);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch user season history');
    }
    return response.data!;
  }

  /**
   * Get user's seasonal badges
   */
  async getUserSeasonalBadges(
    userId: string,
    params: { network?: NetworkType; status?: SeasonStatus } = {}
  ): Promise<SeasonBadge[]> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (params.network) queryParams.append('network', params.network);
    if (params.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/seasons/users/${userId}/badges${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<SeasonBadge[]>(endpoint);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch user seasonal badges');
    }
    return response.data!;
  }

  /**
   * Get current user's seasonal badges
   */
  async getMySeasonalBadges(params: { network?: NetworkType } = {}): Promise<SeasonBadge[]> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (params.network) queryParams.append('network', params.network);

    const queryString = queryParams.toString();
    const endpoint = `/seasons/me/badges${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<SeasonBadge[]>(endpoint);
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch my seasonal badges');
    }
    return response.data!;
  }
}

export const seasonService = new SeasonService();
