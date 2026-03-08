import { useEffect, useMemo, useState } from 'react';

import { useLocation, useParams } from '@tanstack/react-router';

import ArenaAvatarFrame from '@/components/arena-avatar-frame';
import Icons from '@/components/icons';
import { LeaderboardSeasonalBadge } from '@/components/leaderboard-seasonal-badge';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VouchButtons } from '@/components/vouch-buttons';
import { useAuthContext } from '@/contexts/auth-context';
import { useChain } from '@/contexts/chain-context';
import {
    useAgentIds,
    useArenaConnectionStatus,
    useArenaStats,
    useCompleteProfile,
    useConnections,
    useCurrentUser,
    useSendConnectionRequest,
    useSentRequests,
    useUserByKey,
} from '@/hooks';
import { isSeasonalBadgeName } from '@/lib/seasonal-badge-utils';
import {
    getFontClass,
    getThemeAvatarClass,
    getThemeBadgeClass,
    getThemeClass,
    getThemeMutedTextClass,
    getThemeSocialIconClass,
    getThemeTextClass,
} from '@/lib/theme-constants';
import { getTierBadgeImage, getTierName, type ChainNetwork } from '@/lib/tier-utils';
import { cn } from '@/lib/utils';

interface WhitelistCollection {
  contract_address: string;
  name: string;
  symbol: string;
  collection_logo?: string;
}

interface SolanaCollection {
  collection_mint: string;
  name: string;
  symbol: string;
  standard: string;
  marketplace_slug: string;
  collection_image: string;
}

interface WhitelistData {
  collections: WhitelistCollection[];
}

interface SolanaWhitelistData {
  collections: SolanaCollection[];
}

// NFT Whitelist caches
let whitelistCache: WhitelistData | null = null;
let baseWhitelistCache: WhitelistData | null = null;
let solanaWhitelistCache: SolanaWhitelistData | null = null;
let arbitrumWhitelistCache: WhitelistData | null = null;

const loadNFTWhitelist = async (): Promise<WhitelistData | null> => {
  if (whitelistCache) return whitelistCache;

  try {
    const response = await fetch('/whitelist-nft.json');
    whitelistCache = await response.json();
    return whitelistCache;
  } catch (error) {
    console.error('Failed to load NFT whitelist:', error);
    return null;
  }
};

const loadBaseNFTWhitelist = async (): Promise<WhitelistData | null> => {
  if (baseWhitelistCache) return baseWhitelistCache;

  try {
    const response = await fetch('/base-whitelist-nft.json');
    baseWhitelistCache = await response.json();
    return baseWhitelistCache;
  } catch (error) {
    console.error('Failed to load Base NFT whitelist:', error);
    return null;
  }
};

const loadSolanaNFTWhitelist = async (): Promise<SolanaWhitelistData | null> => {
  if (solanaWhitelistCache) return solanaWhitelistCache;

  try {
    const response = await fetch('/solana-whitelist-nft.json');
    solanaWhitelistCache = await response.json();
    return solanaWhitelistCache;
  } catch (error) {
    console.error('Failed to load Solana NFT whitelist:', error);
    return null;
  }
};

const loadArbitrumNFTWhitelist = async (): Promise<WhitelistData | null> => {
  if (arbitrumWhitelistCache) return arbitrumWhitelistCache;

  try {
    const response = await fetch('/arbitrum-whitelist-nft.json');
    arbitrumWhitelistCache = await response.json();
    return arbitrumWhitelistCache;
  } catch (error) {
    console.error('Failed to load Arbitrum NFT whitelist:', error);
    return null;
  }
};

interface ProfileCardProps {
  username?: string;
  className?: string;
}

