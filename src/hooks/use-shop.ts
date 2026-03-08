import { useMutation, useQuery } from '@tanstack/react-query';

import { shopService } from '@/services';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  CreatePaymentRequest,
  GetOrdersParams,
  SupplierOrdersParams,
  UpdateOrderStatusRequest,
} from '@/types';

import { tokenStorage } from './use-auth';

export const SHOP_QUERY_KEYS = {
  all: ['shop'] as const,
  orders: () => [...SHOP_QUERY_KEYS.all, 'orders'] as const,
  myOrders: (params?: GetOrdersParams) =>
    [...SHOP_QUERY_KEYS.orders(), 'me', { ...params }] as const,
  orderDetail: (orderId: string) =>
    [...SHOP_QUERY_KEYS.orders(), orderId] as const,
  orderTracking: (orderId: string) =>
    [...SHOP_QUERY_KEYS.orders(), orderId, 'tracking'] as const,
  paymentSession: (sessionId: string) =>
    [...SHOP_QUERY_KEYS.all, 'payment-session', sessionId] as const,
  supplierOrders: (params?: SupplierOrdersParams) =>
    [...SHOP_QUERY_KEYS.all, 'supplier', 'orders', { ...params }] as const,
};

/**
 * Hook to create a new order
 * @returns Mutation result with create order function, loading state, and error handling
 */
export const useCreateOrder = () => {
  return useMutation<CreateOrderResponse, Error, CreateOrderRequest>({
    mutationFn: (data: CreateOrderRequest) => shopService.createOrder(data),
  });
};

/**
 * Hook to get user's orders
 * @param params - Optional filter parameters (status, search, page, limit)
 * @returns Query result with orders list, pagination, and stats
 */
export const useMyOrders = (params?: GetOrdersParams) => {
  return useQuery({
    queryKey: SHOP_QUERY_KEYS.myOrders(params),
    queryFn: () => shopService.getMyOrders(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get order details by ID
 * @param orderId - Order ID
 * @returns Query result with order details
 */
export const useOrderById = (orderId: string) => {
  return useQuery({
    queryKey: SHOP_QUERY_KEYS.orderDetail(orderId),
    queryFn: () => shopService.getOrderById(orderId),
    enabled:
      !!orderId &&
      !!tokenStorage.getAccessToken() &&
      !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to create payment session for an order
 * @returns Mutation result with create payment session function
 */
export const useCreatePaymentSession = () => {
  return useMutation<
    void,
    Error,
    { orderId: string; data: CreatePaymentRequest }
  >({
    mutationFn: ({ orderId, data }) =>
      shopService.createPaymentSession(orderId, data),
  });
};

/**
 * Hook to get order tracking information
 * @param orderId - Order ID
 * @returns Query result with tracking information
 */
export const useOrderTracking = (orderId: string) => {
  return useQuery({
    queryKey: SHOP_QUERY_KEYS.orderTracking(orderId),
    queryFn: () => shopService.getOrderTracking(orderId),
    enabled:
      !!orderId &&
      !!tokenStorage.getAccessToken() &&
      !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get payment session details
 * @param sessionId - Payment session ID
 * @returns Query result with payment session details
 */
export const usePaymentSession = (sessionId: string) => {
  return useQuery({
    queryKey: SHOP_QUERY_KEYS.paymentSession(sessionId),
    queryFn: () => shopService.getPaymentSession(sessionId),
    enabled:
      !!sessionId &&
      !!tokenStorage.getAccessToken() &&
      !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to get supplier orders (admin/supplier role)
 * @param params - Optional filter parameters
 * @returns Query result with supplier orders list
 */
export const useSupplierOrders = (params?: SupplierOrdersParams) => {
  return useQuery({
    queryKey: SHOP_QUERY_KEYS.supplierOrders(params),
    queryFn: () => shopService.getSupplierOrders(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to update order status (admin/supplier role)
 * @returns Mutation result with update status function
 */
export const useUpdateOrderStatus = () => {
  return useMutation<
    void,
    Error,
    { orderId: string; data: UpdateOrderStatusRequest }
  >({
    mutationFn: ({ orderId, data }) =>
      shopService.updateOrderStatus(orderId, data),
  });
};
