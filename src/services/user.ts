import { secureTokenStore } from '@/lib/token-store';
import type {
    CreateCustomLinkRequest,
    CreateSocialLinkRequest,
    DashboardMetrics,
    ExtendedUser,
    ReferralStats,
    UpdateCustomLinkRequest,
    UpdateSocialLinkRequest,
    UserSearchParams,
    UserSearchResponse,
} from '@/types';

import { apiService } from './api';

class UserService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  async getCurrentUser(network?: string): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/user/me${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<ExtendedUser>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch current user');
    }

    return response.data;
  }

  async getUserByKey(key: string, network?: string): Promise<ExtendedUser> {
    // Remove auth header for public profile
    apiService.removeHeader('Authorization');

    const queryParams = new URLSearchParams();
    if (network) queryParams.append('network', network);
    
    const queryString = queryParams.toString();
    const endpoint = `/user/${key}${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<ExtendedUser>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'User not found');
    }

    return response.data;
  }

  async updateProfile(
    profileData: Partial<ExtendedUser>
  ): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const response = await apiService.put<ExtendedUser>(
      '/user/me',
      profileData
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }

    return response.data;
  }

  async getDashboardMetrics(network?: string): Promise<DashboardMetrics> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();
    if (network) {
      queryParams.append('network', network);
    }
    const queryString = queryParams.toString();
    const endpoint = `/user/me/dashboard${queryString ? `?${queryString}` : ''}`;

    const response =
      await apiService.get<DashboardMetrics>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch dashboard metrics');
    }

    return response.data;
  }

  async updateAvatar(avatarData: {
    avatarId?: string;
    nftId?: string;
  }): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const response = await apiService.patch<ExtendedUser>(
      '/user/update-avatar',
      avatarData
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update avatar');
    }

    return response.data;
  }

  async updateUserProfile(profileData: {
    name?: string;
    title?: string;
    bio?: string;
    themeId?: string;
    fontId?: string;
    isPublicNft?: boolean;
    isSynced?: boolean;
    slug?: string;
    searchVisibility?: boolean;
    displayBadges?: boolean;
    displayGuudScore?: boolean;
  }): Promise<ExtendedUser> {
    this.setAuthHeaders();

    console.log('Sending profile update request:', profileData);

    const response = await apiService.put<ExtendedUser>(
      '/user/update-profile',
      profileData
    );

    console.log('Profile update response:', response);

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }

    return response.data;
  }

  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    this.setAuthHeaders();

    const searchParams = new URLSearchParams({
      query: params.query,
      page: String(params.page || 1),
      limit: String(params.limit || 10),
    });

    const response = await apiService.get<UserSearchResponse>(
      `/user/search?${searchParams.toString()}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to search users');
    }

    return response.data;
  }

  async createSocialLink(data: CreateSocialLinkRequest): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const response = await apiService.put<ExtendedUser>(
      '/user/update-social-link',
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to create social link');
    }

    return response.data;
  }

  async updateSocialLink(data: UpdateSocialLinkRequest): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const response = await apiService.put<ExtendedUser>(
      '/user/update-social-link',
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update social link');
    }

    return response.data;
  }

  async createCustomLink(data: CreateCustomLinkRequest): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const response = await apiService.post<ExtendedUser>(
      '/user/custom-link',
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to create custom link');
    }

    return response.data;
  }

  async updateCustomLink(data: UpdateCustomLinkRequest): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const { id, ...updateData } = data;
    const response = await apiService.put<ExtendedUser>(
      `/user/custom-link/${id}`,
      updateData
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update custom link');
    }

    return response.data;
  }

  async deleteSocialLink(id: string): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const response = await apiService.delete<ExtendedUser>(
      `/user/delete-social-link/${id}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete social link');
    }

    return response.data;
  }

  async deleteCustomLink(id: string): Promise<ExtendedUser> {
    this.setAuthHeaders();

    const response = await apiService.delete<ExtendedUser>(
      `/user/custom-link/${id}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete custom link');
    }

    return response.data;
  }

  async updateBadgeSelection(data: {
    selectedBadges: Array<{
      id: string;
      type: 'poap' | 'nft';
      priority: number;
    }>;
    allBadges?: Array<{
      id: string;
      type: 'poap' | 'nft';
      priority: number;
      isVisible: boolean;
    }>;
    network?: string;
  }): Promise<void> {
    this.setAuthHeaders();

    // Backend expects individual requests for each badge
    // Convert type to backend format: 'poap' -> 'POAP_BADGE', 'nft' -> 'NFT_BADGE'
    const badgeTypeMap = {
      poap: 'POAP_BADGE',
      nft: 'NFT_BADGE'
    } as const;

    // If allBadges is provided, send requests for all badges (including unselected ones with priority 0)
    const badgesToUpdate = data.allBadges || data.selectedBadges;

    // Send requests for each badge with network parameter for all badge types
    const promises = badgesToUpdate.map(badge => 
      apiService.put<void>('/badges/featured', {
        badgeId: badge.id,
        badgeType: badgeTypeMap[badge.type],
        priority: badge.priority,
        // Include network for all badge types to support chain-specific selections
        ...(data.network ? { network: data.network } : {})
      })
    );

    const responses = await Promise.all(promises);

    // Check if any request failed
    const failedResponse = responses.find(response => !response.success);
    if (failedResponse) {
      throw new Error(failedResponse.message || 'Failed to update badge selection');
    }
  }

  async getReferralStats(): Promise<ReferralStats> {
    this.setAuthHeaders();

    const response = await apiService.get<ReferralStats>('/user/referral-stats');

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch referral stats');
    }

    return response.data;
  }
}

export const userService = new UserService();
