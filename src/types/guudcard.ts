export enum CardType {
  REGULAR = 'REGULAR',
  PREMIUM = 'PREMIUM',
  SPECIAL_EDITION = 'SPECIAL_EDITION',
}

export interface GuudCardListItem {
  id: string;
  userId: string;
  nftId: string;
  cardPhotoId: string;
  name: string;
  collectionName: string;
  slug: string;
  title: string;
  cardType: CardType;
  affiliation: string;
  metadataUrl: string;
  createdAt: string;
  updatedAt: string;
  nft: {
    id: string;
    name: string;
    image: string;
    collection: null;
    tokenId: string;
  };
  photo: {
    url: string;
  };
}

export interface GuudCardListParams {
  page: number;
  limit: number;
  cardType?: CardType;
}

export interface GuudCardListResponse {
  cards: GuudCardListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomCardRequest {
  cardPhotoId?: string;
  nftId?: string;
  name: string;
  collectionName: string;
  collectionNumber: string;
  title: string;
  cardType: CardType;
  affiliation: string;
}

export interface CustomCardResponse {
  id: string;
  cardPhotoId: string;
  nftId: string;
  name: string;
  collectionName: string;
  slug: string;
  title: string;
  cardType: CardType;
  affiliation: string;
}

// Get card by ID types
export interface GuudCardDetail {
  id: string;
  userId: string;
  nftId: string | null;
  cardPhotoId: string;
  name: string;
  collectionName: string;
  slug: string;
  title: string;
  cardType: CardType;
  affiliation: string;
  createdAt: string;
  updatedAt: string;
  nft: {
    id: string;
    name: string;
    image: string;
    collection: null;
    tokenId: string;
  } | null;
  photo: {
    url: string;
  };
}

export interface GuudCardDetailResponse {
  data: GuudCardDetail;
  success: boolean;
  message: string;
  count: number;
}

// Mint card types
export interface MintCardResponse {
  data: string; // methodData hex string
  success: boolean;
  message: string;
  count: number;
}

// Sign transaction types
export interface SignTransactionRequest {
  methodData: string;
  privateKey: string;
}

export interface SignTransactionResponse {
  data: {
    transactionHash: string;
  };
  success: boolean;
  message: string;
  count: number;
}
