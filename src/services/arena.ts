import { secureTokenStore } from '@/lib/token-store';
import { apiService } from './api';

// Arena connect status types (legacy OAuth)
export type ArenaStatus = 'connected' | 'invalid' | 'revoked' | 'none';

export interface ArenaConnectStartResponse {
  url: string;
}

export interface ArenaConnectStatusResponse {
  connected: boolean;
  status: ArenaStatus;
  arenaHandle?: string;
  arenaUserId?: string;
  lastConnectedAt?: string;
}

export interface ArenaDisconnectResponse {
  success: boolean;
  message?: string;
}

// New Arena Yapping system types
export interface ArenaConnectionStatus {
  found: boolean;
  status: 'ACTIVE' | 'NOT_FOUND';
  matchedBy?: 'twitter' | 'wallet';
  matchedIdentifier?: string;
  arenaUserId?: string;
  arenaHandle?: string;
  arenaAddress?: string;
  isEnabled?: boolean;
  arenaProfile?: {
    userName: string;
    profilePicture?: string;
    bio?: string;
    threadCount: number;
    followerCount: number;
    followingsCount: number;
    twitterFollowers?: number;
  };
  lastSyncedAt?: string;
}

export interface ArenaStats {
  connected: boolean;
  totalThreadsMatched: number;
  totalPointsEarned: number;
  todayThreadsMatched: number;
  todayPointsEarned: number;
  remainingDailySlots: number;
}

export interface ArenaSyncResponse {
  success: boolean;
  message: string;
  connection?: ArenaConnectionStatus;
}

export interface ArenaToggleResponse {
  success: boolean;
  message?: string;
}

export interface ArenaProgress {
  daily: {
    date: string;
    threadsMatched: number;
    pointsEarned: number;
    remainingSlots: number;
    dailyLimit: number;
    limitReached: boolean;
  };
  weekly: {
    weekStart: string;
    weekEnd: string;
    threadsMatched: number;
    pointsEarned: number;
    activeDays: number;
    avgPointsPerDay: number;
  };
  monthly: {
    month: string;
    threadsMatched: number;
    pointsEarned: number;
    activeDays: number;
    bestDay: string;
    bestDayPoints: number;
  };
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
  totalThreadsMatched: number;
  totalPointsEarned: number;
  firstThreadDate: string;
  daysSinceStart: number;
}

export interface ArenaMonthlyHistoryEntry {
  month: string;
  threadsMatched: number;
  pointsEarned: number;
  activeDays: number;
}

export interface ArenaMonthlyHistoryResponse {
  months: ArenaMonthlyHistoryEntry[];
}

