import { useMutation, useQuery } from '@tanstack/react-query';

import { guudcardService } from '@/services';
import type {
  CustomCardRequest,
  CustomCardResponse,
  GuudCardListParams,
  SignTransactionRequest,
} from '@/types';

import { tokenStorage } from './use-auth';

export const GUUD_CARD_QUERY_KEYS = {
  all: ['guudcard'] as const,
  lists: () => [...GUUD_CARD_QUERY_KEYS.all, 'list'] as const,
  list: (params: GuudCardListParams) =>
    [...GUUD_CARD_QUERY_KEYS.lists(), { ...params }] as const,
  details: () => [...GUUD_CARD_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...GUUD_CARD_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook to get GuudCard list
 * @param params - GuudCard list parameters
 * @returns Query result with GuudCard list data, loading state, and error handling
 */
export const useGuudCardList = (params: GuudCardListParams) => {
  return useQuery({
    queryKey: GUUD_CARD_QUERY_KEYS.list(params),
    queryFn: () => guudcardService.getCardList(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to create a custom GuudCard
 * @returns Mutation result with create card function, loading state, and error handling
 */
export const useCreateCustomCard = () => {
  return useMutation<CustomCardResponse, Error, CustomCardRequest>({
    mutationFn: (data: CustomCardRequest) =>
      guudcardService.createCustomCard(data),
  });
};

/**
 * Hook to get GuudCard by ID
 * @param id - GuudCard ID
 * @returns Query result with GuudCard details, loading state, and error handling
 */
export const useGuudCardById = (id: string) => {
  return useQuery({
    queryKey: GUUD_CARD_QUERY_KEYS.detail(id),
    queryFn: () => guudcardService.getCardById(id),
    enabled:
      !!id && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
  });
};

/**
 * Hook to mint a GuudCard
 * @returns Mutation result with mint function, loading state, and error handling
 */
export const useMintCard = () => {
  return useMutation<string, Error, string>({
    mutationFn: (id: string) => guudcardService.mintCard(id),
  });
};

/**
 * Hook to sign a transaction
 * @returns Mutation result with sign transaction function, loading state, and error handling
 */
export const useSignTransaction = () => {
  return useMutation<
    { transactionHash: string },
    Error,
    SignTransactionRequest
  >({
    mutationFn: (data: SignTransactionRequest) =>
      guudcardService.signTransaction(data),
  });
};
