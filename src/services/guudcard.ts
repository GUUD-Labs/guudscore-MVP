import { secureTokenStore } from '@/lib/token-store';
import { apiService } from '@/services';
import type {
    CustomCardRequest,
    CustomCardResponse,
    GuudCardDetail,
    GuudCardListParams,
    GuudCardListResponse,
    SignTransactionRequest,
} from '@/types';

class GuudCardService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  async getCardList(params: GuudCardListParams): Promise<GuudCardListResponse> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cardType) queryParams.append('cardType', params.cardType);

    const queryString = queryParams.toString();
    const endpoint = `/guudcard/list${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<GuudCardListResponse>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch GuudCard list');
    }

    return response.data;
  }

  async createCustomCard(data: CustomCardRequest): Promise<CustomCardResponse> {
    this.setAuthHeaders();

    const response = await apiService.post<CustomCardResponse>(
      '/guudcard/custom',
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to create custom card');
    }

    return response.data;
  }

  async getCardById(id: string): Promise<GuudCardDetail> {
    this.setAuthHeaders();

    const response = await apiService.get<GuudCardDetail>(`/guudcard/${id}`);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch GuudCard details');
    }

    return response.data;
  }

  async mintCard(id: string): Promise<string> {
    this.setAuthHeaders();

    const response = await apiService.post<string>(`/guudcard/${id}/mint`, {});

    if (!response.success) {
      throw new Error(response.message || 'Failed to mint card');
    }

    return response.data;
  }

  async signTransaction(
    data: SignTransactionRequest
  ): Promise<{ transactionHash: string }> {
    this.setAuthHeaders();

    const response = await apiService.post<{ transactionHash: string }>(
      '/guudcard/sign-transaction',
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to sign transaction');
    }

    return response.data;
  }
}

export const guudcardService = new GuudCardService();
