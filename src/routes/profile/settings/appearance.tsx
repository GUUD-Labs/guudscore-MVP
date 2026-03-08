import { useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { LeaderboardSeasonalBadge } from '@/components/leaderboard-seasonal-badge';
import { NFTCollectionAvatar } from '@/components/nft-collection-avatar';
import { SettingsHeading } from '@/components/settings-heading';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useChain } from '@/contexts/chain-context';
import {
    useCurrentUser,
    useResetAllBadges,
    useUpdateBadgeSelection,
    useUpdateUserProfile,
} from '@/hooks';
import { isSeasonalBadgeName } from '@/lib/seasonal-badge-utils';

export const Route = createFileRoute('/profile/settings/appearance')({
  component: RouteComponent,
});

interface Badge {
  id: string;
  name: string;
  type: 'poap' | 'nft';
  isSelected: boolean;
  priority: number;
  imageUrl?: string;
  contractAddress?: string;
  network?: string;
  isSeasonalBadge?: boolean;
}

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

// Load whitelist data
let avaxWhitelistData: WhitelistData | null = null;
let baseWhitelistData: WhitelistData | null = null;
let solanaWhitelistData: SolanaWhitelistData | null = null;
let arbitrumWhitelistData: WhitelistData | null = null;

const loadAvaxWhitelist = async (): Promise<WhitelistData | null> => {
  if (avaxWhitelistData) return avaxWhitelistData;
  
  try {
    const response = await fetch('/whitelist-nft.json');
    avaxWhitelistData = await response.json();
    return avaxWhitelistData;
  } catch (error) {
    console.error('Failed to load NFT whitelist:', error);
    return null;
  }
};

const loadBaseWhitelist = async (): Promise<WhitelistData | null> => {
  if (baseWhitelistData) return baseWhitelistData;
  
  try {
    const response = await fetch('/base-whitelist-nft.json');
    baseWhitelistData = await response.json();
    return baseWhitelistData;
  } catch (error) {
    console.error('Failed to load Base NFT whitelist:', error);
    return null;
  }
};

const loadSolanaWhitelist = async (): Promise<SolanaWhitelistData | null> => {
  if (solanaWhitelistData) return solanaWhitelistData;
  
  try {
    const response = await fetch('/solana-whitelist-nft.json');
    solanaWhitelistData = await response.json();
    return solanaWhitelistData;
  } catch (error) {
    console.error('Failed to load Solana NFT whitelist:', error);
    return null;
  }
};

const loadArbitrumWhitelist = async (): Promise<WhitelistData | null> => {
  if (arbitrumWhitelistData) return arbitrumWhitelistData;
  
  try {
    const response = await fetch('/arbitrum-whitelist-nft.json');
    arbitrumWhitelistData = await response.json();
    return arbitrumWhitelistData;
  } catch (error) {
    console.error('Failed to load Arbitrum NFT whitelist:', error);
    return null;
  }
};

// Get collection data from whitelist by contract address
const getCollectionDataFromAvaxWhitelist = (
  contractAddress: string,
  whitelist: WhitelistData | null
): { name: string; logo?: string } | null => {
  if (!whitelist || !contractAddress) return null;
  
  const collection = whitelist.collections.find(
    c => c.contract_address.toLowerCase() === contractAddress.toLowerCase()
  );
  
  if (!collection) return null;
  
  return {
    name: collection.name,
    logo: collection.collection_logo,
  };
};

const getCollectionDataFromBaseWhitelist = (
  contractAddress: string,
  whitelist: WhitelistData | null
): { name: string; logo?: string } | null => {
  if (!whitelist || !contractAddress) return null;
  
  const collection = whitelist.collections.find(
    c => c.contract_address.toLowerCase() === contractAddress.toLowerCase()
  );
  
  if (!collection) return null;
  
  return {
    name: collection.name,
    logo: collection.collection_logo,
  };
};

const getCollectionDataFromSolanaWhitelist = (
  collectionMint: string,
  whitelist: SolanaWhitelistData | null
): { name: string; logo?: string } | null => {
  if (!whitelist || !collectionMint) return null;
  
  const collection = whitelist.collections.find(
    c => c.collection_mint.toLowerCase() === collectionMint.toLowerCase()
  );
  
  if (!collection) return null;
  
  return {
    name: collection.name,
    logo: collection.collection_image,
  };
};

