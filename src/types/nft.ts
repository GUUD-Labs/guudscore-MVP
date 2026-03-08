import type { Network } from '@/types';

export interface NFTAttribute {
  value: string;
  trait_type: string;
  display_type?: string;
}

export interface NFTAttributes {
  name: string;
  description?: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes: NFTAttribute[];
  artist?: string;
}

export interface NFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  userId: string;
  name: string;
  image: string;
  tokenUri: string | null;
  attributes: NFTAttributes;
  nftType: 'ERC721' | 'ERC1155';
  isAvatar: boolean;
  createdAt: string;
  updatedAt: string;
  collectionName: string;
  collectionImageUrl: string | null;
  collectionDescription: string | null;
  floorPrice: number | null;
  description: string | null;
  viewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  network: Network;
}

export interface NFTResponse {
  data: {
    items: NFT[];
    total: number;
  };
  success: boolean;
  message: string;
  count: number;
}

export interface NFTParams {
  startId?: number;
  offset?: number;
  limit?: number;
  collectionId?: string;
  network?: Network;
}

export interface NFTData {
  items: NFT[];
  total: number;
}

export interface NFTCollection {
  contractAddress: string;
  name: string;
  image: string | null;
  description: string | null;
  floorPrice: number | null;
  itemCount: number;
  network: string;
  isVerified: boolean;
}

export interface UserNFTCollection {
  id: string;
  name: string;
  slug: string;
  network: Network;
  address: string;
  imageUrl: string | null;
  description: string | null;
  verified: boolean;
  userNftCount: number;
}

export interface UserNFTCollectionsResponse {
  data: UserNFTCollection[];
  count: number;
}

export interface NFTStats {
  totalNFTs: number;
  totalCollections: number;
  networks: string[];
  valueEstimate?: number;
}
