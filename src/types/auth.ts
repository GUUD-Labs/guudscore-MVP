// Wallet sign-in types
export type WalletType = 'EVM' | 'SOL';

export interface WalletNonceRequest {
  walletAddress: string;
  walletType: WalletType;
}

export interface WalletNonceResponse {
  nonce: string;
  messageToSign: string;
}

export interface WalletVerifyRequest {
  walletAddress: string;
  signature: string;
  walletType: WalletType;
  ref?: string;
}

export interface WalletVerifyResponse {
  accessToken: string;
  isNewUser: boolean;
  user: { id: string; name: string; slug: string };
}

// Auth request types
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  username?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface WalletLinkRequest {
  walletAddress: string;
  signature: string;
  network?: 'AVAX' | 'BASE' | 'SOLANA';
  ensName?: string;
  ensAvatar?: string;
}

export interface EmailVerifyRequest {
  email: string;
  otp: string;
}

export interface RequestVerificationRequest {
  email: string;
}

export interface RequestResetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Auth response types
export interface User {
  id: string;
  nonce: string;
  name: string;
  avatarId: string;
  photo?: { id: string; url: string; fileEntityId: string };
  title: string;
  bio: string;
  email: string;
  emailVerified: boolean;
  password: string;
  slug: string | null;
  role: string;
  slugUpdatedAt: string | null;
  searchVisibility: boolean;
  status: string;
  themeId: string;
  fontId: string;
  isPublicNft: boolean;
  privacySettings: any;
  displayBadges: boolean;
  displayGuudScore: boolean;
  viewCount: number;
  lastLoginAt: string | null;
  isSynced: boolean;
  lastSyncedAt: string;
  lastTransactionHash: string | null;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
  // Legacy properties for backward compatibility
  username?: string;
  profilePicture?: string;
  walletAddress?: string;
  ensName?: string;
  ensAvatar?: string;
  isEmailVerified: boolean;
  twitterName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ValidateResponse {
  valid: boolean;
  user?: User;
}