const getCollectionDataFromArbitrumWhitelist = (
  contractAddress: string,
  whitelist: WhitelistData | null
): { name: string; logo?: string } | null => {
  if (!whitelist || !contractAddress) return null;
  
  const collection = whitelist.collections.find(
    c => c.contract_address.toLowerCase() === contractAddress.toLowerCase()
  );
  
  if (!collection) return null;
  
  return {
    name: collection.name,
    logo: collection.collection_logo,
  };
};

function RouteComponent() {
  const [badgeList, setBadgeList] = useState<Badge[]>([]);
  const { selectedNetwork: globalNetwork } = useChain();
  const { data: currentUser } = useCurrentUser();
  const updateProfileMutation = useUpdateUserProfile();
  const updateBadgeSelectionMutation = useUpdateBadgeSelection();
  const resetAllBadgesMutation = useResetAllBadges();

  // Load badges from current user - re-run when network changes to get correct featured status
  useEffect(() => {
    if (!currentUser?.badges) return;

    const loadBadges = async () => {
      const avaxWhitelist = await loadAvaxWhitelist();
      const baseWhitelist = await loadBaseWhitelist();
      const solanaWhitelist = await loadSolanaWhitelist();
      const arbitrumWhitelist = await loadArbitrumWhitelist();
      const badges: Badge[] = [];
      const userBadges = currentUser.badges;

      // Add POAP badges (POAPs are EVM-only, available on AVAX, BASE, and ARBITRUM)
      // For POAPs, check visibleOnNetwork to determine if featured for current network
      userBadges?.poapBadges?.forEach(badge => {
        // POAP is selected for current network if visibleOnNetwork matches globalNetwork
        // or if priority > 0 and network matches (backward compatibility)
        const isSelectedForCurrentNetwork = 
          badge.visibleOnNetwork === globalNetwork ||
          ((badge.priority || 0) > 0 && badge.network === globalNetwork);
        
        badges.push({
          id: badge.id,
          name: badge.event?.name || 'POAP Badge',
          type: 'poap',
          isSelected: isSelectedForCurrentNetwork,
          priority: isSelectedForCurrentNetwork ? (badge.priority || 1) : 0,
          network: globalNetwork, // POAPs can be featured on any EVM network (AVAX/BASE/ARBITRUM)
        });
      });

      // Add NFT badges with whitelist fallback
      userBadges?.nftBadges?.forEach(badge => {
        let badgeName = badge.collectionName || badge.name;
        // Use badgeIcon from backend first, then fallback to whitelist
        let imageUrl: string | undefined = badge.badgeIcon;
        
        // Determine badge network from contractAddress if not provided
        const isSolanaAddress = badge.contractAddress && !badge.contractAddress.startsWith('0x');
        
        // Determine network by checking whitelists if not provided
        let badgeNetwork = badge.network;
        
        if (!badgeNetwork && badge.contractAddress) {
          if (isSolanaAddress) {
            badgeNetwork = 'SOLANA';
          } else {
            // Check Base whitelist first
            const baseMatch = baseWhitelist?.collections.find(
              c => c.contract_address.toLowerCase() === badge.contractAddress?.toLowerCase()
            );
            if (baseMatch) {
              badgeNetwork = 'BASE';
            } else {
              // Check Arbitrum whitelist
              const arbitrumMatch = arbitrumWhitelist?.collections.find(
                c => c.contract_address.toLowerCase() === badge.contractAddress?.toLowerCase()
              );
              if (arbitrumMatch) {
                badgeNetwork = 'ARBITRUM';
              } else {
                // Default to AVAX for other EVM addresses
                badgeNetwork = 'AVAX';
              }
            }
          }
        }
        badgeNetwork = badgeNetwork || 'AVAX';
        
        // If no name or name looks like an address, try whitelists
        if (!badgeName || badgeName.startsWith('Collection 0x')) {
          // Try Solana whitelist first if it's a Solana address
          if (isSolanaAddress) {
            const solanaData = getCollectionDataFromSolanaWhitelist(
              badge.contractAddress || '',
              solanaWhitelist
            );
            if (solanaData) {
              badgeName = solanaData.name;
              imageUrl = solanaData.logo;
            }
          }
          
          // Try Base whitelist if badge is from BASE network
          if (!imageUrl && badgeNetwork === 'BASE') {
            const baseData = getCollectionDataFromBaseWhitelist(
              badge.contractAddress || '',
              baseWhitelist
            );
            if (baseData) {
              badgeName = baseData.name;
              imageUrl = baseData.logo;
            }
          }
          
          // Try Arbitrum whitelist if badge is from ARBITRUM network
          if (!imageUrl && badgeNetwork === 'ARBITRUM') {
            const arbitrumData = getCollectionDataFromArbitrumWhitelist(
              badge.contractAddress || '',
              arbitrumWhitelist
            );
            if (arbitrumData) {
              badgeName = arbitrumData.name;
              imageUrl = arbitrumData.logo;
            }
          }
          
          // Try AVAX whitelist for EVM addresses
          if (!imageUrl && !isSolanaAddress && badgeNetwork !== 'BASE' && badgeNetwork !== 'ARBITRUM') {
            const avaxData = getCollectionDataFromAvaxWhitelist(
              badge.contractAddress || '',
              avaxWhitelist
            );
            if (avaxData) {
              badgeName = avaxData.name;
              imageUrl = avaxData.logo;
            }
          }
        } else {
          // Even if we have a name, try to get the logo from whitelists
          if (isSolanaAddress) {
            const solanaData = getCollectionDataFromSolanaWhitelist(
              badge.contractAddress || '',
              solanaWhitelist
            );
            if (solanaData?.logo) {
              imageUrl = solanaData.logo;
            }
          }
          
          // Try Base whitelist for logo
          if (!imageUrl && badgeNetwork === 'BASE') {
            const baseData = getCollectionDataFromBaseWhitelist(
              badge.contractAddress || '',
              baseWhitelist
            );
            if (baseData?.logo) {
              imageUrl = baseData.logo;
            }
          }
          
          // Try Arbitrum whitelist for logo
          if (!imageUrl && badgeNetwork === 'ARBITRUM') {
            const arbitrumData = getCollectionDataFromArbitrumWhitelist(
              badge.contractAddress || '',
              arbitrumWhitelist
            );
            if (arbitrumData?.logo) {
              imageUrl = arbitrumData.logo;
            }
          }
          
          if (!imageUrl && !isSolanaAddress && badgeNetwork !== 'BASE' && badgeNetwork !== 'ARBITRUM') {
            const avaxData = getCollectionDataFromAvaxWhitelist(
              badge.contractAddress || '',
              avaxWhitelist
            );
            if (avaxData?.logo) {
              imageUrl = avaxData.logo;
            }
          }
        }
        
        // NFT Badge is selected only if priority > 0 AND badge belongs to current network
        // This ensures each chain has its own featured badge selection
        const badgeBelongsToCurrentNetwork = badgeNetwork === globalNetwork;
        const isSelectedForCurrentNetwork = badgeBelongsToCurrentNetwork && (badge.priority || 0) > 0;
        
        // Check if this is a seasonal badge (e.g., "Q1 2026 AVAX Maxi")
        const isSeasonal = isSeasonalBadgeName(badgeName || '');
        
        badges.push({
          id: badge.id,
          name: badgeName || 'NFT Badge',
          type: 'nft',
          isSelected: isSelectedForCurrentNetwork,
          priority: isSelectedForCurrentNetwork ? (badge.priority || 0) : 0,
          imageUrl,
          contractAddress: badge.contractAddress,
          network: badgeNetwork,
          isSeasonalBadge: isSeasonal,
        });
      });

      setBadgeList(badges);
    };

    loadBadges();
  }, [currentUser, globalNetwork]); // Re-run when network changes to get correct featured status

  // Filter badges based on selected global network
  // Show only badges that match the selected network
  const filteredBadgeList = badgeList.filter(badge => {
    if (badge.type === 'poap') {
      // POAPs can be displayed on any network (they're earned on EVM but can be featured anywhere)
      return true;
    }
    if (badge.type === 'nft') {
      // Filter by badge's network if available
      if (badge.network) {
        return badge.network === globalNetwork;
      }
      // Fallback: check by address format
      if (badge.contractAddress) {
        const isSolanaAddress = !badge.contractAddress.startsWith('0x');
        return globalNetwork === 'SOLANA' ? isSolanaAddress : !isSolanaAddress;
      }
    }
    return true;
  });

  const selectedCount = filteredBadgeList.filter(badge => badge.isSelected).length;

  const handleDisplayGuudScoreChange = async (checked: boolean) => {
    await updateProfileMutation.mutateAsync({ displayGuudScore: checked });
  };

  const handleDisplayBadgesChange = async (checked: boolean) => {
    await updateProfileMutation.mutateAsync({ displayBadges: checked });
  };

  const handleBadgeToggle = (badgeId: string) => {
    setBadgeList(prev => {
      const badge = prev.find(b => b.id === badgeId);
      if (!badge) return prev;

      if (badge.isSelected) {
        // Deselecting - set priority to 0 and shift others down
        return prev.map(b => {
          if (b.id === badgeId) {
            return { ...b, isSelected: false, priority: 0 };
          } else if (b.isSelected && b.priority > badge.priority) {
            // Shift down badges with higher priority
            return { ...b, priority: b.priority - 1 };
          }
          return b;
        });
      } else {
        // Selecting - check if we can select more
        const currentSelectedCount = prev.filter(b => b.isSelected).length;
        if (currentSelectedCount >= 3) {
          return prev; // Don't allow more than 3 selections
        }
        
        // Assign next priority
        const maxPriority = Math.max(
          0,
          ...prev.filter(b => b.isSelected).map(b => b.priority)
        );
        return prev.map(b => 
          b.id === badgeId 
            ? { ...b, isSelected: true, priority: maxPriority + 1 }
            : b
        );
      }
    });
  };

  const handleSaveBadges = async () => {
    // Only work with badges that match the current network filter
    // This ensures we only save chain-specific badge selections
    const networkFilteredBadges = badgeList.filter(badge => 
      filteredBadgeList.some(fb => fb.id === badge.id)
    );
    
    // Normalize selected badge priorities to 1, 2, 3
    const selectedBadges = networkFilteredBadges
      .filter(b => b.isSelected)
      .sort((a, b) => a.priority - b.priority)
      .map((badge, index) => ({
        id: badge.id,
        type: badge.type,
        priority: index + 1,
      }));

    // Send only badges for the current network to backend with their current state
    // Unselected badges get priority: 0 and isVisible: false
    const allBadges = networkFilteredBadges.map(badge => {
      const isSelected = selectedBadges.some(sb => sb.id === badge.id);
      const selectedBadge = selectedBadges.find(sb => sb.id === badge.id);
      
      return {
        id: badge.id,
        type: badge.type,
        priority: isSelected ? (selectedBadge?.priority || 0) : 0,
        isVisible: isSelected,
      };
    });

    await updateBadgeSelectionMutation.mutateAsync({ selectedBadges, allBadges, network: globalNetwork });
  };

  const handleResetBadges = async () => {
    // Call the reset endpoint with the current network to only reset badges for this chain
    await resetAllBadgesMutation.mutateAsync(globalNetwork);

    // Update UI state - only reset badges for the current network
    setBadgeList(prev => 
      prev.map(badge => {
        // Only reset badges that match the current network filter
        const matchesNetwork = filteredBadgeList.some(fb => fb.id === badge.id);
        if (matchesNetwork) {
          return {
            ...badge,
            isSelected: false,
            priority: 0,
          };
        }
        return badge;
      })
    );
  };

  const hasChanges = badgeList.some(
    badge =>
      badge.isSelected !==
      (currentUser?.badges?.poapBadges?.find(b => b.id === badge.id)
        ?.isVisible ||
        currentUser?.badges?.nftBadges?.find(b => b.id === badge.id)
          ?.isVisible ||
        false)
  );

  // Profile visibility handlers
  const handleVisibilityChange = async (field: string, checked: boolean) => {
    const currentVisibility = currentUser?.profileVisibility || {};
    await updateProfileMutation.mutateAsync({
      profileVisibility: {
        ...currentVisibility,
        [field]: checked,
      },
    } as any);
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Profile Visibility Settings */}
      <div className="flex flex-col gap-8">
        <h3 className="text-lg font-semibold">Profile Display Settings</h3>
        
        <SettingsHeading
          title="Guudscore"
          description="Display your GuudScore on your profile (all chains)"
          action={
            <Switch
              checked={currentUser?.displayGuudScore ?? false}
              onCheckedChange={handleDisplayGuudScoreChange}
              disabled={updateProfileMutation.isPending}
            />
          }
        />
        
        <SettingsHeading
          title="Badges"
          description="Display your Badges on your profile"
          action={
            <Switch
              checked={currentUser?.displayBadges ?? false}
              onCheckedChange={handleDisplayBadgesChange}
              disabled={updateProfileMutation.isPending}
            />
          }
        />

        <SettingsHeading
          title="Twitter Stats"
          description="Display your Twitter followers and following count"
          action={
            <Switch
              checked={currentUser?.profileVisibility?.showTwitterStats ?? true}
              onCheckedChange={(checked) => handleVisibilityChange('showTwitterStats', checked)}
              disabled={updateProfileMutation.isPending}
            />
          }
        />

        <SettingsHeading
          title="Assets Portfolio"
          description="Display your total portfolio value across all chains"
          action={
            <Switch
              checked={currentUser?.profileVisibility?.showPortfolio ?? true}
              onCheckedChange={(checked) => handleVisibilityChange('showPortfolio', checked)}
              disabled={updateProfileMutation.isPending}
            />
          }
        />

        <SettingsHeading
          title="NFT Collection"
          description="Display your NFT collection count on your profile"
          action={
            <Switch
              checked={currentUser?.profileVisibility?.showNFTs ?? true}
              onCheckedChange={(checked) => handleVisibilityChange('showNFTs', checked)}
              disabled={updateProfileMutation.isPending}
            />
          }
        />

        <SettingsHeading
          title="Guud Friends"
          description="Display your connected friends on your profile"
          action={
            <Switch
              checked={currentUser?.profileVisibility?.showFriends ?? true}
              onCheckedChange={(checked) => handleVisibilityChange('showFriends', checked)}
              disabled={updateProfileMutation.isPending}
            />
          }
        />

        <SettingsHeading
          title="Social Links"
          description="Display your social media links on your profile"
          action={
            <Switch
              checked={currentUser?.profileVisibility?.showSocialLinks ?? true}
              onCheckedChange={(checked) => handleVisibilityChange('showSocialLinks', checked)}
              disabled={updateProfileMutation.isPending}
            />
          }
        />

        <SettingsHeading
          title="Connected Wallets"
          description="Display your connected wallets on your profile"
          action={
            <Switch
              checked={currentUser?.profileVisibility?.showConnectedPlatforms ?? true}
              onCheckedChange={(checked) => handleVisibilityChange('showConnectedPlatforms', checked)}
              disabled={updateProfileMutation.isPending}
            />
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm sm:text-base">
            Select Badges ({globalNetwork === 'SOLANA' ? 'Solana' : globalNetwork === 'BASE' ? 'Base' : globalNetwork === 'ARBITRUM' ? 'Arbitrum' : globalNetwork === 'MONAD' ? 'Monad' : 'Avalanche'})
          </h4>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-muted text-[10px] sm:text-xs">{selectedCount} of 3</span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs sm:px-3"
              onClick={handleResetBadges}
              disabled={resetAllBadgesMutation.isPending || updateBadgeSelectionMutation.isPending}
            >
              Reset
            </Button>
            {hasChanges && (
              <Button
                size="sm"
                className="h-8 px-2 text-xs sm:px-3"
                onClick={handleSaveBadges}
                disabled={updateBadgeSelectionMutation.isPending}
              >
                {updateBadgeSelectionMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        {filteredBadgeList.length === 0 ? (
          <div className="glass rounded-md p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No badges available for {globalNetwork === 'SOLANA' ? 'Solana' : globalNetwork === 'BASE' ? 'Base' : 'Avalanche'}. Earn badges by collecting NFTs and POAPs!
            </p>
          </div>
        ) : (
          <div className="glass grid grid-cols-1 gap-3 rounded-md p-3 sm:gap-4 sm:p-4 md:grid-cols-2 md:gap-6 md:p-6 lg:grid-cols-3">
            {filteredBadgeList.map(badge => (
              <div
                key={badge.id}
                className="glass flex min-h-[56px] cursor-pointer items-center justify-between gap-2 rounded-md p-2 sm:h-16 sm:p-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                  {badge.type === 'nft' && badge.isSeasonalBadge && (
                    <LeaderboardSeasonalBadge
                      badgeName={badge.name}
                      size={40}
                      showName={false}
                      defaultNetwork={globalNetwork as any}
                    />
                  )}
                  {badge.type === 'nft' && !badge.isSeasonalBadge && badge.contractAddress && (
                    <NFTCollectionAvatar
                      contractAddress={badge.contractAddress}
                      name={badge.name}
                      logo={badge.imageUrl}
                      size="md"
                    />
                  )}
                  {badge.type === 'poap' && (
                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                      POAP
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-pixel truncate text-xs sm:text-sm">{badge.name}</span>
                    <span className="text-muted-foreground text-[10px] uppercase sm:text-xs">
                      {badge.isSeasonalBadge ? 'SEASON BADGE' : badge.type}
                    </span>
                  </div>
                </div>

                {badge.isSelected ? (
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <span className="text-muted-foreground text-[10px] sm:text-xs">
                      #{badge.priority}
                    </span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto px-1 py-0 text-xs sm:px-2 sm:text-sm"
                      onClick={() => handleBadgeToggle(badge.id)}
                    >
                      Deselect
                    </Button>
                  </div>
                ) : selectedCount < 3 ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto shrink-0 px-1 py-0 text-xs sm:px-2 sm:text-sm"
                    onClick={() => handleBadgeToggle(badge.id)}
                  >
                    Select
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
