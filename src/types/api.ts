// Base API types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  count: number;
}

export interface ApiErrorResponse {
  message: string;
  status?: number;
  code?: string;
}

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Response Types for Alpha Analytics endpoint
export interface CommunityOverview {
  trackedWallets: number;
  communityAUM: {
    total: string;
  };
  avgPortfolio: {
    value: string;
  };
  nftSentiment: {
    percentage: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    description: string;
    buyCount: number;
    sellCount: number;
  };
}

export interface Asset {
  symbol: string;
  name: string;
  logo?: string | null;
  tokenAddress?: string; // Token contract address for image lookup
  walletCount?: number;
  percentage: number;
  totalValue: string;
  avgHolding?: string;
}

export interface TopAssets {
  mostHeldByWalletCount: Asset[];
  largestAllocationByUSD: Asset[];
}

export interface Protocol {
  name: string;
  category: string;
  userCount: number;
  percentage: number;
  totalTransactions: number;
  contractAddress?: string;
  interactionCount?: number;
}

export interface ProtocolAnalytics {
  protocols: Protocol[];
  timeWindow: string;
}

export interface AnalyticsNFTCollection {
  id: string;
  contractAddress: string;
  name: string;
  logo?: string | null;
  network: string;
  holderCount: number;
  percentage: number;
  totalNfts: number;
  avgNftsPerHolder: number;
}

export interface NFTCollections {
  collections: AnalyticsNFTCollection[];
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface ScoreStats {
  totalUsers: number;
  totalScoreInCirculation: number;
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
}

export interface ScoreData {
  distribution: ScoreDistribution[];
  stats: ScoreStats;
}

// Main Dashboard Data Interface (Alpha Analytics Response)
export interface DashboardData {
  communityOverview: CommunityOverview;
  topAssets: TopAssets;
  protocolAnalytics: ProtocolAnalytics;
  nftCollections: NFTCollections;
  scoreDistribution: ScoreData;
}

// Service Response Types
export type DashboardResponse = DashboardData;

// Error Types
export interface ServiceError {
  message: string;
  code?: string;
  status?: number;
  timestamp: string;
}
