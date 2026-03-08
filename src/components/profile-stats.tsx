import { Link } from '@tanstack/react-router';
import { ExternalLink, Globe, Users, Wallet } from 'lucide-react';

import Icons from '@/components/icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { type ChainNetwork } from '@/lib/tier-utils';
import { cn } from '@/lib/utils';

// Chain icons
const ChainIcon = ({ chain, className }: { chain: ChainNetwork; className?: string }) => {
  switch (chain) {
    case 'AVAX':
      return (
        <svg viewBox="0 0 254 254" className={className} fill="currentColor">
          <circle cx="127" cy="127" r="127" fill="#E84142" />
          <path
            d="M171.8 130.3c4.4-7.6 11.5-7.6 15.9 0l27.4 48.1c4.4 7.6.8 13.8-8 13.8h-55.5c-8.7 0-12.3-6.2-8-13.8l28.2-48.1zm-45.7-79.5c4.4-7.6 11.4-7.6 15.8 0l6.1 11.2 14.7 26.6c3.5 7.2 3.5 15.7 0 22.9L122.5 178c-4.4 7.2-12.1 11.7-20.6 11.7H46.5c-8.8 0-12.4-6.1-8-13.7l87.6-124.2z"
            fill="white"
          />
        </svg>
      );
    case 'BASE':
      return (
        <svg viewBox="0 0 111 111" className={className}>
          <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF" />
        </svg>
      );
    case 'SOLANA':
      return (
        <svg viewBox="0 0 397.7 311.7" className={className}>
          <linearGradient id="solana-a" x1="360.879" x2="141.213" y1="-37.455" y2="320.332" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#00ffa3" />
            <stop offset="1" stopColor="#dc1fff" />
          </linearGradient>
          <path fill="url(#solana-a)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" />
          <path fill="url(#solana-a)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" />
          <path fill="url(#solana-a)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1z" />
        </svg>
      );
    case 'ARBITRUM':
      return (
        <img src="/arbitrum.svg" alt="Arbitrum" className={className} />
      );
    case 'MONAD':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="100" fill="#7B3FE4" />
          <path d="M100 40L140 80L100 120L60 80L100 40Z" fill="white" />
          <path d="M100 80L140 120L100 160L60 120L100 80Z" fill="white" opacity="0.7" />
        </svg>
      );
  }
};

export interface ProfileStatsData {
  // Twitter stats
  twitterFollowers?: number;
  twitterFollowing?: number;
  // Multi-chain GuudScore
  chainScores?: {
    AVAX?: number;
    BASE?: number;
    SOLANA?: number;
    ARBITRUM?: number;
    MONAD?: number;
  };
  totalGuudScore?: number;
  // Portfolio
  totalPortfolioValue?: number;
  chainPortfolios?: {
    AVAX?: number;
    BASE?: number;
    SOLANA?: number;
    ARBITRUM?: number;
    MONAD?: number;
  };
  // NFTs
  totalNFTs?: number;
  chainNFTs?: {
    AVAX?: number;
    BASE?: number;
    SOLANA?: number;
    ARBITRUM?: number;
    MONAD?: number;
  };
  // Friends
  guudFriends?: Array<{
    id: string;
    name: string;
    slug: string;
    photoUrl: string | null;
  }>;
  guudFriendsCount?: number;
  // Social Links
  socialLinks?: Array<{
    platform: string;
    url: string;
    visible: boolean;
  }>;
  customLinks?: Array<{
    name: string;
    url: string;
    color: string;
    visible: boolean;
  }>;
  // Connected wallets
  wallets?: Array<{
    id: string;
    walletAddress: string;
    chain?: 'evm' | 'solana';
    ensName?: string | null;
  }>;
  // Vouch stats
  userId?: string;
  vouchStats?: {
    likesReceived: number;
    dislikesReceived: number;
    netScore: number;
  };
}

export interface ProfileVisibilitySettings {
  showTwitterStats?: boolean;
  showGuudScore?: boolean;
  showPortfolio?: boolean;
  showNFTs?: boolean;
  showFriends?: boolean;
  showSocialLinks?: boolean;
  showConnectedPlatforms?: boolean;
}

interface ProfileStatsProps {
  data: ProfileStatsData;
  visibility?: ProfileVisibilitySettings;
  isLoading?: boolean;
  isOwnProfile?: boolean;
  className?: string;
}

