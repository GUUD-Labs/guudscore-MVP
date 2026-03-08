// Order status types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'stripe' | 'wallet' | 'crypto';

export type Currency = 'USD' | 'EUR' | 'GBP';

// Shipping address types
export interface ShippingAddress {
  id?: string;
  userId?: string;
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Create order types
export interface CreateOrderRequest {
  guudCardId: string;
  shippingAddress: ShippingAddress;
}

export interface CreateOrderResponse {
  id: string;
  status: OrderStatus;
}

// Order pricing
export interface OrderPricing {
  total: number;
  currency: Currency;
  method: PaymentMethod;
}

// Order shipping
export interface OrderShipping {
  address: ShippingAddress;
  estimatedDelivery: string;
}

// Supplier info
export interface SupplierInfo {
  orderId: string | null;
  partnerName: string;
  productionTime: string;
}

// Order actions
export interface OrderActions {
  canCancel: boolean;
  canReorder: boolean;
  canDownloadReceipt: boolean;
}

// Status history
export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
}

// Order item
export interface Order {
  id: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  pricing: OrderPricing;
  shipping: OrderShipping;
  supplierInfo: SupplierInfo;
  actions: OrderActions;
}

// Order detail (same structure but different key name)
export interface OrderDetail {
  orderId: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  pricing: OrderPricing;
  shipping: OrderShipping;
  supplierInfo: SupplierInfo;
  actions: OrderActions;
}

// Orders list pagination
export interface OrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Orders stats
export interface OrdersStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
}

// Get orders list params
export interface GetOrdersParams {
  status?: OrderStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// Get orders list response
export interface GetOrdersResponse {
  orders: Order[];
  pagination: OrdersPagination;
  stats: OrdersStats;
}

// Payment session request
export interface CreatePaymentRequest {
  successUrl: string;
  cancelUrl: string;
}

// Update order status request
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// Supplier orders params
export interface SupplierOrdersParams {
  status?: OrderStatus;
  search?: string;
  page?: number;
  limit?: number;
}
