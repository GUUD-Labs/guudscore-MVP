import { secureTokenStore } from '@/lib/token-store';
import type { DashboardData, ScoreData } from '@/types';

import { apiService } from './api';

export type NetworkType = 'AVAX' | 'BASE' | 'SOLANA' | 'ARBITRUM' | 'MONAD';

export interface BadgeInfo {
  id: string;
  name: string;
  year: number;
  quarter: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export class AlphaAnalyticsService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Get full analytics data from alpha endpoint
   * @param network - Optional network filter (AVAX or SOLANA)
   */
  async getFullAnalytics(network?: NetworkType): Promise<DashboardData> {
    this.setAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/alpha/full-analytics${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get<DashboardData>(endpoint);
    
    return response.data;
  }

  /**
   * Get list of available badges/seasons for filtering
   */
  async getAvailableBadges(): Promise<BadgeInfo[]> {
    this.setAuthHeaders();
    
    const response = await apiService.get<BadgeInfo[]>('/alpha/badges');
    
    return response.data;
  }

  /**
   * Get score distribution for a specific badge/season
   * @param badgeId - Badge ID (e.g., '2026-q1')
   * @param network - Optional network filter
   */
  async getScoreDistributionByBadge(badgeId: string, network?: NetworkType): Promise<ScoreData> {
    this.setAuthHeaders();
    
    const queryParams = new URLSearchParams();
    queryParams.append('badgeId', badgeId);
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/alpha/score-distribution?${queryString}`;
    
    const response = await apiService.get<ScoreData>(endpoint);
    
    return response.data;
  }
}

export const alphaAnalyticsService = new AlphaAnalyticsService();
