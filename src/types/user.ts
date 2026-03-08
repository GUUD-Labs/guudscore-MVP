import type { NFTData } from '@/types';

import type { User } from './auth';

export interface UserSocial {
  id?: string;
  platform: string;
  url: string;
  visible: boolean;
}

export interface UserCustomLinks {
  id?: string;
  name: string;
  url: string;
  color: string;
  visible: boolean;
}

// Update request types
export interface CreateSocialLinkRequest {
  platform: string;
  url: string;
  isPublic?: boolean;
}

export interface UpdateSocialLinkRequest {
  id: string;
  platform?: string;
  url?: string;
  isPublic?: boolean;
}

export interface CreateCustomLinkRequest {
  name: string;
  url: string;
  color?: string;
  isPublic?: boolean;
}

export interface UpdateCustomLinkRequest {
  id: string;
  name?: string;
  url?: string;
  color?: string;
  isPublic?: boolean;
}

export interface BadgeSelectionRequest {
  selectedBadges: Array<{
    id: string;
    type: 'poap' | 'nft';
    priority: number;
  }>;
}

export interface UserBadgeBase {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  image?: string;
}

export interface ExtendedUser extends Omit<User, 'photo'> {
  // Override photo to allow both formats for backward compatibility
  photo?: { id: string; url: string; fileEntityId: string } | { url: string } | string;
  wallets?: Array<{
    id: string;
    walletAddress: string;
    ensName: string | null;
    ensAvatar: string | null;
  }>;
  social?: Array<UserSocial>;
  custom?: Array<UserCustomLinks>;
  nft: NFTData['items'];
  badges?: {
    userBadges: Array<
      UserBadgeBase & {
        color?: string;
        isVisible?: boolean;
        priority?: number;
      }
    >;
    poapBadges: Array<
      UserBadgeBase & {
        chain: string;
        eventId: number;
        tokenId: string;
        owner: string;
        mintedAt: string;
        isVisible: boolean;
        priority: number;
        network?: string; // Which network this POAP is featured on
        visibleOnNetwork?: string; // NEW: Chain-specific visibility
        createdAt: string;
        updatedAt: string;
        event: {
          id: string;
          eventId: number;
          fancyId: string;
          name: string;
          description: string;
          country?: string;
          city?: string;
          startDate: string;
          endDate: string;
          eventUrl?: string;
          imageUrl: string;
          year: number;
          createdAt: string;
          updatedAt: string;
        };
      }
    >;
    nftBadges: Array<
      UserBadgeBase & {
        contractAddress: string;
        tokenId: string;
        collectionName?: string;
        badgeIcon?: string; // Badge image URL from backend
        isVisible: boolean;
        priority: number;
        network?: string; // Which network this NFT badge belongs to (AVAX, BASE, SOLANA)
      }
    >;
  };
  guudScore?: {
    totalScore: number;
    tier: string;
    rank: number;
  };
  // Multi-chain data
  twitterFollowers?: number;
  twitterFollowing?: number;
  twitterLastSynced?: string; // ISO date string
  chainScores?: {
    AVAX?: number;
    BASE?: number;
    SOLANA?: number;
    ARBITRUM?: number;
  };
  totalGuudScore?: number;
  totalPortfolioValue?: number;
  chainPortfolios?: {
    AVAX?: number;
    BASE?: number;
    SOLANA?: number;
    ARBITRUM?: number;
    MONAD?: number;
  };
  guudFriends?: Array<{
    id: string;
    name: string;
    slug: string;
    photoUrl: string | null;
  }>;
  guudFriendsCount?: number;
  connectedPlatforms?: string[];
  // Bribe wallet settings
  evmBribeWallet?: string | null;
  solBribeWallet?: string | null;
  evmBribeEnabled?: boolean;
  solBribeEnabled?: boolean;
  isAutoSelected?: boolean; // true if bribe wallets were auto-selected from public wallets
  // Arena yapping
  arenaYappingEnabled?: boolean;
  arenaPoints?: number;
  // Profile visibility settings
  profileVisibility?: {
    showTwitterStats?: boolean;
    showPortfolio?: boolean;
    showNFTs?: boolean;
    showFriends?: boolean;
    showSocialLinks?: boolean;
    showConnectedPlatforms?: boolean;
  };
}

interface DashboardMetricsMetadata {
  tierProgress: number;
  protocolsUsed: number;
}

interface GuudFriendsListItem {
  id: string;
  name: string;
  email: string | null;
  slug: string | null;
  photoUrl: string | null;
  social: Array<{
    platform: string;
    url: string;
    visible: boolean;
  }>;
  connectionId: string;
}

export interface DashboardMetrics {
  guudScore: number;
  reputation: {
    current: number;
    ytd: number;
    tier: string;
  };
  guudFriends: {
    list: GuudFriendsListItem[];
    total: number;
    ytd: number;
  };
  ecosystemImpact: {
    current: number;
    ytd: number;
  };
  metadata: DashboardMetricsMetadata;
}

// User search types
export interface UserSearchResult {
  id: string;
  name: string;
  slug: string | null;
  photo: string | null;
}

export interface UserSearchParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Referral stats types
export interface ReferralStats {
  totalReferrals: number;
  referralScore: number;
}
