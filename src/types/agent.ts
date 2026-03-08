import type { LeaderboardPagination, LeaderboardUser, GuudScoreBreakdown, Tier, Trend } from './leaderboard';

// Agent leaderboard entry — main leaderboard ile aynı format
export interface AgentLeaderboardEntry {
  rank: number;
  previousRank: number;
  change: string;
  trend: Trend;
  user: LeaderboardUser & { slug?: string };
  guudScore: number;
  tier: Tier;
  breakdown: GuudScoreBreakdown;
  topBadge: null;
  arenaYappingEnabled: boolean;
  isFriend: boolean;
  likesCount: number;
  dislikesCount: number;
}

export interface AgentLeaderboardData {
  leaderboard: AgentLeaderboardEntry[];
  pagination: LeaderboardPagination;
  stats: {
    totalAgents: number;
  };
}

export interface AgentLeaderboardParams {
  page?: number;
  limit?: number;
  tier?: Tier;
  activityWindow?: 'last_30_days' | 'last_90_days';
  network?: 'AVAX' | 'BASE' | 'SOLANA' | 'ARBITRUM' | 'MONAD';
}

// Agent profil detayı
export interface AgentGuudScore {
  network: string;
  totalScore: number;
  tier: string;
  tokenHoldingsScore: number;
  nftHoldingsScore: number;
  protocolUsageScore: number;
  referralScore: number;
  rank: number;
  percentile: number;
  lastCalculatedAt: string;
}

export interface AgentVouchBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  likesGiven: number;
  dislikesGiven: number;
  likesReceived: number;
  dislikesReceived: number;
}

export interface AgentProfileData {
  agent: {
    id: string;
    name: string;
    slug: string;
    profilePicture: string | null;
    wallets: Array<{ walletAddress: string; network: string }>;
    createdAt: string;
  };
  guudScores: AgentGuudScore[];
  vouchBalance: AgentVouchBalance | null;
  arena: {
    handle: string | null;
    enabled: boolean;
    points: number;
  };
  stats: {
    totalBribesSent: number;
    totalBribesReceived: number;
    totalNfts: number;
    badgeCount: number;
    portfolioValue: number;
  };
}