export const ProfileCard = ({ username, className }: ProfileCardProps) => {
  const { user } = useAuthContext();
  const { selectedNetwork } = useChain();
  const location = useLocation();
  const agentIds = useAgentIds();
  const { mutate: sendConnectionRequest, isPending: isSendingRequest } =
    useSendConnectionRequest();

  const { data: sentRequestsData } = useSentRequests();
  const { data: connectionsData } = useConnections();
  const [whitelistData, setWhitelistData] = useState<WhitelistData | null>(
    null
  );
  const [solanaWhitelistData, setSolanaWhitelistData] = useState<SolanaWhitelistData | null>(
    null
  );

  const isSettingsRoute = location.pathname.startsWith('/profile/settings');

  let urlUsername: string | undefined;
  try {
    const params = useParams({ strict: false });
    urlUsername = (params as any)?.userSlug || (params as any)?.username;
  } catch {
    urlUsername = undefined;
  }

  const targetUsername = username || urlUsername;
  const isCurrentUser =
    isSettingsRoute ||
    !targetUsername ||
    targetUsername === user?.slug ||
    targetUsername === user?.email;

  const currentUserQuery = useCurrentUser();
  const userByKeyQuery = useUserByKey(targetUsername || '', selectedNetwork);
  
  // Get network-specific profile data for current user
  const { data: completeProfileData } = useCompleteProfile();

  // Arena yapping status for current user
  const { data: arenaConnection } = useArenaConnectionStatus();
  const { data: arenaStatsData } = useArenaStats();

  const isArenaActive = isCurrentUser
    && arenaConnection?.found
    && arenaConnection?.status === 'ACTIVE';
  const currentUserArenaPoints = arenaStatsData?.totalPointsEarned ?? 0;

  const query = isCurrentUser ? currentUserQuery : userByKeyQuery;
  const { data: profileData, isLoading, error } = query;

  const displayUser = profileData;
  
  // Use network-specific score for current user
  const networkScore = useMemo(() => {
    if (!isCurrentUser) return null;
    if (!completeProfileData) return null;
    
    // Check if user data exists in response
    if (completeProfileData.user?.guudScore) {
      return completeProfileData.user.guudScore;
    }
    
    // Check if guudScore is nested or direct
    if (completeProfileData.guudScore) {
      return completeProfileData.guudScore;
    }
    // If totalScore is directly in response
    if (typeof completeProfileData.totalScore === 'number') {
      return {
        totalScore: completeProfileData.totalScore,
        tier: completeProfileData.tier,
        rank: completeProfileData.rank,
      };
    }
    
    return null;
  }, [isCurrentUser, completeProfileData]);

  // Load whitelist based on selected network
  useEffect(() => {
    if (selectedNetwork === 'SOLANA') {
      loadSolanaNFTWhitelist().then(setSolanaWhitelistData);
    } else if (selectedNetwork === 'BASE') {
      loadBaseNFTWhitelist().then(setWhitelistData);
    } else if (selectedNetwork === 'ARBITRUM') {
      loadArbitrumNFTWhitelist().then(setWhitelistData);
    } else {
      loadNFTWhitelist().then(setWhitelistData);
    }
  }, [selectedNetwork]);

  const photoUrl = useMemo(() => {
    if (!displayUser) return null;
    if (typeof displayUser.photo === 'string') return displayUser.photo;
    if (
      displayUser.photo &&
      typeof displayUser.photo === 'object' &&
      displayUser.photo.url
    )
      return displayUser.photo.url;
    return null;
  }, [displayUser?.photo]);

  if (isLoading) {
    return (
      <div
        className={cn(
          'glass relative flex animate-pulse flex-col gap-3 overflow-hidden rounded-md p-4 sm:p-5 md:p-6',
          className
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="bg-muted size-24 rounded-full"></div>
          <div className="bg-muted h-6 rounded"></div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-muted h-4 rounded"></div>
          <div className="bg-muted h-4 w-3/4 rounded"></div>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div
        className={cn(
          'glass relative flex flex-col gap-3 overflow-hidden rounded-md p-4 sm:p-5 md:p-6',
          className
        )}
      >
        <div className="text-muted text-center text-sm sm:text-base">
          {error ? 'Failed to load profile' : 'Profile not found'}
        </div>
      </div>
    );
  }

  const generateTags = () => {
    const tags: string[] = [];

    // For current user, use network-specific data from completeProfileData
    const userBadges = isCurrentUser && completeProfileData?.badges?.userBadges 
      ? completeProfileData.badges.userBadges 
      : displayUser?.badges?.userBadges;
    
    const poapBadges = isCurrentUser && completeProfileData?.badges?.poapBadges 
      ? completeProfileData.badges.poapBadges 
      : displayUser?.badges?.poapBadges;

    // Only show visible user badges (these are network-agnostic)
    userBadges?.forEach((badge: any) => {
      if (badge.isVisible && badge.name) {
        tags.push(badge.name);
      }
    });

    // Only show visible POAP badges for EVM networks (AVAX, BASE, ARBITRUM)
    // POAPs are EVM-based and don't exist on Solana
    if (selectedNetwork === 'AVAX' || selectedNetwork === 'BASE' || selectedNetwork === 'ARBITRUM') {
      poapBadges?.forEach((badge: any) => {
        if (badge.isVisible && badge.event?.name) {
          tags.push(badge.event.name);
        }
      });
    }

    return tags.slice(0, 3);
  };

  const getNFTBadges = () => {
    const nftBadges: Array<{
      id: string;
      name: string;
      logo: string | null;
      contractAddress: string;
      isSeasonalBadge: boolean;
    }> = [];

    // For current user, use network-specific data from completeProfileData
    // For other users, use displayUser data
    const badgeSource = isCurrentUser && completeProfileData?.badges?.nftBadges 
      ? completeProfileData.badges.nftBadges 
      : displayUser?.badges?.nftBadges;

    badgeSource?.forEach((badge: any) => {
      if (badge.isVisible && badge.contractAddress) {
        // Filter badges based on selected network
        // Solana addresses don't start with 0x, EVM addresses start with 0x
        const isSolanaAddress = !badge.contractAddress.startsWith('0x');
        const shouldShow = selectedNetwork === 'SOLANA' ? isSolanaAddress : !isSolanaAddress;
        
        if (!shouldShow) return;

        let badgeName = badge.collectionName || badge.name;
        let badgeLogo: string | null = null;

        // Try to get from appropriate whitelist based on network
        if (selectedNetwork === 'SOLANA' && solanaWhitelistData && badge.contractAddress) {
          const collection = solanaWhitelistData.collections.find(
            c =>
              c.collection_mint.toLowerCase() ===
              badge.contractAddress?.toLowerCase()
          );
          if (collection) {
            badgeName = collection.name;
            badgeLogo = collection.collection_image || null;
          }
        } else if (whitelistData && badge.contractAddress) {
          const collection = whitelistData.collections.find(
            c =>
              c.contract_address.toLowerCase() ===
              badge.contractAddress?.toLowerCase()
          );
          if (collection) {
            badgeName = collection.name;
            badgeLogo = collection.collection_logo || null;
          }
        }

        // If no name or name looks like an address, use fallback
        if (!badgeName || badgeName.startsWith('Collection 0x')) {
          badgeName = `Collection ${badge.contractAddress?.slice(0, 8)}...`;
        }

        // Check if this is a seasonal badge (e.g., "Q1 2026 AVAX Maxi")
        const isSeasonal = isSeasonalBadgeName(badgeName);

        nftBadges.push({
          id: badge.id,
          name: badgeName || 'NFT',
          logo: badgeLogo,
          contractAddress: badge.contractAddress || '',
          isSeasonalBadge: isSeasonal,
        });
      }
    });

    return nftBadges.slice(0, 3);
  };

  const displayData = {
    id: displayUser?.id,
    name: displayUser?.name,
    bio: displayUser?.bio || 'No bio available',
    description: displayUser?.title,
    // For current user: always use network-specific score (networkScore is never null for current user after fetch)
    // For other users: use their default score
    guudScore: isCurrentUser && networkScore !== null 
      ? networkScore.totalScore 
      : (displayUser?.guudScore?.totalScore ?? 0),
    tier: isCurrentUser && networkScore !== null 
      ? networkScore.tier 
      : (displayUser?.guudScore?.tier ?? 'Unranked'),
    rank: isCurrentUser && networkScore !== null 
      ? networkScore.rank 
      : (displayUser?.guudScore?.rank ?? null),
    tags: generateTags(),
    social: displayUser?.social,
    fontId: displayUser?.fontId,
    themeId: displayUser?.themeId,
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-[linear-gradient(225deg,var(--rank-first),transparent_45%)]';
      case 2:
        return 'bg-[linear-gradient(225deg,var(--rank-second),transparent_45%)]';
      case 3:
        return 'bg-[linear-gradient(225deg,var(--rank-third),transparent_45%)]';
      default:
        return '';
    }
  };

  const getRankColor = (rank: number) => {
    if (!rank) return '';

    switch (rank) {
      case 1:
        return 'text-[var(--rank-first)]';
      case 2:
        return 'text-[var(--rank-second)]';
      case 3:
        return 'text-[var(--rank-third)]';
      default:
        if (rank <= 10) {
          return 'text-primary';
        }
        return '';
    }
  };

  const getRankBorder = (rank: number | null) => {
    if (!rank) return '';

    switch (rank) {
      case 1:
        return 'border border-[var(--rank-first)]/60 shadow-[0_0_20px_rgba(255,215,0,0.3)]';
      case 2:
        return 'border border-[var(--rank-second)]/60 shadow-[0_0_20px_rgba(192,192,192,0.3)]';
      case 3:
        return 'border border-[var(--rank-third)]/60 shadow-[0_0_20px_rgba(205,127,50,0.3)]';
      default:
        if (rank <= 10) {
          return 'border border-primary/60 shadow-[0_0_15px_rgba(255,0,255,0.2)]';
        }
        return '';
    }
  };

  const hasRequestSent = (userId: string): boolean => {
    if (!sentRequestsData?.sentRequests) return false;
    return sentRequestsData.sentRequests.some(request => request.id === userId);
  };

  const isAlreadyFriend = (userId: string): boolean => {
    if (!connectionsData?.connections) return false;
    return connectionsData.connections.some(connection => connection.id === userId);
  };

  // Check if the theme is a custom banner
  const isBannerTheme = displayData.themeId && ['bgavax', 'bggoat', 'bgnochill', 'bgbase', 'bgsolana'].includes(displayData.themeId);
  const bannerUrl = isBannerTheme ? `/banners/${displayData.themeId}.svg` : null;

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden rounded-md p-4 transition-all duration-300 sm:p-5 md:p-6',
        getThemeClass(displayData.themeId),
        getRankBorder(displayData.rank),
        className
      )}
    >
      {/* Custom Banner Background */}
      {bannerUrl && (
        <div 
          className="absolute inset-0 z-0 opacity-75"
          style={{
            backgroundImage: `url(${bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
        {(isArenaActive || displayUser?.arenaYappingEnabled) ? (
          <div className="relative inline-flex">
            <ArenaAvatarFrame
              arenaPoints={isArenaActive ? currentUserArenaPoints : displayUser?.arenaPoints}
              size="xl"
              showPoints={true}
              hoverExpand
            >
              <ProfileAvatar
                src={photoUrl}
                name={displayUser?.name}
                alt="Profile"
                size="full"
                className={cn(
                  'size-full shrink-0',
                  getThemeAvatarClass(displayData.themeId)
                )}
              />
            </ArenaAvatarFrame>
            {!!displayUser?.id && agentIds.has(displayUser.id) && (
              <span className="absolute bottom-[5%] right-[5%] z-20 flex size-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs shadow-lg leading-[0]">
                <span className="block">🤖</span>
              </span>
            )}
          </div>
        ) : (
          <ProfileAvatar
            src={photoUrl}
            name={displayUser?.name}
            alt="Profile"
            size="xl"
            isAgent={!!displayUser?.id && agentIds.has(displayUser.id)}
            className={cn(
              'size-16 shrink-0 sm:size-20 md:size-24',
              getThemeAvatarClass(displayData.themeId)
            )}
          />
        )}
        <div className="relative inline-block">
          {isBannerTheme && (
            <div className="glass absolute inset-0 -m-1 rounded-md" />
          )}
          <h4
            className={cn(
              'relative text-xl sm:text-2xl md:text-3xl',
              getFontClass(displayData.fontId),
              isBannerTheme ? 'text-white' : getThemeTextClass(displayData.themeId)
            )}
          >
            {displayData.name}
          </h4>
        </div>
      </div>
      <div className="relative z-10 flex flex-col gap-1.5 sm:gap-2">
        <div className="relative inline-block">
          {isBannerTheme && (
            <div className="glass absolute inset-0 -m-0.5 rounded-md" />
          )}
          <span
            className={cn(
              'relative text-sm break-words sm:text-base',
              getFontClass(displayData.fontId),
              isBannerTheme ? 'text-white' : getThemeTextClass(displayData.themeId)
            )}
          >
            {displayData.description}
          </span>
        </div>
        <div className="relative inline-block">
          {isBannerTheme && (
            <div className="glass absolute inset-0 -m-0.5 rounded-md" />
          )}
          <span
            className={cn(
              'relative text-xs break-words sm:text-sm',
              getFontClass(displayData.fontId),
              isBannerTheme ? 'text-white/90' : getThemeMutedTextClass(displayData.themeId)
            )}
          >
            {displayData.bio}
          </span>
        </div>
      </div>

      {displayData.tags.length > 0 && (
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {displayData.tags.map((tag: string, index: number) => (
            <Badge
              key={index}
              className={cn(
                'text-[10px] sm:text-xs',
                getFontClass(displayData.fontId),
                getThemeBadgeClass(displayData.themeId) ||
                  getThemeTextClass(displayData.themeId)
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {(displayUser?.displayBadges !== false ||
        displayUser?.displayGuudScore !== false) && (
        <>
          <div className="relative z-10 flex flex-col gap-3">
            {/* Badges Row: GuudScore Badge + NFT Badges */}
            {displayUser?.displayBadges !== false && (
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Score Tier Badge */}
                <div className="group relative">
                  <img
                    src={getTierBadgeImage(displayData.guudScore, selectedNetwork as ChainNetwork)}
                    alt={getTierName(displayData.guudScore, selectedNetwork as ChainNetwork)}
                    className="h-6 w-6 rounded-full object-contain sm:h-7 sm:w-7"
                    title={getTierName(displayData.guudScore, selectedNetwork as ChainNetwork)}
                  />
                </div>

                {/* NFT Badges */}
                {getNFTBadges().map(nftBadge => (
                  <div key={nftBadge.id} className="group relative">
                    {nftBadge.isSeasonalBadge ? (
                      <LeaderboardSeasonalBadge
                        badgeName={nftBadge.name}
                        size={28}
                        showName={false}
                        className="h-6 w-6 sm:h-7 sm:w-7"
                        defaultNetwork={selectedNetwork as any}
                      />
                    ) : nftBadge.logo ? (
                      <img
                        src={nftBadge.logo}
                        alt={nftBadge.name}
                        className="border-primary/20 h-6 w-6 rounded-full border-2 object-cover sm:h-7 sm:w-7"
                        title={nftBadge.name}
                      />
                    ) : (
                      <div
                        className="border-primary/20 from-primary/20 to-primary/5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-gradient-to-br sm:h-7 sm:w-7"
                        title={nftBadge.name}
                      >
                        <span className="text-[8px] font-bold opacity-50">
                          NFT
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {displayUser?.displayGuudScore !== false && (
              <div className="relative inline-block">
                {isBannerTheme && (
                  <div className="glass absolute inset-0 -m-1 rounded-md" />
                )}
                <div className="relative">
                  <span
                    className={cn(
                      'text-[10px] font-medium sm:text-xs',
                      getFontClass(displayData.fontId),
                      isBannerTheme ? 'text-white/90' : getThemeMutedTextClass(displayData.themeId)
                    )}
                  >
                    GuudScore
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h4
                      className={cn(
                        isBannerTheme ? 'text-white' : getRankColor(displayData.rank || 0),
                        !isBannerTheme && getThemeTextClass(displayData.themeId)
                      )}
                    >
                      {displayData.guudScore}
                    </h4>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {displayData.social && displayData.social.length > 0 && (
        <div className="relative z-10 flex items-center gap-2">
          {displayData.social
            .filter(social => social.visible === true)
            .filter((social, _, self) => {
              // Remove duplicate twitter/x entries - keep only 'x'
              const platform = social.platform?.toLowerCase();
              if (platform === 'twitter') {
                // Check if there's an 'x' platform in the array
                const hasXPlatform = self.some(s => s.platform?.toLowerCase() === 'x');
                // If both twitter and x exist, skip twitter
                if (hasXPlatform) return false;
              }
              return true;
            })
            .map(social => {
              const platform = social.platform?.toLowerCase();

              // Function to get the correct URL based on platform
              const getSocialUrl = (platform: string, url: string) => {
                // If URL already starts with http/https, use it as is
                if (url.startsWith('http')) {
                  return url;
                }

                // Remove platform domain if it's already in the URL
                let cleanUrl = url;

                // Platform-specific URL construction
                switch (platform) {
                  case 'twitter':
                  case 'x':
                    cleanUrl = url.replace(/^(x\.com\/|twitter\.com\/)/, '');
                    return `https://x.com/${cleanUrl}`;
                  case 'github':
                    cleanUrl = url.replace(/^github\.com\//, '');
                    return `https://github.com/${cleanUrl}`;
                  case 'linkedin':
                    cleanUrl = url.replace(
                      /^(linkedin\.com\/in\/|linkedin\.com\/)/,
                      ''
                    );
                    return `https://linkedin.com/in/${cleanUrl}`;
                  case 'instagram':
                    cleanUrl = url.replace(/^instagram\.com\//, '');
                    return `https://instagram.com/${cleanUrl}`;
                  case 'youtube':
                    cleanUrl = url.replace(/^youtube\.com\/@?/, '');
                    return `https://youtube.com/@${cleanUrl}`;
                  case 'tiktok':
                    cleanUrl = url.replace(/^tiktok\.com\/@?/, '');
                    return `https://tiktok.com/@${cleanUrl}`;
                  case 'discord':
                    cleanUrl = url.replace(/^discord\.gg\//, '');
                    return `https://discord.gg/${cleanUrl}`;
                  case 'telegram':
                    cleanUrl = url.replace(/^t\.me\//, '');
                    return `https://t.me/${cleanUrl}`;
                  case 'facebook':
                    cleanUrl = url.replace(/^facebook\.com\//, '');
                    return `https://facebook.com/${cleanUrl}`;
                  case 'whatsapp':
                    cleanUrl = url.replace(/^(wa\.me\/|whatsapp\.com\/)/, '');
                    return `https://wa.me/${cleanUrl}`;
                  default:
                    // For unknown platforms, assume it's a complete URL
                    return url.includes('.') ? `https://${url}` : url;
                }
              };

              return (
                <a
                  key={social.platform}
                  href={getSocialUrl(platform, social.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center space-x-2 text-sm transition-colors hover:underline',
                    getThemeSocialIconClass(displayData.themeId)
                  )}
                >
                  {platform === 'twitter' || platform === 'x' ? (
                    <Icons.twitter className="size-6" />
                  ) : platform === 'linkedin' ? (
                    <Icons.linkedin className="size-6" />
                  ) : platform === 'github' ? (
                    <Icons.github className="size-6" />
                  ) : platform === 'instagram' ? (
                    <Icons.instagram className="size-6" />
                  ) : platform === 'facebook' ? (
                    <Icons.facebook className="size-6" />
                  ) : platform === 'telegram' ? (
                    <Icons.telegram className="size-6" />
                  ) : platform === 'tiktok' ? (
                    <Icons.tiktok className="size-6" />
                  ) : platform === 'whatsapp' ? (
                    <Icons.whatsapp className="size-6" />
                  ) : null}
                </a>
              );
            })}
        </div>
      )}

      {displayUser?.custom && displayUser.custom.length > 0 && (
        <div className="relative z-10 flex flex-col gap-2">
          {displayUser.custom
            .filter(link => link.visible === true)
            .map(link => (
              <a
                key={link.id}
                href={
                  link.url.startsWith('http') ? link.url : `https://${link.url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'rounded-md px-4 py-2 text-center text-sm font-medium transition-all hover:opacity-80',
                  getFontClass(displayData.fontId)
                )}
                style={{
                  backgroundColor: link.color || '#6366f1',
                  color: '#ffffff',
                }}
              >
                {link.name}
              </a>
            ))}
        </div>
      )}

      {displayData.rank && displayData.rank <= 3 && (
        <div className="absolute top-0 right-0 z-20 size-32 text-right sm:size-44">
          <div
            className={cn(
              'absolute top-0 right-0 h-full w-full opacity-60',
              getRankGradient(displayData.rank)
            )}
          ></div>
          <span
            className={cn(
              'font-pixel inline-block p-5 text-lg select-none sm:text-xl',
              getRankColor(displayData.rank)
            )}
          >
            #{displayData.rank}
          </span>
        </div>
      )}

      {!isCurrentUser && !isAlreadyFriend(displayData.id) && (
        <div className="relative z-10 mt-6">
          <Button
            size="sm"
            disabled={isSendingRequest || hasRequestSent(displayData.id)}
            onClick={() => sendConnectionRequest(displayData.id)}
          >
            {hasRequestSent(displayData.id) ? 'Request Sent' : 'Add Request'}
          </Button>
        </div>
      )}
    </div>
  );
};

// Separate component for vouch buttons to be used outside the card
export const ProfileCardVouchButtons = ({ userId, isCurrentUser }: { userId?: string; isCurrentUser: boolean }) => {
  if (isCurrentUser || !userId) {
    return null;
  }

  return (
    <div className="w-full">
      <VouchButtons targetUserId={userId} size="sm" />
    </div>
  );
};