class ArenaService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Get the Arena connect URL to redirect the user (legacy OAuth)
   */
  async getConnectUrl(): Promise<ArenaConnectStartResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.get<ArenaConnectStartResponse>(
        '/arena/connect/start'
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to get Arena connect URL');
      }

      return response.data;
    } catch (error) {
      console.error('[ArenaService] Failed to get connect URL:', error);
      throw error;
    }
  }

  /**
   * Get the current Arena connection status (legacy OAuth)
   */
  async getStatus(): Promise<ArenaConnectStatusResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.get<ArenaConnectStatusResponse>(
        '/arena/connect/status'
      );

      if (!response.success) {
        throw new Error('Failed to get Arena connection status');
      }

      return response.data || {
        connected: false,
        status: 'none' as ArenaStatus,
      };
    } catch (error) {
      console.error('[ArenaService] Failed to get status:', error);
      throw error;
    }
  }

  /**
   * Disconnect Arena account (legacy OAuth)
   */
  async disconnect(): Promise<ArenaDisconnectResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.post<ArenaDisconnectResponse>(
        '/arena/connect/disconnect'
      );

      if (!response.success) {
        throw new Error('Failed to disconnect Arena account');
      }

      return response.data || { success: true };
    } catch (error) {
      console.error('[ArenaService] Failed to disconnect:', error);
      throw error;
    }
  }

  /**
   * Redirect user to Arena connect flow (legacy OAuth)
   */
  async startConnect(): Promise<void> {
    const { url } = await this.getConnectUrl();
    window.location.href = url;
  }

  // ========== New Arena Yapping System ==========

  /**
   * Get Arena connection status (auto-detection via Twitter/wallet)
   */
  async getConnectionStatus(): Promise<ArenaConnectionStatus> {
    this.setAuthHeaders();

    try {
      const response = await apiService.get<ArenaConnectionStatus>(
        '/arena/connection/status'
      );

      if (response.data) {
        return response.data;
      }

      // Backend may return connection fields at top level
      const raw = response as any;
      if (raw.found !== undefined) {
        return raw as ArenaConnectionStatus;
      }

      return {
        found: false,
        status: 'NOT_FOUND' as const,
      };
    } catch (error) {
      console.error('[ArenaService] Failed to get connection status:', error);
      throw error;
    }
  }

  /**
   * Sync Arena connection (manual refresh)
   */
  async syncConnection(): Promise<ArenaSyncResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.post<ArenaSyncResponse>(
        '/arena/connection/sync'
      );

      // Backend may return data nested in response.data or directly in response
      if (response.data) {
        return response.data;
      }

      // Fallback: use the top-level response fields
      return {
        success: response.success,
        message: response.message || (response.success ? 'Arena account synced successfully' : 'Failed to sync'),
      };
    } catch (error) {
      console.error('[ArenaService] Failed to sync connection:', error);
      throw error;
    }
  }

  /**
   * Enable Arena yapping
   */
  async enableYapping(): Promise<ArenaToggleResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.post<ArenaToggleResponse>(
        '/arena/yapping/enable'
      );

      if (response.data) {
        return response.data;
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error('[ArenaService] Failed to enable yapping:', error);
      throw error;
    }
  }

  /**
   * Disable Arena yapping
   */
  async disableYapping(): Promise<ArenaToggleResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.post<ArenaToggleResponse>(
        '/arena/yapping/disable'
      );

      if (response.data) {
        return response.data;
      }

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error('[ArenaService] Failed to disable yapping:', error);
      throw error;
    }
  }

  /**
   * Get Arena progress data (daily/weekly/monthly charts, streak)
   */
  async getProgress(): Promise<ArenaProgress> {
    this.setAuthHeaders();

    try {
      const response = await apiService.get<ArenaProgress>(
        '/arena/progress'
      );

      if (response.data) {
        return response.data;
      }

      const raw = response as any;
      if (raw.daily !== undefined) {
        return raw as ArenaProgress;
      }

      return {
        daily: { date: '', threadsMatched: 0, pointsEarned: 0, remainingSlots: 5, dailyLimit: 5, limitReached: false },
        weekly: { weekStart: '', weekEnd: '', threadsMatched: 0, pointsEarned: 0, activeDays: 0, avgPointsPerDay: 0 },
        monthly: { month: '', threadsMatched: 0, pointsEarned: 0, activeDays: 0, bestDay: '', bestDayPoints: 0 },
        streak: { current: 0, longest: 0, lastActiveDate: '' },
        totalThreadsMatched: 0,
        totalPointsEarned: 0,
        firstThreadDate: '',
        daysSinceStart: 0,
      };
    } catch (error) {
      console.error('[ArenaService] Failed to get progress:', error);
      throw error;
    }
  }

  /**
   * Get monthly history for charts
   */
  async getMonthlyHistory(months = 6): Promise<ArenaMonthlyHistoryResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.get<ArenaMonthlyHistoryResponse>(
        `/arena/history/monthly?months=${months}`
      );

      if (response.data) {
        return response.data;
      }

      const raw = response as any;
      if (raw.months !== undefined) {
        return raw as ArenaMonthlyHistoryResponse;
      }

      return { months: [] };
    } catch (error) {
      console.error('[ArenaService] Failed to get monthly history:', error);
      throw error;
    }
  }

  /**
   * Get Arena yapping stats (points and threads)
   */
  async getArenaStats(): Promise<ArenaStats> {
    this.setAuthHeaders();

    try {
      const response = await apiService.get<ArenaStats>(
        '/arena/stats'
      );

      if (response.data) {
        return response.data;
      }

      // Backend may return stats fields at top level
      const raw = response as any;
      if (raw.totalPointsEarned !== undefined) {
        return raw as ArenaStats;
      }

      return {
        connected: false,
        totalThreadsMatched: 0,
        totalPointsEarned: 0,
        todayThreadsMatched: 0,
        todayPointsEarned: 0,
        remainingDailySlots: 5,
      };
    } catch (error) {
      console.error('[ArenaService] Failed to get Arena stats:', error);
      throw error;
    }
  }
}

export const arenaService = new ArenaService();
