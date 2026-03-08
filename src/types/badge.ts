// Badge types
export interface Apibadge {
  id: string;
  type: 'POAP_BADGE' | 'NFT_BADGE' | 'USER_BADGE';
  name: string;
  description: string;
  imageUrl: string;
  isFeatured: boolean;
  metadata: POAPBadgeMetadata | NFTBadgeMetadata | UserBadgeMetadata;
}

export interface POAPBadgeMetadata {
  eventId: number;
  tokenId: string;
  chain: string;
  mintedAt: string;
  visibleOnNetwork?: string; // NEW: Which chain this POAP is featured on
  event: POAPEvent;
}

export interface POAPEvent {
  id: string;
  eventId: number;
  fancyId: string;
  name: string;
  description: string;
  city: string | null;
  country: string | null;
  startDate: string;
  endDate: string;
  eventUrl: string;
  imageUrl: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface NFTBadgeMetadata {
  contractAddress: string;
  tokenId: string;
  network: string;
  priority: number;
  createdAt: string;
}

export interface UserBadgeMetadata {
  color?: string;
  createdAt: string;
}

// API Response types
export interface BadgeListResponse {
  badges: Apibadge[];
  totalCount: number;
}

// Request types
export interface BadgeListParams {
  page?: number;
  limit?: number;
  network?: string;
}

// ==========================================
// Seasonal Badge Types (Quarter Season System)
// ==========================================

export type NetworkType = 'AVAX' | 'BASE' | 'SOLANA' | 'ARBITRUM' | 'MONAD';

export type SeasonStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type SeasonTier = 'Tourist' | 'Paperhands' | 'Maxi' | 'Arena Veteran' | 'Guudlord';

export interface Season {
  id: string;
  name: string; // "Q1 2026 AVAX"
  quarter: 1 | 2 | 3 | 4;
  year: number;
  network: NetworkType;
  startDate: string;
  endDate: string;
  snapshotDate: string;
  status: SeasonStatus;
  stats?: SeasonStats;
}

export interface SeasonStats {
  totalUsers: number;
  snapshotCompleted: number;
  badgesAwarded: number;
  averageScore: number;
  tierDistribution?: Record<string, number>;
}

export interface SeasonSnapshot {
  id: string;
  seasonId: string;
  userId: string;
  username?: string;
  totalScore: number;
  tokenHoldingsScore: number;
  nftHoldingsScore: number;
  protocolUsageScore: number;
  referralScore: number;
  tier: string;
  rank?: number;
  totalAssets: number;
  totalValueUSD: number;
  badgeAwarded: boolean;
  badgeAwardedAt?: string;
  snapshotAt: string;
}

export interface SeasonBadge {
  id: string;
  seasonId: string;
  seasonName: string; // "Q1 2026 AVAX"
  network: NetworkType;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  tier: string; // "Guudlord", "AVAX Maxi", etc.
  rarity: BadgeRarity;
  score: number;
  rank: number;
  totalUsers: number;
  awardedAt: string;
  nftTokenId?: string; // NFT token ID (if minted on EVM chains)
  nftContractAddress?: string;
  imageUrl?: string;
}

export interface UserSeasonHistory {
  id: string;
  seasonId: string;
  seasonName: string;
  network: NetworkType;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  totalScore: number;
  tier: string;
  rank: number;
  badgeAwarded: boolean;
  snapshotAt: string;
}

// API Response types for Seasons
export interface SeasonListResponse {
  data: Season[];
  total: number;
  page: number;
  limit: number;
}

export interface SeasonLeaderboardResponse {
  data: SeasonSnapshot[];
  total: number;
  page: number;
  limit: number;
}

export interface UserSeasonHistoryResponse {
  data: UserSeasonHistory[];
  total: number;
  page: number;
  limit: number;
}

export interface SeasonBadgeStatsResponse {
  seasonId: string;
  seasonName: string;
  network: NetworkType;
  totalBadgesAwarded: number;
  nftsMinted: number;
  mintingFailed: number;
  tierBreakdown: Record<string, {
    count: number;
    percentage: number;
    nftsMinted: number;
  }>;
}

// Request types for Seasons
export interface SeasonListParams {
  page?: number;
  limit?: number;
  status?: SeasonStatus;
  network?: NetworkType;
}

export interface SeasonLeaderboardParams {
  seasonId: string;
  page?: number;
  limit?: number;
  tier?: string;
  network?: string;
}
