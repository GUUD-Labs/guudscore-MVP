export interface GuudScoreHistory {
  date: string;
  score: number;
}

// Assets-related types
export interface AssetHolding {
  name: string;
  symbol: string;
  logo: string;
  valueUSD: number;
  percentage: number;
  quantity?: number;
  walletAddress?: string;
}

export interface TokenHoldings {
  score: number;
  valueUSD: number;
  breakdown: string;
  topHoldings: AssetHolding[];
}

export interface AssetHistoryData {
  date: string;
  totalAssets: number;
  totalValueUSD: number;
}

export interface AssetsData {
  tokenHoldings: TokenHoldings;
  historyData: AssetHistoryData[];
}
