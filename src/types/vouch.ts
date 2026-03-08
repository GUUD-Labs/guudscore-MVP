// Vouch System Types

export enum VouchType {
  LIKE = 'LIKE',
  DISLIKE = 'DISLIKE'
}

export enum VouchTransactionType {
  TWITTER_SIGNUP = 'TWITTER_SIGNUP',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  LEADERBOARD_REWARD = 'LEADERBOARD_REWARD',
  LIKE_SPENT = 'LIKE_SPENT',
  DISLIKE_SPENT = 'DISLIKE_SPENT',
  LIKE_REMOVED = 'LIKE_REMOVED',
  DISLIKE_REMOVED = 'DISLIKE_REMOVED',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT'
}

export interface VouchBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  likesGiven: number;
  dislikesGiven: number;
  likesReceived: number;
  dislikesReceived: number;
}

export interface UserVouchStats {
  likesReceived: number;
  dislikesReceived: number;
  netScore: number;
  myVouch: VouchType | null;
}

export interface VouchTransaction {
  id: string;
  amount: number;
  type: VouchTransactionType;
  reason: string;
  referenceId?: string;
  network?: string;
  createdAt: string;
}

export interface GiveVouchRequest {
  targetUserId: string;
  vouchType: VouchType;
}

export interface GiveVouchResponse {
  success: boolean;
  message: string;
  newBalance: number;
}

export interface RemoveVouchResponse {
  success: boolean;
  message: string;
}

export interface VouchHistoryResponse {
  transactions: VouchTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface SeasonReward {
  seasonNumber: number;
  network: string;
  rank: number;
  score: number;
  reward: number;
  createdAt: string;
}

export interface RewardsResponse {
  rewards: SeasonReward[];
  totalRewards: number;
}

export interface SeasonInfo {
  seasonNumber: number;
  network: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  isActive: boolean;
}

// User who gave a vouch
export interface VoucherUser {
  id: string;
  name: string;
  slug?: string;
  twitterUsername?: string;
  profileImage?: string;
}

export interface ReceivedVouch {
  user: VoucherUser;
  createdAt: string;
}

export interface ReceivedVouchesResponse {
  likes: ReceivedVouch[];
  dislikes: ReceivedVouch[];
}
