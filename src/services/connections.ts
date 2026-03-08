import { secureTokenStore } from '@/lib/token-store';
import { apiService } from '@/services';
import type {
    ConnectionsData,
    ConnectionsParams,
    IncomingRequestsData,
    SentRequestsData,
} from '@/types';

class ConnectionsService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  async getConnections(
    params: ConnectionsParams = {}
  ): Promise<ConnectionsData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/connections${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiService.get<any>(endpoint);

      if (!response.success) {
        throw new Error('API request failed');
      }

      // API response'da data doğrudan connections ve pagination içeriyor
      if (
        response.data &&
        response.data.connections &&
        response.data.pagination
      ) {
        return response.data as ConnectionsData;
      }

      throw new Error('Unexpected API response structure');
    } catch (error) {
      throw error;
    }
  }

  async sendConnectionRequest(receiverId: string): Promise<void> {
    this.setAuthHeaders();

    try {
      await apiService.post('/connections', { receiverId });
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('Connection request already exists')) {
        throw new Error('You have already sent a friend request to this user');
      }

      throw error;
    }
  }

  async deleteConnection(connectionId: string): Promise<void> {
    this.setAuthHeaders();

    try {
      const response = await apiService.delete<any>(
        `/connections/${connectionId}`
      );

      if (!response.success) {
        throw new Error('Failed to delete connection');
      }
    } catch (error) {
      throw error;
    }
  }

  async getSentRequests(
    params: ConnectionsParams = {}
  ): Promise<SentRequestsData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/connections/requests/sent${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiService.get<any>(endpoint);

      if (!response.success) {
        throw new Error('API request failed');
      }

      if (
        response.data &&
        response.data.sentRequests &&
        response.data.pagination
      ) {
        return response.data as SentRequestsData;
      }

      throw new Error('Unexpected API response structure');
    } catch (error) {
      throw error;
    }
  }

  async getIncomingRequests(
    params: ConnectionsParams = {}
  ): Promise<IncomingRequestsData> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = `/connections/requests${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await apiService.get<any>(endpoint);

      if (!response.success) {
        throw new Error('API request failed');
      }

      // API returns "requests" not "incomingRequests"
      if (response.data && response.data.requests && response.data.pagination) {
        const transformedData: IncomingRequestsData = {
          incomingRequests: response.data.requests,
          pagination: response.data.pagination,
          // Use total from pagination as the count
          count: response.data.pagination.total || 0,
        };
        return transformedData;
      }

      throw new Error('Unexpected API response structure');
    } catch (error) {
      throw error;
    }
  }

  async acceptConnectionRequest(requestId: string): Promise<void> {
    this.setAuthHeaders();

    try {
      const response = await apiService.put<any>(
        `/connections/dashboard/guud-friends/${requestId}/accept`
      );

      if (!response.success) {
        throw new Error('Failed to accept connection request');
      }
    } catch (error) {
      throw error;
    }
  }

  async declineConnectionRequest(requestId: string): Promise<void> {
    this.setAuthHeaders();

    try {
      const response = await apiService.put<any>(
        `/connections/dashboard/guud-friends/${requestId}/decline`
      );

      if (!response.success) {
        throw new Error('Failed to decline connection request');
      }
    } catch (error) {
      throw error;
    }
  }
}

export const connectionsService = new ConnectionsService();
