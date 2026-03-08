// Leaderboard related types
export interface LeaderboardUser {
  id: string;
  username: string;
  profilePicture: string | null;
  twitterUrl: string | null;
  evmBribeWallet?: string | null;
  solBribeWallet?: string | null;
  arenaYappingEnabled?: boolean;
  arenaPoints?: number;
}

export interface GuudScoreBreakdown {
  tokenHoldings: number;
  nftHoldings: number;
  protocolUsage: number;
}

export interface LeaderboardBadge {
  id: string;
  tokenId?: string;
  contractAddress?: string;
  type: 'NFT_BADGE' | 'POAP_BADGE';
  name: string;
  icon: string;
  network?: string;
  eventId?: number;
}

export type Tier =
  | 'Tourist'
  | 'Paperhands'
  | 'AVAX Maxi'
  | 'Arena Veteran'
  | 'BASE Maxi'
  | 'Virtuals Virgen'
  | 'SOL Maxi'
  | 'PumpFun Degen'
  | 'Arbitrumer'
  | 'Arbitrum OG'
  | 'Monad Maxi'
  | 'Monad Pioneer'
  | 'Guudlord';

export type Trend = 'up' | 'down' | 'same';

export type ActivityWindow = 'last_30_days' | 'last_90_days';

export interface LeaderboardEntry {
  breakdown: GuudScoreBreakdown;
  change: string;
  rank: number;
  previousRank: number;
  trend: Trend;
  user: LeaderboardUser & { slug?: string };
  guudScore: number;
  tier: Tier;
  topBadge: LeaderboardBadge | null;
  isFriend: boolean;
  likesCount?: number;
  dislikesCount?: number;
  evmBribeWallet?: string | null;
  solBribeWallet?: string | null;
  arenaYappingEnabled?: boolean;
}

export interface CurrentUserEntry extends LeaderboardEntry {
  isEstimated: boolean;
}

export interface LeaderboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LeaderboardStats {
  averageScore: number;
  scoreDistribution: Record<Tier, number>;
}

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  pagination: LeaderboardPagination;
  stats: LeaderboardStats;
  lastUpdated: string;
  currentUser?: CurrentUserEntry;
}

export interface LeaderboardParams {
  page?: number;
  limit?: number;
  tier?: Tier;
  activityWindow?: ActivityWindow;
  network?: 'AVAX' | 'BASE' | 'SOLANA' | 'ARBITRUM' | 'MONAD';
  nftCollection?: string;
}

export interface LeaderboardResponse {
  data: {
    success: boolean;
    data: LeaderboardData;
  };
  success: boolean;
  message: string;
  count: number;
}
