import { secureTokenStore } from '@/lib/token-store';
import type { ApiResponse } from '@/types';

import { apiService } from './api';

// Twitter OAuth request/response types
export interface TwitterOAuthRequest {
  callbackUrl?: string;
}

export interface TwitterOAuthResponse {
  authUrl: string;
  oauthToken: string;
  oauthTokenSecret: string;
}

// Twitter share request/response types for OAuth
export interface ShareToXOAuthRequest {
  text: string;
  imageUrl: string;
  oauthToken: string;
  oauthTokenSecret: string;
}

export interface ShareToXOAuthResponse {
  tweetId: string;
  tweetUrl: string;
  success: boolean;
  message?: string;
}

// Legacy share request/response types (for backward compatibility)
export interface ShareToXRequest {
  text: string;
  imageUrl: string;
}

export interface ShareToXResponse {
  shareUrl: string;
  hasImage: boolean;
  imageDownloadUrl: string;
  isImagePublic: boolean;
}

// Hybrid OAuth share request/response types
export interface HybridShareToXRequest {
  text: string;
  imageUrl: string;
}

export interface HybridShareToXResponse {
  success: boolean;
  authRequired?: boolean;
  authUrl?: string;
  message?: string;
  shareUrl?: string;
  tweetId?: string;
}

// Twitter media upload request/response types
export interface TwitterMediaUploadRequest {
  imageUrl: string;
}

export interface TwitterMediaUploadResponse {
  mediaUrl: string; // pic.twitter.com URL
  mediaId: string;
  success: boolean;
}

class TwitterService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  /**
   * Initiate Twitter OAuth flow
   * @param callbackUrl - Optional callback URL for OAuth redirect
   * @returns Promise with OAuth authorization URL
   */
  async initiateOAuth(callbackUrl?: string): Promise<ApiResponse<TwitterOAuthResponse>> {
    this.setAuthHeaders();

    const response = await apiService.post<TwitterOAuthResponse>(
      '/user/twitter/oauth',
      {
        callbackUrl,
        isSharing: callbackUrl?.includes('sharing=true'),
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to initiate Twitter OAuth');
    }

    return response;
  }

  /**
   * Share to X using OAuth (uploads image directly to Twitter)
   * @param text - Tweet text content
   * @param imageUrl - Public URL of the image to share
   * @param oauthToken - OAuth token from previous step
   * @param oauthTokenSecret - OAuth token secret from previous step
   * @returns Promise with tweet URL and ID
   */
  async shareToXOAuth(
    text: string,
    imageUrl: string,
    oauthToken: string,
    oauthTokenSecret: string
  ): Promise<ApiResponse<ShareToXOAuthResponse>> {
    this.setAuthHeaders();

    const response = await apiService.post<ShareToXOAuthResponse>(
      '/user/twitter/share-with-oauth',
      {
        text,
        imageUrl,
        oauthToken,
        oauthTokenSecret,
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to share to X with OAuth');
    }

    return response;
  }

  /**
   * Share to X with Hybrid OAuth flow (RECOMMENDED)
   * Automatically handles OAuth 1.0a authorization if needed for media upload
   * @param text - Tweet text content
   * @param imageUrl - Public URL of the image to share
   * @returns Promise with share result or authorization requirement
   */
  async shareToXHybrid(
    text: string,
    imageUrl: string
  ): Promise<ApiResponse<HybridShareToXResponse>> {
    this.setAuthHeaders();

    const response = await apiService.post<HybridShareToXResponse>(
      '/user/share-to-x',
      {
        text,
        imageUrl,
      }
    );

    console.log('[TwitterService] shareToXHybrid raw response:', response);

    // Note: Don't throw error if authRequired is true, caller will handle it
    if (!response.success && !response.data?.authRequired) {
      throw new Error(response.message || 'Failed to share to X');
    }

    return response;
  }

  /**
   * Generate Twitter share URL with pre-filled text and image (legacy method)
   * @param text - Tweet text content
   * @param imageUrl - Public URL of the image to share
   * @returns Promise with Twitter share URL
   */
  async shareToX(
    text: string,
    imageUrl: string
  ): Promise<ApiResponse<ShareToXResponse>> {
    this.setAuthHeaders();

    const response = await apiService.post<ShareToXResponse>(
      '/user/share-to-x',
      {
        text,
        imageUrl,
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to generate Twitter share URL');
    }

    return response;
  }

  /**
   * Upload media to Twitter and get pic.twitter.com URL
   * @param imageUrl - Public URL of the image to upload to Twitter
   * @returns Promise with pic.twitter.com URL
   */
  async uploadMediaToTwitter(
    imageUrl: string
  ): Promise<ApiResponse<TwitterMediaUploadResponse>> {
    this.setAuthHeaders();

    const response = await apiService.post<TwitterMediaUploadResponse>(
      '/user/twitter/upload-media',
      {
        imageUrl,
      }
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to upload media to Twitter');
    }

    return response;
  }
}

export const twitterService = new TwitterService();
