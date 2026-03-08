import { secureTokenStore } from '@/lib/token-store';
import type { ApiResponse } from '@/types';

import { apiService } from './api';

export interface ShareCardRequest {
  userId: string;
  imageUrl: string;
  text: string;
  slug: string;
}

export interface ShareCardResponse {
  shareUrl: string;
  redirectUrl: string;
}

class ShareService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Generate Twitter Card share URL with proper meta tags
   * @param userId - User ID for the share URL
   * @param imageUrl - Public URL of the card image
   * @param text - Share text/title for the card
   * @param slug - User slug for profile redirect
   * @returns Promise with share URL information
   */
  async generateCardShareUrl(
    userId: string,
    imageUrl: string,
    text: string,
    slug: string
  ): Promise<ApiResponse<ShareCardResponse>> {
    this.setAuthHeaders();

    const response = await apiService.get<ShareCardResponse>(
      `/user/share/card/${userId}?imageUrl=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(text)}&slug=${encodeURIComponent(slug)}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to generate card share URL');
    }

    return response;
  }

  /**
   * Build the share URL client-side (for immediate use while backend processes)
   * @param baseUrl - Base URL of the application
   * @param userId - User ID for the share URL
   * @param imageUrl - Public URL of the card image
   * @param text - Share text/title for the card
   * @param slug - User slug for profile redirect
   * @returns The complete share URL
   */
  buildShareUrl(
    baseUrl: string,
    userId: string,
    imageUrl: string,
    text: string,
    slug: string
  ): string {
    const params = new URLSearchParams({
      imageUrl,
      text,
      slug,
    });

    // Use /api/share/card/ to hit the Cloudflare Function (server-side rendering for Twitter Card meta tags)
    return `${baseUrl}/api/share/card/${userId}?${params.toString()}`;
  }
}

export const shareService = new ShareService();