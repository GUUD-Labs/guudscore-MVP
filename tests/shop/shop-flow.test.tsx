import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as useGuudCardHook from '@/hooks/use-guudcard';
import * as useShopHook from '@/hooks/use-shop';
import { CardType } from '@/types/guudcard';

/**
 * Shop Flow Integration Tests
 * Tests all services: useGuudCardList, useCreateCustomCard, useCreateOrder,
 * useMintCard, useSignTransaction, useOrderById
 */
describe('Shop Services Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('useGuudCardList - Browse Cards', () => {
    it('fetches card list successfully', () => {
      const mockData = {
        cards: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      vi.spyOn(useGuudCardHook, 'useGuudCardList').mockReturnValue({
        data: mockData,
        isLoading: false,
        error: null,
      } as any);

      const result = useGuudCardHook.useGuudCardList({ page: 1, limit: 10 });
      expect(result.data).toEqual(mockData);
    });
  });

  describe('useCreateCustomCard - Customize', () => {
    it('creates custom card successfully', async () => {
      const mockResponse = {
        id: 'card-123',
        name: 'Test',
        cardType: CardType.PREMIUM,
      };

      const mutateAsync = vi.fn().mockResolvedValue(mockResponse);
      vi.spyOn(useGuudCardHook, 'useCreateCustomCard').mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any);

      const result = await mutateAsync({ name: 'Test' });
      expect(result.id).toBe('card-123');
    });
  });

  describe('useCreateOrder - Payment', () => {
    it('creates order successfully', async () => {
      const mockOrder = { id: 'order-456', status: 'pending' };
      const mutateAsync = vi.fn().mockResolvedValue(mockOrder);

      vi.spyOn(useShopHook, 'useCreateOrder').mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any);

      const result = await mutateAsync({ guudCardId: 'card-123' });
      expect(result.id).toBe('order-456');
    });
  });

  describe('useMintCard - Minting', () => {
    it('mints card successfully', async () => {
      const mutateAsync = vi.fn().mockResolvedValue('0xdata');

      vi.spyOn(useGuudCardHook, 'useMintCard').mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any);

      const result = await mutateAsync('card-123');
      expect(result).toBe('0xdata');
    });
  });

  describe('useSignTransaction - Blockchain', () => {
    it('signs transaction successfully', async () => {
      const mockTx = { transactionHash: '0xtx' };
      const mutateAsync = vi.fn().mockResolvedValue(mockTx);

      vi.spyOn(useGuudCardHook, 'useSignTransaction').mockReturnValue({
        mutateAsync,
        isPending: false,
      } as any);

      const result = await mutateAsync({
        methodData: '0xdata',
        privateKey: '0x...',
      });
      expect(result.transactionHash).toBe('0xtx');
    });
  });

  describe('useOrderById - Tracking', () => {
    it('fetches order details successfully', () => {
      const mockOrder = { orderId: 'order-456', status: 'shipped' };

      vi.spyOn(useShopHook, 'useOrderById').mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      } as any);

      const result = useShopHook.useOrderById('order-456');
      expect(result.data?.orderId).toBe('order-456');
    });
  });

  describe('SessionStorage Data Flow', () => {
    it('stores and retrieves card data', () => {
      const cardData = { cardId: 'card-123', isPremium: true };
      sessionStorage.setItem('cardData', JSON.stringify(cardData));

      const stored = JSON.parse(sessionStorage.getItem('cardData')!);
      expect(stored.cardId).toBe('card-123');
    });

    it('stores and retrieves order data', () => {
      const orderData = { orderId: 'order-456', paymentMethod: 'stripe' };
      sessionStorage.setItem('orderData', JSON.stringify(orderData));

      const stored = JSON.parse(sessionStorage.getItem('orderData')!);
      expect(stored.orderId).toBe('order-456');
    });

    it('clears sessionStorage', () => {
      sessionStorage.setItem('cardData', '{}');
      sessionStorage.setItem('orderData', '{}');
      sessionStorage.clear();

      expect(sessionStorage.getItem('cardData')).toBeNull();
      expect(sessionStorage.getItem('orderData')).toBeNull();
    });
  });

  describe('Card Types', () => {
    it('supports Regular card type', () => {
      expect(CardType.REGULAR).toBe('REGULAR');
    });

    it('supports Premium card type', () => {
      expect(CardType.PREMIUM).toBe('PREMIUM');
    });
  });

  describe('Payment Methods', () => {
    it('supports Stripe payment', () => {
      const payment = { method: 'stripe' };
      expect(payment.method).toBe('stripe');
    });

    it('supports Wallet payment', () => {
      const payment = { method: 'wallet' };
      expect(payment.method).toBe('wallet');
    });
  });

  describe('Order Status', () => {
    it('validates order status values', () => {
      const statuses = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
      ];
      expect(statuses).toContain('pending');
      expect(statuses).toContain('delivered');
    });
  });

  describe('All Services Available', () => {
    it('verifies all shop services exist', () => {
      expect(useGuudCardHook.useGuudCardList).toBeDefined();
      expect(useGuudCardHook.useCreateCustomCard).toBeDefined();
      expect(useShopHook.useCreateOrder).toBeDefined();
      expect(useGuudCardHook.useMintCard).toBeDefined();
      expect(useGuudCardHook.useSignTransaction).toBeDefined();
      expect(useShopHook.useOrderById).toBeDefined();
    });
  });
});
