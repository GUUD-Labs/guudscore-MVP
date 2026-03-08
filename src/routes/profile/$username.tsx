import { Loader2, Wallet } from 'lucide-react';

import { useQueries } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { ErrorMessage } from '@/components/error-message';
import { NftList } from '@/components/nft-list';
import { ProfileStats, type ProfileStatsData, type ProfileVisibilitySettings } from '@/components/profile-stats';
import { VouchHistoryList } from '@/components/vouch-history-list';
import { useChain } from '@/contexts/chain-context';
import { NFT_QUERY_KEYS, useConnections, useCurrentUser, USER_QUERY_KEYS, useUserByKey } from '@/hooks';
import { tokenStorage } from '@/hooks/use-auth';
import type { ChainNetwork } from '@/lib/tier-utils';
import { nftService, userService } from '@/services';

const ALL_CHAINS: ChainNetwork[] = ['AVAX', 'BASE', 'SOLANA', 'ARBITRUM'];

export const Route = createFileRoute('/profile/$username')({
  component: RouteComponent,
});

function RouteComponent() {
  const { username } = Route.useParams();
  const { data: currentUser } = useCurrentUser();
  const { selectedNetwork } = useChain();
  const { data: connectionsData } = useConnections();

  const isOwnProfile = currentUser?.username === username || currentUser?.slug === username;

  const {
    data: profileUser,
    isLoading: userLoading,
    error: userError,
  } = useUserByKey(username, selectedNetwork);

  // Fetch GuudScore for all chains in parallel
  const chainScoreQueries = useQueries({
    queries: ALL_CHAINS.map(chain => ({
      queryKey: USER_QUERY_KEYS.user(username, chain),
      queryFn: () => userService.getUserByKey(username, chain),
      enabled: !!username,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  // Build chainScores from all chain queries
  const chainScores = ALL_CHAINS.reduce((acc, chain, index) => {
    const responseData = chainScoreQueries[index]?.data;
    const score = responseData?.guudScore?.totalScore;
    
    // Only use score if it exists AND matches the requested chain
    // This prevents fallback to other chains (e.g., AVAX) when backend doesn't support new chains
    if (score !== undefined) {
      acc[chain] = score;
    } else {
      // If no data for this chain, set to 0 instead of using fallback
      acc[chain] = 0;
    }
    return acc;
  }, {} as Record<ChainNetwork, number>);

  // Calculate total GuudScore across all chains
  const totalGuudScore = Object.values(chainScores).reduce((sum, score) => sum + score, 0);

  // Fetch NFTs from all chains in parallel (for own profile)
  const nftQueries = useQueries({
    queries: ALL_CHAINS.map(chain => ({
      queryKey: NFT_QUERY_KEYS.myNFTs({ network: chain as any }),
      queryFn: () => nftService.getMyNFTs({ network: chain as any }),
      enabled: isOwnProfile && !!tokenStorage.getAccessToken() && !tokenStorage.isTokenExpired(),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Build chainNFTs count from all chain queries
  const chainNFTs = ALL_CHAINS.reduce((acc, chain, index) => {
    const items = nftQueries[index]?.data?.items;
    if (items && items.length > 0) {
      acc[chain] = items.length;
    } else {
      // If no NFT data for this chain, set to 0 instead of omitting
      acc[chain] = 0;
    }
    return acc;
  }, {} as Record<ChainNetwork, number>);

  // Merge all NFTs from all chains
  const allChainNFTs = nftQueries.flatMap((q, index) => 
    (q.data?.items || []).map(nft => ({ ...nft, network: ALL_CHAINS[index] }))
  );
  
  const totalNFTCount = Object.values(chainNFTs).reduce((sum, count) => sum + count, 0);
  const nftsLoading = nftQueries.some(q => q.isLoading);

  const displayUser = isOwnProfile ? currentUser : profileUser;
  
  // For other user's profile, get NFT data from their profile
  const profileNFTs = !isOwnProfile ? (profileUser?.nft || []) : [];
  
  // Calculate chain NFT counts for other user's profile
  const otherUserChainNFTs = !isOwnProfile ? profileNFTs.reduce((acc, nft) => {
    const chain = (nft.network || 'AVAX').toUpperCase() as ChainNetwork;
    if (ALL_CHAINS.includes(chain)) {
      acc[chain] = (acc[chain] || 0) + 1;
    }
    return acc;
  }, {} as Partial<Record<ChainNetwork, number>>) : null;
  
  // Filter only featured NFTs for display
  const featuredNFTs = isOwnProfile 
    ? allChainNFTs.filter(nft => nft.isFeatured)
    : profileNFTs.filter(nft => nft.isFeatured);

  const isLoading = userLoading || (isOwnProfile && nftsLoading);
  const error = userError;

  // Extract connections array from data
  const connectionsArray = connectionsData?.connections || [];

  // Build profile stats data
  const profileStatsData: ProfileStatsData = {
    // User ID for vouch buttons
    userId: displayUser?.id,
    // Twitter stats - would come from user data when available
    twitterFollowers: displayUser?.twitterFollowers,
    twitterFollowing: displayUser?.twitterFollowing,
    // Multi-chain GuudScore - fetched from all chains
    chainScores: Object.keys(chainScores).length > 0 ? chainScores : undefined,
    totalGuudScore: totalGuudScore > 0 ? totalGuudScore : undefined,
    // Portfolio - would come from backend
    totalPortfolioValue: displayUser?.totalPortfolioValue,
    chainPortfolios: displayUser?.chainPortfolios,
    // NFTs count - fetched from all chains or calculated from profile NFTs
    totalNFTs: isOwnProfile ? totalNFTCount : profileNFTs.length,
    chainNFTs: isOwnProfile 
      ? (Object.keys(chainNFTs).length > 0 ? chainNFTs : undefined)
      : (otherUserChainNFTs && Object.keys(otherUserChainNFTs).length > 0 ? otherUserChainNFTs as Record<ChainNetwork, number> : undefined),
    // Friends - use backend data or empty array (not hidden unless visibility is set)
    guudFriends: isOwnProfile 
      ? connectionsArray.slice(0, 5).map(c => ({
          id: c.id,
          name: c.name || c.slug || 'Unknown',
          slug: c.slug || c.id,
          photoUrl: c.photoUrl,
        }))
      : (displayUser?.guudFriends || []),
    guudFriendsCount: isOwnProfile ? connectionsArray.length : (displayUser?.guudFriendsCount ?? 0),
    // Social links
    socialLinks: displayUser?.social?.map(s => ({
      platform: s.platform,
      url: s.url,
      visible: s.visible,
    })),
    customLinks: displayUser?.custom?.map(c => ({
      name: c.name,
      url: c.url,
      color: c.color,
      visible: c.visible,
    })),
    // Connected wallets
    wallets: displayUser?.wallets?.map(w => ({
      id: w.id,
      walletAddress: w.walletAddress,
      chain: w.walletAddress.startsWith('0x') ? 'evm' as const : 'solana' as const,
      ensName: w.ensName,
    })),
  };

  // Visibility settings from user preferences
  const visibilitySettings: ProfileVisibilitySettings = {
    showTwitterStats: displayUser?.profileVisibility?.showTwitterStats ?? true,
    showGuudScore: displayUser?.displayGuudScore ?? true,
    showPortfolio: displayUser?.profileVisibility?.showPortfolio ?? true,
    showNFTs: displayUser?.profileVisibility?.showNFTs ?? displayUser?.isPublicNft ?? true,
    showFriends: displayUser?.profileVisibility?.showFriends ?? true,
    showSocialLinks: displayUser?.profileVisibility?.showSocialLinks ?? true,
    showConnectedPlatforms: displayUser?.profileVisibility?.showConnectedPlatforms ?? true,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <ProfileStats
          data={{}}
          isLoading={true}
          isOwnProfile={isOwnProfile}
        />
        <div className="flex flex-col gap-4">
          <h4 className="text-base sm:text-lg">Featured NFTs</h4>
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        header="Error loading profile"
        error={error?.message || 'Unknown error'}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Stats Section */}
      <ProfileStats
        data={profileStatsData}
        visibility={visibilitySettings}
        isLoading={false}
        isOwnProfile={isOwnProfile}
      />

      {/* Vouch History Section */}
      {displayUser?.id && (
        <VouchHistoryList userId={displayUser.id} isOwnProfile={isOwnProfile} />
      )}

      {/* Assets Portfolio Section - Full Width */}
      <div className="flex flex-col gap-4">
        <h4 className="text-base sm:text-lg">Assets Portfolio</h4>
        <div className="glass rounded-xl border p-6 shadow-md">
          {visibilitySettings.showPortfolio && displayUser?.chainPortfolios ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-base">Total Value</span>
                <span className="font-pixel text-3xl text-purple-500">
                  ${displayUser.totalPortfolioValue?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ALL_CHAINS.map(chain => {
                  const value = displayUser.chainPortfolios?.[chain];
                  if (value === undefined) return null;
                  return (
                    <div
                      key={chain}
                      className="glass rounded-lg p-4 flex flex-col items-center gap-2"
                    >
                      <div className="flex items-center gap-2">
                        {chain === 'AVAX' && (
                          <svg viewBox="0 0 254 254" className="size-6" fill="currentColor">
                            <circle cx="127" cy="127" r="127" fill="#E84142" />
                            <path
                              d="M171.8 130.3c4.4-7.6 11.5-7.6 15.9 0l27.4 48.1c4.4 7.6.8 13.8-8 13.8h-55.5c-8.7 0-12.3-6.2-8-13.8l28.2-48.1zm-45.7-79.5c4.4-7.6 11.4-7.6 15.8 0l6.1 11.2 14.7 26.6c3.5 7.2 3.5 15.7 0 22.9L122.5 178c-4.4 7.2-12.1 11.7-20.6 11.7H46.5c-8.8 0-12.4-6.1-8-13.7l87.6-124.2z"
                              fill="white"
                            />
                          </svg>
                        )}
                        {chain === 'BASE' && (
                          <svg viewBox="0 0 111 111" className="size-6">
                            <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF" />
                          </svg>
                        )}
                        {chain === 'SOLANA' && (
                          <svg viewBox="0 0 397.7 311.7" className="size-6">
                            <linearGradient id="solana-a" x1="360.879" x2="141.213" y1="-37.455" y2="320.332" gradientUnits="userSpaceOnUse">
                              <stop offset="0" stopColor="#00ffa3" />
                              <stop offset="1" stopColor="#dc1fff" />
                            </linearGradient>
                            <path fill="url(#solana-a)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" />
                            <path fill="url(#solana-a)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1z" />
                            <path fill="url(#solana-a)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1z" />
                          </svg>
                        )}
                        {chain === 'ARBITRUM' && (
                          <svg viewBox="0 0 40 40" className="size-6">
                            <rect width="40" height="40" rx="20" fill="#213147" />
                            <path d="M24.0799 20.8785L27.022 26.0637L28.2608 27.7478L27.3584 24.7426L23.7544 18.5872L23.7292 18.5452L22.9698 17.2369L22.6484 16.6749L20.7484 13.3846L20.0258 12.1406L19.3032 13.3846L14.3899 21.8792L14.0685 22.4412L13.3459 23.6852L12.3945 25.3357L17.6566 25.3441L15.4311 29.5714H17.8566L20.0174 25.4346L22.0024 25.4388L21.0006 27.2226L20.4106 28.2854L19.9832 29.0546L19.4142 30.0763L24.9316 30.0847L25.9646 28.2854L28.9614 23.0961L28.9404 23.058L24.0799 20.8785Z" fill="#12AAFF" />
                          </svg>
                        )}
                        {chain === 'MONAD' && (
                          <svg viewBox="0 0 200 200" className="size-6">
                            <rect width="200" height="200" rx="100" fill="#7B3FE4" />
                            <path d="M100 40L140 80L100 120L60 80L100 40Z" fill="white" />
                            <path d="M100 80L140 120L100 160L60 120L100 80Z" fill="white" opacity="0.7" />
                          </svg>
                        )}
                        <span className="font-semibold">{chain}</span>
                      </div>
                      <span className="text-lg font-pixel">${value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">Hidden</span>
            </div>
          )}
        </div>
      </div>

      {/* Featured NFTs Section */}
      <div className="flex flex-col gap-4">
        <h4 className="text-base sm:text-lg">Featured NFTs</h4>

        {!isOwnProfile && !displayUser?.isPublicNft ? (
          <div className="glass rounded-xl border p-4 sm:p-5 md:p-6 text-center shadow-md">
            <div className="mx-auto mb-2 sm:mb-3 flex size-12 sm:size-14 md:size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
              <Wallet className="size-6 sm:size-7 md:size-8 text-purple-500" />
            </div>
            <h4 className="mb-2 text-sm sm:text-base font-semibold">NFTs are private</h4>
            <p className="text-muted mx-auto max-w-sm text-xs sm:text-sm text-balance">
              This user has chosen to keep their NFT collection private.
            </p>
          </div>
        ) : featuredNFTs.length > 0 ? (
          <NftList nfts={featuredNFTs as any} className="xl:grid-cols-3" />
        ) : (
          <div className="glass rounded-xl border p-4 sm:p-5 md:p-6 text-center shadow-md">
            <div className="mx-auto mb-2 sm:mb-3 flex size-12 sm:size-14 md:size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
              <Wallet className="size-6 sm:size-7 md:size-8 text-purple-500" />
            </div>
            <h4 className="mb-2 text-sm sm:text-base font-semibold">No Featured NFTs</h4>
            <p className="text-muted mx-auto mb-3 sm:mb-4 max-w-sm text-xs sm:text-sm">
              {isOwnProfile
                ? 'Go to Settings > NFTs to feature your favorite NFTs on your profile.'
                : 'This user has not featured any NFTs yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