const StatSection = ({
  title,
  children,
  className,
  showDivider = true,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  showDivider?: boolean;
}) => (
  <div className={cn('relative', showDivider && 'border-t border-glass-border', className)}>
    <div className="p-4">
      <h4 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
        {title}
      </h4>
      {children}
    </div>
  </div>
);

const SocialIcon = ({ platform }: { platform: string }) => {
  const iconClass = 'size-4';
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      return <Icons.xLogo className={iconClass} />;
    case 'discord':
      return <Icons.discord className={iconClass} />;
    case 'telegram':
      return <Icons.telegram className={iconClass} />;
    case 'github':
      return <Icons.github className={iconClass} />;
    case 'instagram':
      return <Icons.instagram className={iconClass} />;
    case 'linkedin':
      return <Icons.linkedin className={iconClass} />;
    default:
      return <Globe className={iconClass} />;
  }
};

export const ProfileStats = ({
  data,
  visibility = {},
  isLoading = false,
  isOwnProfile: _isOwnProfile = false,
  className,
}: ProfileStatsProps) => {
  // isOwnProfile is available for future use
  void _isOwnProfile;

  const {
    showTwitterStats = true,
    showGuudScore = true,
    showNFTs = true,
    showFriends = true,
    showSocialLinks = true,
    showConnectedPlatforms = true,
  } = visibility;

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass rounded-lg p-4">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '-';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const chainOrder: ChainNetwork[] = ['AVAX', 'BASE', 'SOLANA', 'ARBITRUM'];

  return (
    <div className={cn('glass rounded-lg overflow-hidden', className)}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3">
        {/* Twitter Stats */}
        <StatSection title="X (Twitter)" showDivider={false}>
          {showTwitterStats && (data.twitterFollowers != null || data.twitterFollowing != null) ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Followers</span>
                <span className="font-pixel text-xl text-primary">
                  {formatNumber(data.twitterFollowers)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Following</span>
                <span className="font-pixel text-lg">
                  {formatNumber(data.twitterFollowing)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <span className="text-muted-foreground text-sm">Hidden</span>
            </div>
          )}
        </StatSection>

        {/* Multi-chain GuudScore */}
        <StatSection title="GuudScore" className="border-t border-glass-border md:border-t-0 md:border-l" showDivider={false}>
          {showGuudScore && data.chainScores ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Total</span>
                <span className="font-pixel text-xl text-primary">
                  {formatNumber(data.totalGuudScore)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {chainOrder.map(chain => {
                  const score = data.chainScores?.[chain];
                  if (score === undefined) return null;
                  return (
                    <div
                      key={chain}
                      className="flex items-center gap-1.5 rounded-full bg-muted/30 px-2 py-1"
                    >
                      <ChainIcon chain={chain} className="size-3" />
                      <span className="text-xs">{formatNumber(score)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <span className="text-muted-foreground text-sm">Hidden</span>
            </div>
          )}
        </StatSection>

        {/* NFTs */}
        <StatSection title="NFT Collection" className="border-t border-glass-border lg:border-t-0 lg:border-l" showDivider={false}>
          {!showNFTs ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-muted-foreground text-sm">Hidden</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Total NFTs</span>
                <span className="font-pixel text-xl">{formatNumber(data.totalNFTs ?? 0)}</span>
              </div>
              {data.chainNFTs && Object.keys(data.chainNFTs).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chainOrder.map(chain => {
                    const count = data.chainNFTs?.[chain];
                    if (count === undefined || count === 0) return null;
                    return (
                      <div
                        key={chain}
                        className="flex items-center gap-1.5 rounded-full bg-muted/30 px-2 py-1"
                      >
                        <ChainIcon chain={chain} className="size-3" />
                        <span className="text-xs">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </StatSection>

        {/* GuudFriends */}
        <StatSection title="Guud Friends" className="border-t border-glass-border" showDivider={false}>
          {!showFriends ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-muted-foreground text-sm">Hidden</span>
            </div>
          ) : data.guudFriends && data.guudFriends.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex -space-x-2">
                {data.guudFriends.slice(0, 5).map(friend => (
                  <Link
                    key={friend.id}
                    to="/profile/$username"
                    params={{ username: friend.slug }}
                    className="transition-transform hover:z-10 hover:scale-110"
                  >
                    <ProfileAvatar
                      src={friend.photoUrl}
                      alt={friend.name}
                      name={friend.name}
                      size="xs"
                      className="ring-background size-8 ring-2"
                    />
                  </Link>
                ))}
                {(data.guudFriendsCount || 0) > 5 && (
                  <div className="ring-background bg-muted flex size-8 items-center justify-center rounded-full ring-2">
                    <span className="text-xs">+{(data.guudFriendsCount || 0) - 5}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <Users className="text-muted-foreground size-4" />
                <span className="font-pixel text-lg">{data.guudFriendsCount || 0}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-1.5">
                <Users className="text-muted-foreground size-4" />
                <span className="font-pixel text-lg">0</span>
              </div>
            </div>
          )}
        </StatSection>

        {/* Social Links */}
        <StatSection title="Social Links" className="border-t border-glass-border md:border-l" showDivider={false}>
          {showSocialLinks && data.socialLinks && data.socialLinks.filter(s => s.visible && s.platform.toLowerCase() !== 'twitter').length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.socialLinks
                .filter(link => link.visible && link.platform.toLowerCase() !== 'twitter')
                .map((link, index) => {
                  // Ensure URL has protocol prefix
                  const normalizedUrl = link.url.startsWith('http://') || link.url.startsWith('https://')
                    ? link.url
                    : `https://${link.url}`;
                  
                  return (
                    <a
                      key={index}
                      href={normalizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-primary/10 hover:text-primary flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1.5 transition-colors"
                    >
                      <SocialIcon platform={link.platform} />
                      <span className="text-xs capitalize">{link.platform}</span>
                    </a>
                  );
                })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <span className="text-muted-foreground text-sm">Hidden</span>
            </div>
          )}
        </StatSection>

        {/* Connected Wallets */}
        <StatSection title="Connected Wallets" className="border-t border-glass-border lg:border-l" showDivider={false}>
          {showConnectedPlatforms && data.wallets && data.wallets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(() => {
                const evmWallets: typeof data.wallets = [];
                const solWallets: typeof data.wallets = [];
                const seenAddresses = new Set<string>();
                
                data.wallets.forEach(wallet => {
                  const key = wallet.walletAddress.toLowerCase();
                  if (seenAddresses.has(key)) return;
                  seenAddresses.add(key);
                  
                  const isSolana = wallet.chain === 'solana' || (!wallet.walletAddress.startsWith('0x'));
                  if (isSolana) {
                    solWallets.push(wallet);
                  } else {
                    evmWallets.push(wallet);
                  }
                });
                
                const allWallets = [
                  ...evmWallets.map((w, i) => ({ 
                    ...w, 
                    label: evmWallets.length > 1 ? 'EVM' + (i + 1) : 'EVM',
                    isSolana: false 
                  })),
                  ...solWallets.map((w, i) => ({ 
                    ...w, 
                    label: solWallets.length > 1 ? 'SOL' + (i + 1) : 'SOL',
                    isSolana: true 
                  })),
                ];
                
                return allWallets.map((wallet, index) => {
                  const explorerUrl = wallet.isSolana
                    ? 'https://solscan.io/account/' + wallet.walletAddress
                    : 'https://debank.com/profile/' + wallet.walletAddress;
                  
                  return (
                    <a
                      key={wallet.id || index}
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:bg-muted/50 flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1.5 transition-colors"
                    >
                      {wallet.isSolana ? (
                        <ChainIcon chain="SOLANA" className="size-3.5" />
                      ) : (
                        <Wallet className="size-3 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium">{wallet.label}</span>
                      <ExternalLink className="text-muted-foreground size-3" />
                    </a>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <span className="text-muted-foreground text-sm">Hidden</span>
            </div>
          )}
        </StatSection>
      </div>

      {/* Custom Links - shown separately if exists */}
      {showSocialLinks && data.customLinks && data.customLinks.filter(c => c.visible).length > 0 && (
        <StatSection title="Links" className="border-t border-glass-border" showDivider={false}>
          <div className="flex flex-col gap-2">
            {data.customLinks
              .filter(link => link.visible)
              .map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
                  style={{ borderLeft: `3px solid ${link.color || '#6366f1'}` }}
                >
                  <ExternalLink className="text-muted-foreground size-3" />
                  <span className="text-sm">{link.name}</span>
                </a>
              ))}
          </div>
        </StatSection>
      )}
    </div>
  );
};
