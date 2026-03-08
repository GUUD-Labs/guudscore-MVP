import { toast } from 'sonner';

import type { UseQueryOptions } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useChain } from '@/contexts/chain-context';
import { nftService } from '@/services';
import type {
    NFTData,
    NFTParams,
    Network,
    UserNFTCollectionsResponse,
} from '@/types';

import { tokenStorage } from './use-auth';

// Query keys
export const NFT_QUERY_KEYS = {
  all: ['nft'] as const,
  myNFTs: (params: NFTParams) =>
    [...NFT_QUERY_KEYS.all, 'my-nfts', params] as const,
  userNFTs: (username: string, params: NFTParams) =>
    [...NFT_QUERY_KEYS.all, 'user-nfts', username, params] as const,
  myCollections: (network?: string) => [...NFT_QUERY_KEYS.all, 'my-collections', network] as const,
} as const;

// Hook to get current user's NFTs with network filter from chain context
export const useMyNFTs = (
  params: NFTParams = {},
  options?: UseQueryOptions<NFTData, Error>
) => {
  const { selectedNetwork } = useChain();
  // Use selectedNetwork directly (AVAX, BASE, or SOLANA)
  const paramsWithNetwork = { ...params, network: params.network || selectedNetwork };
  
  return useQuery({
    queryKey: NFT_QUERY_KEYS.myNFTs(paramsWithNetwork),
    queryFn: () => nftService.getMyNFTs(paramsWithNetwork),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    staleTime: 0, // Always fetch fresh data
    ...options,
  });
};

// Hook to get user's NFTs by username
export const useUserNFTs = (
  username: string,
  params: NFTParams = {},
  options?: UseQueryOptions<NFTData, Error>
) => {
  return useQuery({
    queryKey: NFT_QUERY_KEYS.userNFTs(username, params),
    queryFn: () => nftService.getUserNFTs(username, params),
    enabled: !!username,
    ...options,
  });
};

// Hook to get NFTs by specific network
export const useNFTsByNetwork = (
  network: Network,
  params: Omit<NFTParams, 'network'> = {},
  options?: UseQueryOptions<NFTData, Error>
) => {
  return useQuery({
    queryKey: NFT_QUERY_KEYS.myNFTs({ ...params, network }),
    queryFn: () => nftService.getMyNFTs({ ...params, network }),
    enabled:
      !!network &&
      !!tokenStorage.getAccessToken() &&
      !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook to get NFTs by collection
export const useNFTsByCollection = (
  collectionId: string,
  params: Omit<NFTParams, 'collectionId'> = {},
  options?: UseQueryOptions<NFTData, Error>
) => {
  return useQuery({
    queryKey: NFT_QUERY_KEYS.myNFTs({ ...params, collectionId }),
    queryFn: () => nftService.getMyNFTs({ ...params, collectionId }),
    enabled:
      !!collectionId &&
      !!tokenStorage.getAccessToken() &&
      !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook for paginated NFTs
export const usePaginatedNFTs = (
  startId: number,
  limit: number = 20,
  params: Omit<NFTParams, 'startId' | 'limit'> = {},
  options?: UseQueryOptions<NFTData, Error>
) => {
  return useQuery({
    queryKey: NFT_QUERY_KEYS.myNFTs({ ...params, startId, limit }),
    queryFn: () => nftService.getMyNFTs({ ...params, startId, limit }),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook to get user's NFT collections with network filter
export const useMyNFTCollections = (
  options?: UseQueryOptions<UserNFTCollectionsResponse, Error>
) => {
  const { selectedNetwork } = useChain();
  
  return useQuery({
    queryKey: NFT_QUERY_KEYS.myCollections(selectedNetwork),
    queryFn: () => nftService.getMyCollections(),
    enabled: !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
    ...options,
  });
};

// Hook to set featured NFT
export const useSetFeaturedNFT = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      tokenId: string;
      removeAll?: boolean;
      network?: string;
      contractAddress?: string;
    }) => nftService.setFeaturedNFT(params),
    onSuccess: (_data, variables) => {
      if (variables.removeAll) {
        toast.success('All featured NFTs cleared!');
      } else {
        toast.success('Featured NFT updated successfully!');
      }
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.myNFTs({}) });
      queryClient.invalidateQueries({
        queryKey: NFT_QUERY_KEYS.myCollections(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update featured NFT');
      // Force refetch even on error to sync with backend state
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.myNFTs({}) });
      queryClient.invalidateQueries({
        queryKey: NFT_QUERY_KEYS.myCollections(),
      });
    },
  });
};

// Hook to remove featured NFT
export const useRemoveFeaturedNFT = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      tokenId: string;
      network?: string;
      contractAddress?: string;
    }) => nftService.removeFeaturedNFT(params),
    onSuccess: () => {
      toast.success('Featured NFT removed successfully!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: NFT_QUERY_KEYS.myNFTs({}) });
      queryClient.invalidateQueries({
        queryKey: NFT_QUERY_KEYS.myCollections(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove featured NFT');
    },
  });
};
