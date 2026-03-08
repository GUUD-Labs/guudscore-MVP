import { secureTokenStore } from '@/lib/token-store';
import { apiService } from '@/services';
import type {
    CreateOrderRequest,
    CreateOrderResponse,
    CreatePaymentRequest,
    GetOrdersParams,
    GetOrdersResponse,
    OrderDetail,
    SupplierOrdersParams,
    UpdateOrderStatusRequest,
} from '@/types';

class ShopService {
  private setAuthHeaders(): void {
    const token = secureTokenStore.getAccessToken();
    if (token) {
      apiService.setHeader('Authorization', `Bearer ${token}`);
    } else {
      apiService.removeHeader('Authorization');
    }
  }

  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    this.setAuthHeaders();

    const response = await apiService.post<CreateOrderResponse>(
      '/shop/orders',
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create order');
    }

    return response.data;
  }

  async getMyOrders(params?: GetOrdersParams): Promise<GetOrdersResponse> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/shop/orders/me${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<GetOrdersResponse>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch orders');
    }

    return response.data;
  }

  async getOrderById(orderId: string): Promise<OrderDetail> {
    this.setAuthHeaders();

    const response = await apiService.get<OrderDetail>(
      `/shop/orders/${orderId}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order details');
    }

    return response.data;
  }

  async createPaymentSession(
    orderId: string,
    data: CreatePaymentRequest
  ): Promise<void> {
    this.setAuthHeaders();

    const response = await apiService.post<void>(
      `/shop/orders/${orderId}/payment`,
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to create payment session');
    }
  }

  async getOrderTracking(orderId: string): Promise<any> {
    this.setAuthHeaders();

    const response = await apiService.get<any>(
      `/shop/orders/${orderId}/tracking`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order tracking');
    }

    return response.data;
  }

  async getPaymentSession(sessionId: string): Promise<any> {
    this.setAuthHeaders();

    const response = await apiService.get<any>(
      `/shop/payment-session/${sessionId}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch payment session');
    }

    return response.data;
  }

  // Supplier endpoints
  async getSupplierOrders(
    params?: SupplierOrdersParams
  ): Promise<GetOrdersResponse> {
    this.setAuthHeaders();

    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = `/shop/supplier/orders${queryString ? `?${queryString}` : ''}`;

    const response = await apiService.get<GetOrdersResponse>(endpoint);

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch supplier orders');
    }

    return response.data;
  }

  async updateOrderStatus(
    orderId: string,
    data: UpdateOrderStatusRequest
  ): Promise<void> {
    this.setAuthHeaders();

    const response = await apiService.post<void>(
      `/shop/supplier/orders/${orderId}/status`,
      data
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update order status');
    }
  }
}

export const shopService = new ShopService();
