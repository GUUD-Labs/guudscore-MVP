import { secureTokenStore } from '@/lib/token-store';
import { apiService } from '@/services';
import type { NFTData, NFTParams, UserNFTCollectionsResponse } from '@/types';

class NFTService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  async getMyNFTs(params: NFTParams = {}): Promise<NFTData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.startId !== undefined)
      queryParams.append('startId', params.startId.toString());
    if (params.offset !== undefined)
      queryParams.append('offset', params.offset.toString());
    if (params.limit !== undefined)
      queryParams.append('limit', params.limit.toString());
    if (params.collectionId)
      queryParams.append('collectionId', params.collectionId);
    if (params.network) queryParams.append('network', params.network);

    const queryString = queryParams.toString();
    const endpoint = `/nft/me${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiService.get<any>(endpoint);

      if (!response.success) {
        throw new Error('API request failed');
      }

      // Eğer response.data doğrudan NFT verisiyse (items ve total içeriyorsa)
      if (
        response.data &&
        response.data.items &&
        response.data.total !== undefined
      ) {
        return response.data as NFTData;
      }

      // Eğer response.data.success varsa
      if (response.data && response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch user NFTs');
        }
        if (response.data.data) {
          return response.data.data as NFTData;
        }
      }

      // Fallback: response.data'yı doğrudan döndür (eğer items varsa)
      if (response.data && Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
        } as NFTData;
      }

      throw new Error('Unexpected API response structure');
    } catch (error) {
      throw error;
    }
  }

  async getUserNFTs(
    username: string,
    params: NFTParams = {}
  ): Promise<NFTData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.startId !== undefined)
      queryParams.append('startId', params.startId.toString());
    if (params.offset !== undefined)
      queryParams.append('offset', params.offset.toString());
    if (params.limit !== undefined)
      queryParams.append('limit', params.limit.toString());
    if (params.collectionId)
      queryParams.append('collectionId', params.collectionId);
    if (params.network) queryParams.append('network', params.network);

    const queryString = queryParams.toString();
    const endpoint = `/nft/user/${username}${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiService.get<any>(endpoint);

      if (!response.success) {
        throw new Error('API request failed');
      }

      // Eğer response.data doğrudan NFT verisiyse (items ve total içeriyorsa)
      if (
        response.data &&
        response.data.items &&
        response.data.total !== undefined
      ) {
        return response.data as NFTData;
      }

      // Eğer response.data.success varsa
      if (response.data && response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to fetch user NFTs');
        }
        if (response.data.data) {
          return response.data.data as NFTData;
        }
      }

      // Fallback: response.data'yı doğrudan döndür (eğer items varsa)
      if (response.data && Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
        } as NFTData;
      }

      throw new Error('Unexpected API response structure');
    } catch (error) {
      throw error;
    }
  }

  async getMyCollections(): Promise<UserNFTCollectionsResponse> {
    this.setAuthHeaders();

    try {
      const response = await apiService.get<any>('/nft/collection/list');

      if (!response.success) {
        throw new Error('Failed to fetch NFT collections');
      }

      // API response: { data: { data: [...], count: X }, success, message, count }
      if (response.data && response.data.data) {
        return {
          data: response.data.data,
          count: response.data.count,
        };
      }

      throw new Error('Unexpected API response structure');
    } catch (error) {
      throw error;
    }
  }

  async setFeaturedNFT(params: {
    tokenId: string;
    removeAll?: boolean;
    network?: string;
    contractAddress?: string;
  }): Promise<any> {
    this.setAuthHeaders();

    try {
      console.log('[NFT Service] setFeaturedNFT request params:', params);
      const response = await apiService.post<any>('/nft/featured', params);

      if (!response.success) {
        throw new Error(response.message || 'Failed to set featured NFT');
      }

      return response.data;
    } catch (error) {
      console.error('[NFT Service] setFeaturedNFT error:', error);
      throw error;
    }
  }

  async removeFeaturedNFT(params: {
    tokenId: string;
    network?: string;
    contractAddress?: string;
  }): Promise<any> {
    this.setAuthHeaders();

    try {
      // Backend uses POST /nft/featured with toggle logic, not DELETE
      console.log('[NFT Service] Removing featured NFT (toggle off) with params:', params);
      const response = await apiService.post<any>('/nft/featured', {
        ...params,
        removeAll: false, // Just toggle this specific NFT
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to remove featured NFT');
      }

      return response.data;
    } catch (error) {
      console.error('[NFT Service] removeFeaturedNFT error:', error);
      throw error;
    }
  }
}

export const nftService = new NFTService();
