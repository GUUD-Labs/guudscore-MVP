import { toast } from 'sonner';

import type { UseQueryOptions } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { connectionsService } from '@/services';
import type {
    ConnectionsData,
    ConnectionsParams,
    IncomingRequestsData,
    SentRequestsData,
} from '@/types';

import { tokenStorage } from './use-auth';

// Query keys
export const CONNECTIONS_QUERY_KEYS = {
  all: ['connections'] as const,
  lists: () => [...CONNECTIONS_QUERY_KEYS.all, 'list'] as const,
  list: (params: ConnectionsParams) =>
    [...CONNECTIONS_QUERY_KEYS.lists(), params] as const,
  sentRequests: () => [...CONNECTIONS_QUERY_KEYS.all, 'sent-requests'] as const,
  sentRequestsList: (params: ConnectionsParams) =>
    [...CONNECTIONS_QUERY_KEYS.sentRequests(), params] as const,
  incomingRequests: () =>
    [...CONNECTIONS_QUERY_KEYS.all, 'incoming-requests'] as const,
  incomingRequestsList: (params: ConnectionsParams) =>
    [...CONNECTIONS_QUERY_KEYS.incomingRequests(), params] as const,
} as const;

// Hook to get user's connections
export const useConnections = (
  params: ConnectionsParams = {},
  options?: UseQueryOptions<ConnectionsData, Error>
) => {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEYS.list(params),
    queryFn: () => connectionsService.getConnections(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook for paginated connections
export const usePaginatedConnections = (
  page: number = 1,
  limit: number = 10,
  options?: UseQueryOptions<ConnectionsData, Error>
) => {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEYS.list({ page, limit }),
    queryFn: () => connectionsService.getConnections({ page, limit }),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook to send connection request
export const useSendConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiverId: string) =>
      connectionsService.sendConnectionRequest(receiverId),
    onSuccess: () => {
      // Invalidate and refetch connections list and sent requests
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEYS.all });

      // Show success toast
      toast.success('Connection request sent successfully!');
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error(error.message || 'Failed to send connection request');
    },
  });
};

// Hook to delete connection
export const useDeleteConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) =>
      connectionsService.deleteConnection(connectionId),
    onSuccess: () => {
      // Invalidate and refetch connections list
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEYS.all });

      // Show success toast
      toast.success('Connection deleted successfully!');
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error(error.message || 'Failed to delete connection');
    },
  });
};

// Hook to get sent connection requests
export const useSentRequests = (
  params: ConnectionsParams = {},
  options?: UseQueryOptions<SentRequestsData, Error>
) => {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEYS.sentRequestsList(params),
    queryFn: () => connectionsService.getSentRequests(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook for paginated sent requests
export const usePaginatedSentRequests = (
  page: number = 1,
  limit: number = 10,
  options?: UseQueryOptions<SentRequestsData, Error>
) => {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEYS.sentRequestsList({ page, limit }),
    queryFn: () => connectionsService.getSentRequests({ page, limit }),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook to get incoming connection requests
export const useIncomingRequests = (
  params: ConnectionsParams = {},
  options?: UseQueryOptions<IncomingRequestsData, Error>
) => {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEYS.incomingRequestsList(params),
    queryFn: () => connectionsService.getIncomingRequests(params),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook for paginated incoming requests
export const usePaginatedIncomingRequests = (
  page: number = 1,
  limit: number = 10,
  options?: UseQueryOptions<IncomingRequestsData, Error>
) => {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEYS.incomingRequestsList({ page, limit }),
    queryFn: () => connectionsService.getIncomingRequests({ page, limit }),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook to accept connection request
export const useAcceptConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      connectionsService.acceptConnectionRequest(requestId),
    onSuccess: () => {
      // Invalidate and refetch all connection queries
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEYS.all });

      // Show success toast
      toast.success('Connection request accepted!');
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error(error.message || 'Failed to accept connection request');
    },
  });
};

// Hook to decline connection request
export const useDeclineConnectionRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      connectionsService.declineConnectionRequest(requestId),
    onSuccess: () => {
      // Invalidate and refetch all connection queries
      queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEYS.all });

      // Show success toast
      toast.success('Connection request declined');
    },
    onError: (error: Error) => {
      // Show error toast
      toast.error(error.message || 'Failed to decline connection request');
    },
  });
};
