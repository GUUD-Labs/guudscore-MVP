/**
 * Bribe System Types
 */

// Wallet types
export type BribeWalletType = 'EVM' | 'SOL';

// Network types for bribe
export type BribeNetwork = 'AVAX' | 'BASE' | 'ARBITRUM' | 'MONAD' | 'SOLANA';

// Bribe wallet settings response
export interface BribeWalletSettings {
  evmBribeWallet: string | null;
  solBribeWallet: string | null;
  evmBribeEnabled: boolean;
  solBribeEnabled: boolean;
  isAutoSelected?: boolean; // true if wallets were auto-selected from public wallets
}

// Set bribe wallet request
export interface SetBribeWalletRequest {
  walletAddress: string;
  walletType: BribeWalletType;
}

// Bribeable user from API
export interface BribeableUser {
  id: string;
  name: string;
  slug: string;
  evmBribeWallet: string | null;
  solBribeWallet: string | null;
  bribeWallet: string | null; // Based on selected network
  photo: string | null;
  rank: number;
  guudScore: number;
  nftCollection?: string; // NFT collection address (when filtered by NFT)
}

// Bribe users filter
export type BribeUsersFilter = 'top10' | 'top50' | 'top100' | 'top500';

// Record bribe request
export interface RecordBribeRequest {
  receiverId: string;
  network: BribeNetwork;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals?: number;
  amount: string; // Wei/Lamports as string (BigInt)
  amountUsd?: number;
  message?: string;
  txHash: string;
  senderWallet: string;
  receiverWallet: string;
}

// Bribe user info (sender/receiver)
export interface BribeUserInfo {
  id: string;
  name: string;
  slug: string;
  photo: string | null;
}

// Bribe record response
export interface BribeRecord {
  id: string;
  network: BribeNetwork;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  amount: string;
  amountUsd: number | null;
  message: string | null;
  txHash: string;
  createdAt: string;
  sender: BribeUserInfo;
  receiver: BribeUserInfo;
}

// Bribe history filter
export type BribeHistoryType = 'sent' | 'received' | 'all';

// Bribe history params
export interface BribeHistoryParams {
  type?: BribeHistoryType;
  network?: BribeNetwork;
  limit?: number;
  offset?: number;
}

// Bribe history response
export interface BribeHistoryResponse {
  items: BribeRecord[];
  total: number;
}

// Bribe stats
export interface BribeStats {
  totalSent: number;
  totalReceived: number;
  totalSentUsd: number;
  totalReceivedUsd: number;
  uniqueSenders: number;
  uniqueReceivers: number;
}

// Bribe estimate (from contract)
export interface BribeEstimate {
  amountPerRecipient: bigint;
  totalFee: bigint;
  actualTotal: bigint;
}

// Token for bribe selection
export interface BribeToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
  balance?: string;
  balanceUsd?: number;
}

// Bribe modal state
export interface BribeModalState {
  isOpen: boolean;
  recipient?: BribeableUser;
  recipientType: 'single' | 'top10' | 'top100' | 'top500';
}
