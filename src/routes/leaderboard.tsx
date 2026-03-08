  import { Gift } from 'lucide-react';

import { memo, useEffect, useMemo, useState } from 'react';

import { Link, createFileRoute } from '@tanstack/react-router'

import { requireAuth } from '@/lib/auth-guards';
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';

import { BribeButton } from '@/components/bribe-button';
import { BribeModal } from '@/components/bribe-modal';

import { Heading } from '@/components/heading';
import Icons from '@/components/icons';
import { LeaderboardSeasonalBadge } from '@/components/leaderboard-seasonal-badge';
import { NFTCollectionAvatar } from '@/components/nft-collection-avatar';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
} from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/auth-context';
import { useChain } from '@/contexts/chain-context';
import {
    useAgentIds,
    useAgentLeaderboard,
    useArenaConnectionStatus,
    useArenaLeaderboard,
    useArenaStats,
    useLeaderboard,
    useSendConnectionRequest,
    useSentRequests,
} from '@/hooks';
import { isSeasonalBadgeName } from '@/lib/seasonal-badge-utils';
import { cn } from '@/lib/utils';
import { getUserPhotoUrl } from '@/lib/utils/image';
import type { AgentLeaderboardEntry, LeaderboardBadge, LeaderboardEntry, Tier } from '@/types';

interface WhitelistCollection {
  contract_address: string;
  name: string;
  symbol: string;
  collection_logo: string;
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

interface Player {
  id: string;
  rank: number;
  playerName: string;
  slug: string;
  playerAvatar: string | null;
  twitterHandle?: string;
  change?: string | number;
  guudScore: number;
  topBadge?: LeaderboardBadge;
  tier?: Tier;
  isFriend?: boolean;
  isCurrentUser?: boolean;
  isEstimated?: boolean;
  likesCount?: number;
  dislikesCount?: number;
  evmBribeWallet?: string | null;
  solBribeWallet?: string | null;
  arenaYappingEnabled?: boolean;
  arenaPoints?: number;
}

const MemoizedPlayerAvatar = memo(
  ({
    src,
    alt,
    name,
    size = 'xs',
    className = 'size-6',
    isAgent,
  }: {
    src: string | null;
    alt: string;
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
    isAgent?: boolean;
  }) => {
    return (
      <ProfileAvatar
        src={src}
        alt={alt}
        name={name}
        size={size}
        className={className}
        isAgent={isAgent}
      />
    );
  }
);
MemoizedPlayerAvatar.displayName = 'MemoizedPlayerAvatar';

export const Route = createFileRoute('/leaderboard')({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
});

function RouteComponent() {
  const { user: authUser, isAuthenticated } = useAuthContext();
  const { selectedNetwork } = useChain();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [whitelistMap, setWhitelistMap] = useState<Map<string, WhitelistCollection>>(new Map());
  const [solanaWhitelistMap, setSolanaWhitelistMap] = useState<Map<string, SolanaCollection>>(new Map());
  
  // Filter states - manual score range inputs
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');
  const [badgeFilter, setBadgeFilter] = useState<string>('all');
  const [badgeSearchQuery, setBadgeSearchQuery] = useState<string>('');
  const [whitelistCollections, setWhitelistCollections] = useState<(WhitelistCollection | SolanaCollection)[]>([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'arena' | 'agents'>('leaderboard');

  // Batch bribe modal state
  const [isBatchBribeOpen, setIsBatchBribeOpen] = useState(false);

  // Arena yapping status for current user
  const { data: arenaConnection } = useArenaConnectionStatus();
  const { data: arenaStatsData } = useArenaStats();
  const isCurrentUserArenaActive = arenaConnection?.found && arenaConnection?.status === 'ACTIVE';
  const currentUserArenaPoints = arenaStatsData?.totalPointsEarned ?? 0;
  
  const { mutate: sendConnectionRequest, isPending: isSendingRequest } =
    useSendConnectionRequest();

  const { data: sentRequestsData } = useSentRequests();

  // Load whitelist data based on selected network
  useEffect(() => {
    // Reset badge filter when network changes
    setBadgeFilter('all');
    
    if (selectedNetwork === 'SOLANA') {
      fetch('/solana-whitelist-nft.json')
        .then(res => res.json())
        .then((data: SolanaWhitelistData) => {
          const map = new Map<string, SolanaCollection>();
          data.collections.forEach(collection => {
            // Normalize collection_mint to lowercase for consistent matching
            map.set(collection.collection_mint.toLowerCase(), collection);
          });
          setSolanaWhitelistMap(map);
          // Store collections for filter dropdown
          setWhitelistCollections(data.collections);
        })
        .catch(err => {
          console.error('Failed to load Solana NFT whitelist:', err);
        });
    } else {
      // Use network-specific whitelist files
      const whitelistFile = selectedNetwork === 'BASE' 
        ? '/base-whitelist-nft.json'
        : selectedNetwork === 'ARBITRUM'
        ? '/arbitrum-whitelist-nft.json'
        : selectedNetwork === 'MONAD'
        ? '/monad-whitelist-nft.json'
        : '/whitelist-nft.json'; // AVAX default
      
      fetch(whitelistFile)
        .then(res => res.json())
        .then((data: WhitelistData) => {
          const map = new Map<string, WhitelistCollection>();
          data.collections.forEach(collection => {
            // Normalize contract address to lowercase for consistent matching
            map.set(collection.contract_address.toLowerCase(), collection);
          });
          setWhitelistMap(map);
          // Store collections for filter dropdown
          setWhitelistCollections(data.collections);
        })
        .catch(err => {
          console.error('Failed to load NFT whitelist:', err);
        });
    }
  }, [selectedNetwork]);

  const hasRequestSent = (userId: string): boolean => {
    if (!sentRequestsData?.sentRequests) return false;
    return sentRequestsData.sentRequests.some(request => request.id === userId);
  };

  const { data: podiumData } = useLeaderboard({
    page: 1,
    limit: 3,
  });

  // Arena Yapping dedicated leaderboard
  const { data: arenaLeaderboardRaw } = useArenaLeaderboard({
    page: 1,
    limit: 100,
  });

  // Agent IDs set for bot badge display across all tabs
  const agentIds = useAgentIds();

  // Agent leaderboard
  const [agentPage, setAgentPage] = useState(1);
  const { data: agentLeaderboardData, isLoading: isAgentLoading } = useAgentLeaderboard({
    page: agentPage,
    limit: 50,
  });

  const {
    data: leaderboardData,
    isLoading,
    error,
  } = useLeaderboard({
    page: currentPage,
    limit: pageSize,
    nftCollection: badgeFilter !== 'all' ? badgeFilter : undefined,
  });

  const topThreeData: Player[] = useMemo(() => {
    if (!podiumData?.leaderboard) return [];

    const players = podiumData.leaderboard
      .slice(0, 3)
      .map((entry: LeaderboardEntry) => {
        // Extract Twitter handle from twitterUrl or use slug (not username to avoid emoji issues)
        let twitterHandle = entry.user.slug || entry.user.username;
        if (entry.user.twitterUrl) {
          const match = entry.user.twitterUrl.match(/(?:twitter\.com\/|x\.com\/)([^/]+)/);
          if (match) twitterHandle = match[1];
        }

        const isSelf = authUser ? entry.user.id === authUser.id : false;

        return {
          id: entry.user.id,
          rank: entry.rank,
          change: entry.change,
          playerName: entry.user.username,
          slug: entry.user.slug || entry.user.username,
          playerAvatar: entry.user.profilePicture,
          twitterHandle,
          guudScore: entry.guudScore,
          topBadge: entry.topBadge || undefined,
          isCurrentUser: isSelf,
          arenaYappingEnabled: isSelf ? (isCurrentUserArenaActive || entry.arenaYappingEnabled || entry.user.arenaYappingEnabled) : (entry.arenaYappingEnabled ?? entry.user.arenaYappingEnabled),
          arenaPoints: isSelf ? (currentUserArenaPoints || entry.user.arenaPoints) : entry.user.arenaPoints,
        };
      });

    // Sort by rank to ensure correct podium positions
    return players.sort((a, b) => a.rank - b.rank);
  }, [podiumData, authUser, isCurrentUserArenaActive, currentUserArenaPoints]);

  const transformedData: Player[] = useMemo(() => {
    if (!leaderboardData?.leaderboard) return [];

    return leaderboardData.leaderboard.map((entry: LeaderboardEntry) => {
      // Extract Twitter handle from twitterUrl or use slug (not username to avoid emoji issues)
      let twitterHandle = entry.user.slug || entry.user.username;
      if (entry.user.twitterUrl) {
        const match = entry.user.twitterUrl.match(/(?:twitter\.com\/|x\.com\/)([^/]+)/);
        if (match) twitterHandle = match[1];
      }

      const isSelf = authUser ? entry.user.id === authUser.id : false;

      return {
        id: entry.user.id,
        rank: entry.rank,
        change: entry.change,
        playerName: entry.user.username,
        slug: entry.user.slug || entry.user.username,
        playerAvatar: entry.user.profilePicture,
        twitterHandle,
        guudScore: entry.guudScore,
        topBadge: entry.topBadge || undefined,
        tier: entry.tier,
        isFriend: entry.isFriend,
        isCurrentUser: isSelf,
        likesCount: entry.likesCount ?? 0,
        dislikesCount: entry.dislikesCount ?? 0,
        evmBribeWallet: entry.evmBribeWallet || entry.user.evmBribeWallet || null,
        solBribeWallet: entry.solBribeWallet || entry.user.solBribeWallet || null,
        arenaYappingEnabled: isSelf ? (isCurrentUserArenaActive || entry.arenaYappingEnabled || entry.user.arenaYappingEnabled) : (entry.arenaYappingEnabled ?? entry.user.arenaYappingEnabled),
        arenaPoints: isSelf ? (currentUserArenaPoints || entry.user.arenaPoints) : entry.user.arenaPoints,
      };
    });
  }, [leaderboardData, authUser, isCurrentUserArenaActive, currentUserArenaPoints]);

  const currentUserData: Player | null = useMemo(() => {
    if (!leaderboardData?.currentUser || !authUser) return null;

    const current = leaderboardData.currentUser;
    // Extract Twitter handle from twitterUrl or use slug (not username to avoid emoji issues)
    let twitterHandle = current.user.slug || current.user.username;
    if (current.user.twitterUrl) {
      const match = current.user.twitterUrl.match(/(?:twitter\.com\/|x\.com\/)([^/]+)/);
      if (match) twitterHandle = match[1];
    }

    return {
      id: current.user.id,
      rank: current.rank,
      change: current.change,
      playerName: current.user.username,
      slug: current.user.slug || current.user.username,
      playerAvatar: current.user.profilePicture,
      twitterHandle,
      guudScore: current.guudScore,
      topBadge: current.topBadge || undefined,
      tier: current.tier,
      isFriend: false,
      isCurrentUser: true,
      isEstimated: current.isEstimated,
      likesCount: current.likesCount ?? 0,
      dislikesCount: current.dislikesCount ?? 0,
      arenaYappingEnabled: isCurrentUserArenaActive || current.arenaYappingEnabled || current.user.arenaYappingEnabled,
      arenaPoints: currentUserArenaPoints || current.user.arenaPoints,
    };
  }, [leaderboardData, authUser, isCurrentUserArenaActive, currentUserArenaPoints]);

  // Filter collections based on search query
  const filteredCollections = useMemo(() => {
    if (!badgeSearchQuery.trim()) return whitelistCollections;
    const query = badgeSearchQuery.toLowerCase();
    return whitelistCollections.filter(collection => 
      collection.name.toLowerCase().includes(query)
    );
  }, [whitelistCollections, badgeSearchQuery]);

  // Filter the transformed data based on score range (NFT filtering is done by API)
  const filteredData: Player[] = useMemo(() => {
    let result = transformedData;

    // Apply manual score range filter (client-side)
    const min = minScore ? parseInt(minScore, 10) : null;
    const max = maxScore ? parseInt(maxScore, 10) : null;
    
    if (min !== null && !isNaN(min)) {
      result = result.filter(player => player.guudScore >= min);
    }
    if (max !== null && !isNaN(max)) {
      result = result.filter(player => player.guudScore <= max);
    }

    // NFT collection filtering is now handled by the API via nftCollection parameter

    return result;
  }, [transformedData, minScore, maxScore]);

  // Check if any filter is active
  const hasActiveFilter = minScore !== '' || maxScore !== '' || badgeFilter !== 'all';

  // Arena yapping leaderboard data — from dedicated endpoint
  const arenaLeaderboardData: Player[] = useMemo(() => {
    if (!arenaLeaderboardRaw?.leaderboard) return [];

    return arenaLeaderboardRaw.leaderboard.map((entry: LeaderboardEntry) => {
      let twitterHandle = entry.user.slug || entry.user.username;
      if (entry.user.twitterUrl) {
        const match = entry.user.twitterUrl.match(/(?:twitter\.com\/|x\.com\/)([^/]+)/);
        if (match) twitterHandle = match[1];
      }

      const isSelf = authUser ? entry.user.id === authUser.id : false;

      return {
        id: entry.user.id,
        rank: entry.rank,
        change: entry.change,
        playerName: entry.user.username,
        slug: entry.user.slug || entry.user.username,
        playerAvatar: entry.user.profilePicture,
        twitterHandle,
        guudScore: entry.guudScore,
        topBadge: entry.topBadge || undefined,
        tier: entry.tier,
        isFriend: entry.isFriend,
        isCurrentUser: isSelf,
        likesCount: entry.likesCount ?? 0,
        dislikesCount: entry.dislikesCount ?? 0,
        evmBribeWallet: entry.evmBribeWallet || entry.user.evmBribeWallet || null,
        solBribeWallet: entry.solBribeWallet || entry.user.solBribeWallet || null,
        arenaYappingEnabled: true,
        arenaPoints: entry.user.arenaPoints ?? entry.guudScore,
      };
    });
  }, [arenaLeaderboardRaw, authUser]);

  // Agent leaderboard data transformation
  const agentPlayers: Player[] = useMemo(() => {
    if (!agentLeaderboardData?.leaderboard) return [];

    return agentLeaderboardData.leaderboard.map((entry: AgentLeaderboardEntry) => {
      return {
        id: entry.user.id,
        rank: entry.rank,
        change: entry.change,
        playerName: entry.user.username,
        slug: entry.user.slug || entry.user.username,
        playerAvatar: entry.user.profilePicture,
        guudScore: entry.guudScore,
        topBadge: undefined,
        tier: entry.tier,
        isFriend: entry.isFriend,
        isCurrentUser: false,
        likesCount: entry.likesCount ?? 0,
        dislikesCount: entry.dislikesCount ?? 0,
        evmBribeWallet: entry.user.evmBribeWallet || null,
        solBribeWallet: entry.user.solBribeWallet || null,
        arenaYappingEnabled: entry.arenaYappingEnabled,
        arenaPoints: entry.user.arenaPoints,
      };
    });
  }, [agentLeaderboardData]);

  // Check if current user is on the current page
  const isCurrentUserOnPage = useMemo(() => {
    if (!currentUserData) return false;
    return filteredData.some(player => player.id === currentUserData.id);
  }, [currentUserData, filteredData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (leaderboardData?.pagination.hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (leaderboardData?.pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const getPageNumbers = () => {
    const pagination = leaderboardData?.pagination;
    if (!pagination) return [];

    const { page, totalPages } = pagination;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page <= 4) {
        for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push('ellipsis');
        for (let i = Math.max(totalPages - 4, 2); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('ellipsis');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const getRankTextColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-[var(--rank-first)] fill-[var(--rank-first)]';
      case 2:
        return 'text-[var(--rank-second)] fill-[var(--rank-second)]';
      case 3:
        return 'text-[var(--rank-third)] fill-[var(--rank-third)]';
      default:
        return 'text-foreground';
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'rank',
        header: '#',
        cell: (info: any) => {
          const rank = info.getValue();
          const { isCurrentUser, isEstimated } = info.row.original;

          const colorClass = isCurrentUser
            ? rank <= 3
              ? getRankTextColor(rank)
              : 'text-primary'
            : getRankTextColor(rank);

          return (
            <div className="flex items-center justify-center gap-2">
              <div className={`text-sm font-semibold ${colorClass}`}>
                {rank}
              </div>
              {isEstimated && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-[10px]"
                >
                  Est
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'playerName',
        header: 'User',
        cell: (info: any) => {
          const playerName = info.getValue();
          const { id, change, isCurrentUser, playerAvatar, slug } =
            info.row.original;

          return (
            <div className="flex items-center gap-3">
              <Link
                to="/profile/$username"
                params={{ username: slug }}
                className="flex items-center gap-3"
              >
                <MemoizedPlayerAvatar
                  src={getUserPhotoUrl(playerAvatar)}
                  alt={playerName}
                  name={playerName}
                  size="sm"
                  className="size-8"
                  isAgent={agentIds.has(id)}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {isCurrentUser ? 'You' : playerName}
                  </span>
                  {Number(change) !== 0 && (
                    <span className={cn(
                      "text-xs",
                      Number(change) > 0 ? "text-success" : "text-destructive"
                    )}>
                      {Number(change) > 0 ? '+' : ''}{change}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: 'twitterHandle',
        header: 'X Profile',
        cell: (info: any) => {
          const handle = info.getValue();

          return handle ? (
            <a
              href={`https://x.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <Icons.xLogo className="size-3.5" />
              <span className="text-xs">@{handle.length > 15 ? `${handle.slice(0, 15)}...` : handle}</span>
            </a>
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          );
        },
      },
      {
        accessorKey: 'guudScore',
        header: 'GuudScore',
        cell: (info: any) => {
          return (
            <div className="text-sm font-semibold">
              {info.getValue().toLocaleString()}
            </div>
          );
        },
      },
      {
        accessorKey: 'topBadge',
        header: 'Top Badge',
        cell: (info: any) => {
          const badge: LeaderboardBadge | undefined = info.getValue();

          if (!badge) {
            return (
              <div className="flex">
                <span className="text-muted-foreground text-xs">-</span>
              </div>
            );
          }

          const badgeName = badge.name;

          // Check if this is a seasonal badge (e.g., "Q1 2026 AVAX Maxi")
          if (isSeasonalBadgeName(badgeName)) {
            return (
              <LeaderboardSeasonalBadge
                badgeName={badgeName}
                size={32}
                showName={true}
                defaultNetwork={selectedNetwork as any}
              />
            );
          }

          // Get collection info from whitelist if it's an NFT badge
          const contractAddress = badge.contractAddress?.toLowerCase();
          
          // Check both Avalanche and Solana whitelists based on selected network
          let displayName = badgeName;
          let badgeLogo = badge.icon;
          
          if (selectedNetwork === 'SOLANA') {
            const solanaCollection = contractAddress ? solanaWhitelistMap.get(contractAddress) : null;
            if (solanaCollection) {
              displayName = solanaCollection.name;
              badgeLogo = solanaCollection.collection_image;
            }
          } else {
            const whitelistCollection = contractAddress ? whitelistMap.get(contractAddress) : null;
            if (whitelistCollection) {
              displayName = whitelistCollection.name;
              badgeLogo = whitelistCollection.collection_logo;
            }
          }
          
          // Use badge's network or fallback to selected network (lowercase for display)
          const networkMap: Record<string, string> = {
            AVAX: 'avalanche',
            BASE: 'base',
            SOLANA: 'solana',
            ARBITRUM: 'arbitrum',
          };
          const network = badge.network || networkMap[selectedNetwork] || 'avalanche';

          return (
            <div className="flex items-center gap-2">
              <NFTCollectionAvatar
                name={displayName}
                contractAddress={badge.contractAddress || ''}
                logo={badgeLogo}
                network={network}
                size="sm"
                className="size-8"
              />
              <span className="text-xs hidden md:inline-block max-w-[120px] truncate" title={displayName}>
                {displayName}
              </span>
            </div>
          );
        },
      },
      {
        id: 'vouches',
        header: 'Vouches',
        cell: (info: any) => {
          const { likesCount, dislikesCount } = info.row.original;
          
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Icons.thumbsUp className="size-3.5 text-success" />
                <span className="text-xs text-success">{likesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icons.thumbsDown className="size-3.5 text-destructive" />
                <span className="text-xs text-destructive">{dislikesCount || 0}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'bribe',
        header: '',
        cell: (info: any) => {
          const player = info.row.original;
          const { isCurrentUser, evmBribeWallet, solBribeWallet } = player;

          // Don't show bribe button for self
          if (!isAuthenticated || isCurrentUser) {
            return null;
          }

          // Check if user has any bribe wallet
          const hasBribeWallet = evmBribeWallet || solBribeWallet;
          if (!hasBribeWallet) {
            return null;
          }

          return (
            <BribeButton
              user={{
                id: player.id,
                name: player.playerName,
                slug: player.slug,
                photo: player.playerAvatar,
                rank: player.rank,
                guudScore: player.guudScore,
                evmBribeWallet,
                solBribeWallet,
              }}
              showLabel={false}
              size="icon"
              variant="ghost"
              className="size-8"
            />
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: (info: any) => {
          const { id, isCurrentUser, isFriend } = info.row.original;

          if (!isAuthenticated || isCurrentUser) {
            return null;
          }

          if (isFriend) {
            return (
              <span className="text-success text-xs">Friend</span>
            );
          }

          // Check if request was already sent
          const requestSent = hasRequestSent(id);

          if (requestSent) {
            return (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground cursor-not-allowed text-xs h-8"
                disabled
              >
                Sent
              </Button>
            );
          }

          return (
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-accent text-xs h-8 transition-colors"
              onClick={() => sendConnectionRequest(id)}
              disabled={isSendingRequest}
            >
              {isSendingRequest ? 'Sending...' : '+ Add Friend'}
            </Button>
          );
        },
      },
    ],
    [getRankTextColor, hasRequestSent, sendConnectionRequest, isSendingRequest, whitelistMap, isAuthenticated, selectedNetwork]
  );

  // Prepare table data: show currentUser separately if not on current page
  const tableData = useMemo(() => {
    // Check if any filter is active
    // If filters are active, don't show current user separately
    if (hasActiveFilter) return filteredData;
    
    if (!currentUserData) return filteredData;

    // If user is already on the current page, just return the data as-is
    if (isCurrentUserOnPage) return filteredData;

    // Otherwise, add currentUser as the first row
    return [currentUserData, ...filteredData];
  }, [currentUserData, filteredData, isCurrentUserOnPage, hasActiveFilter]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <>
        <Heading
          title="Leaderboard"
          description="Loading leaderboard data..."
          badge="GuudScore"
        />
        <div className="flex items-center justify-center py-20">
          <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Heading
          title="Leaderboard"
          description="Error loading leaderboard data"
          badge="GuudScore"
        />
        <div className="bg-destructive/5 border-destructive/20 flex w-full items-center justify-center rounded-lg border py-20">
          <div className="text-center">
            <h4 className="text-destructive/20 font-pixel mb-4">
              Failed to load leaderboard
            </h4>
            <p className="text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leaderboard' | 'arena' | 'agents')} className="w-full">
        <div className="flex w-full flex-col items-center justify-center gap-1 sm:gap-1.5 p-4 sm:p-6 md:p-8 lg:p-10 text-center">
          <div className="glass rounded-md inline-flex gap-0.5 p-0.5 select-none">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={cn(
                'rounded-[5px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors',
                activeTab === 'leaderboard'
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              GuudScore
            </button>
            <button
              onClick={() => setActiveTab('arena')}
              className={cn(
                'rounded-[5px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors',
                activeTab === 'arena'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Arena Yapping
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={cn(
                'rounded-[5px] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors',
                activeTab === 'agents'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Agents
            </button>
          </div>
          <h1 className="font-pixel text-2xl sm:text-3xl md:text-4xl">Leaderboard</h1>
          <p className="mt-0! font-serif text-base sm:text-lg md:text-xl">
            {activeTab === 'leaderboard'
              ? 'Top players ranked by their GuudScore'
              : activeTab === 'arena'
              ? 'Top yappers ranked by Arena Points'
              : 'Top agents ranked by their GuudScore'}
          </p>
        </div>

      {/* Batch Bribe Section */}
      {isAuthenticated && activeTab === 'leaderboard' && (
        <div className="flex justify-center mb-6">
          <Button
            variant="outline"
            size="default"
            className="border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setIsBatchBribeOpen(true)}
          >
            <Gift className="size-4 mr-2" />
            Bribe Leaderboard
          </Button>
        </div>
      )}

      {/* Batch Bribe Modal */}
      <BribeModal
        isOpen={isBatchBribeOpen}
        onClose={() => setIsBatchBribeOpen(false)}
        nftCollections={whitelistCollections}
        selectedNftCollection={badgeFilter !== 'all' ? badgeFilter : undefined}
      />

        <TabsContent value="leaderboard">
      <div className="mb-10 flex justify-center pt-19 select-none">
        {topThreeData.length === 3 && (
          <div className="relative mx-auto w-full max-w-[480px]">
            <img
              src="/leaderboard.svg"
              alt="Guudscore Leaderboard"
              width={480}
              height={320}
              className="h-auto w-full"
            />

            <div className="absolute inset-0 z-10 -mb-3 flex items-end justify-center gap-2 px-2 sm:gap-8">
              {topThreeData[1] && (
                <Link
                  to="/profile/$username"
                  params={{ username: topThreeData[1].slug }}
                  className="absolute left-12 mr-2 mb-4 flex flex-col items-center sm:mr-6 sm:mb-10"
                >
                  <div className="mb-2 rounded-full border-2 border-[var(--rank-second)] sm:mb-10">
                    <ProfileAvatar
                      src={getUserPhotoUrl(topThreeData[1].playerAvatar)}
                      alt={topThreeData[1].playerName}
                      name={topThreeData[1].playerName}
                      size="full"
                      className="bg-background h-8 w-8 sm:h-16 sm:w-16 md:h-20 md:w-20"
                      isAgent={agentIds.has(topThreeData[1].id)}
                    />
                  </div>
                  <span
                    className={`font-pixel text-center text-xs sm:text-sm ${
                      topThreeData[1].isCurrentUser
                        ? getRankTextColor(2)
                        : getRankTextColor(2)
                    }`}
                    title={
                      topThreeData[1].isCurrentUser
                        ? 'YOU'
                        : topThreeData[1].playerName
                    }
                  >
                    {topThreeData[1].isCurrentUser
                      ? 'YOU'
                      : topThreeData[1].playerName.length > 12
                        ? `${topThreeData[1].playerName.slice(0, 12)}...`
                        : topThreeData[1].playerName}
                  </span>
                </Link>
              )}

              {topThreeData[0] && (
                <Link
                  to="/profile/$username"
                  params={{ username: topThreeData[0].slug }}
                  className="absolute mb-8 ml-1 flex flex-col items-center sm:mb-24 sm:ml-2"
                >
                  <div className="mb-2 rounded-full border-2 border-[var(--rank-first)] sm:mb-12 sm:border-3">
                    <ProfileAvatar
                      src={getUserPhotoUrl(topThreeData[0].playerAvatar)}
                      alt={topThreeData[0].playerName}
                      name={topThreeData[0].playerName}
                      size="full"
                      className="bg-background h-10 w-10 sm:h-20 sm:w-20 md:h-24 md:w-24"
                      isAgent={agentIds.has(topThreeData[0].id)}
                    />
                  </div>
                  <span
                    className={`font-pixel text-center text-sm font-bold sm:text-base ${
                      topThreeData[0].isCurrentUser
                        ? getRankTextColor(1)
                        : getRankTextColor(1)
                    }`}
                    title={
                      topThreeData[0].isCurrentUser
                        ? 'YOU'
                        : topThreeData[0].playerName
                    }
                  >
                    {topThreeData[0].isCurrentUser
                      ? 'YOU'
                      : topThreeData[0].playerName.length > 12
                        ? `${topThreeData[0].playerName.slice(0, 12)}...`
                        : topThreeData[0].playerName}
                  </span>
                </Link>
              )}

              {topThreeData[2] && (
                <Link
                  to="/profile/$username"
                  params={{ username: topThreeData[2].slug }}
                  className="absolute right-9 mb-2 ml-2 flex flex-col items-center sm:mb-6 sm:ml-6"
                >
                  <div className="mb-2 rounded-full border-2 border-[var(--rank-third)] sm:mb-7">
                    <ProfileAvatar
                      src={getUserPhotoUrl(topThreeData[2].playerAvatar)}
                      alt={topThreeData[2].playerName}
                      name={topThreeData[2].playerName}
                      size="full"
                      className="bg-background h-6 w-6 sm:h-12 sm:w-12 md:h-16 md:w-16"
                      isAgent={agentIds.has(topThreeData[2].id)}
                    />
                  </div>
                  <span
                    className={`font-pixel text-center text-xs ${
                      topThreeData[2].isCurrentUser
                        ? getRankTextColor(3)
                        : getRankTextColor(3)
                    }`}
                    title={
                      topThreeData[2].isCurrentUser
                        ? 'YOU'
                        : topThreeData[2].playerName
                    }
                  >
                    {topThreeData[2].isCurrentUser
                      ? 'YOU'
                      : topThreeData[2].playerName.length > 12
                        ? `${topThreeData[2].playerName.slice(0, 12)}...`
                        : topThreeData[2].playerName}
                  </span>
                </Link>
              )}
            </div>

            <div className="absolute bottom-0 left-0 h-12 w-full bg-gradient-to-t from-[#060010] to-transparent"></div>
          </div>
        )}
      </div>

      <div className="w-full">
        {/* Filters and Page Size Selector */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Score Range Filter - Manual Input */}
            <div className="flex items-center gap-2">
              <Icons.filter className="text-muted-foreground size-4" />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setMinScore(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-[80px] text-sm"
                  min={0}
                />
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setMaxScore(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-[80px] text-sm"
                  min={0}
                />
              </div>
            </div>

            {/* Badge Filter with Search */}
            <div className="flex items-center gap-2">
              <Icons.badge className="text-muted-foreground size-4" />
              <Select 
                value={badgeFilter} 
                onValueChange={(value) => {
                  setBadgeFilter(value);
                  setBadgeSearchQuery('');
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="NFT Badge" />
                </SelectTrigger>
                <SelectContent 
                  align="start" 
                  className="max-h-[350px] overflow-hidden !bg-[#0a0a0f] !border !border-border/40 !rounded-md"
                >
                  {/* Search Input - Fixed at top */}
                  <div className="sticky top-0 z-10 p-2 border-b border-border/40 -mx-1 -mt-1 bg-[#0a0a0f]">
                    <div className="relative">
                      <Icons.search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                      <input
                        type="text"
                        placeholder="Search collections..."
                        value={badgeSearchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBadgeSearchQuery(e.target.value)}
                        className="h-8 w-full pl-8 pr-3 text-sm rounded-md border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 bg-[#0a0a0f]"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto bg-[#0a0a0f]">
                  <SelectItem value="all">All Badges</SelectItem>
                  {filteredCollections.length === 0 && badgeSearchQuery && (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No collections found
                    </div>
                  )}
                  {filteredCollections
                    .filter((collection) => {
                      // Filter out collections with empty addresses
                      const address = 'contract_address' in collection 
                        ? collection.contract_address 
                        : collection.collection_mint;
                      return address && address.trim() !== '';
                    })
                    .map((collection) => {
                    const address = 'contract_address' in collection 
                      ? collection.contract_address 
                      : collection.collection_mint;
                    const name = collection.name;
                    const logo = 'collection_logo' in collection 
                      ? collection.collection_logo 
                      : collection.collection_image;
                    
                    return (
                      <SelectItem key={address} value={address}>
                        <div className="flex items-center gap-2">
                          {logo && (
                            <img 
                              src={logo} 
                              alt={name} 
                              className="size-4 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="truncate max-w-[120px]">{name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilter && (
              <>
                <span className="text-muted-foreground text-xs">
                  ({filteredData.length} result{filteredData.length !== 1 ? 's' : ''})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMinScore('');
                    setMaxScore('');
                    setBadgeFilter('all');
                    setBadgeSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2 text-xs"
                >
                  <Icons.x className="mr-1 size-3" />
                  Clear
                </Button>
              </>
            )}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[80px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-border/40">
                  {headerGroup.headers.map((header, index) => (
                    <th
                      key={header.id}
                      className={cn(
                        "text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase tracking-wider",
                        index === 0 && "w-16 text-center",
                        index === 2 && 'hidden sm:table-cell',
                        index === 4 && 'hidden md:table-cell'
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => {
                const player = row.original as Player;
                const isCurrentUser = player.isCurrentUser;

                // Check if this is the current user row shown separately (first row and not on current page)
                const isSeparateCurrentUserRow =
                  isCurrentUser && rowIndex === 0 && !isCurrentUserOnPage;

                return (
                  <>
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-border/20 transition-colors',
                        isCurrentUser && 'bg-primary/5'
                      )}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-4 py-3.5',
                            index === 0 && 'text-center',
                            index === 2 && 'hidden sm:table-cell',
                            index === 4 && 'hidden md:table-cell'
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {/* Add separator after current user row if shown separately */}
                    {isSeparateCurrentUserRow && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-2"
                        >
                          <div className="border-b border-dashed border-border/30" />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            {hasActiveFilter ? (
              <>
                <Icons.filter className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                <p className="text-muted mb-2">No players match your filters</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMinScore('');
                    setMaxScore('');
                    setBadgeFilter('all');
                    setBadgeSearchQuery('');
                  }}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              </>
            ) : (
              <p className="text-muted">No leaderboard data available</p>
            )}
          </div>
        )}

        {leaderboardData?.pagination &&
          leaderboardData.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={handlePrevious}
                      className={cn(
                        'cursor-pointer',
                        !leaderboardData.pagination.hasPrev &&
                          'cursor-not-allowed opacity-50'
                      )}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, index) => (
                    <PaginationItem key={index}>
                      {pageNum === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === currentPage}
                          className={cn(
                            'cursor-pointer',
                            pageNum === currentPage &&
                              'bg-primary/10 text-primary border-primary/30'
                          )}
                        >
                          {pageNum}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={handleNext}
                      className={cn(
                        'cursor-pointer',
                        !leaderboardData.pagination.hasNext &&
                          'cursor-not-allowed opacity-50'
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
      </div>
        </TabsContent>

        <TabsContent value="arena">
          <div className="w-full">
            {arenaLeaderboardData.length === 0 ? (
              <div className="py-12 text-center">
                <Icons.trophy className="mx-auto mb-3 size-8 text-orange-500/50" />
                <p className="text-muted-foreground mb-1">No Arena Yapping players found</p>
                <p className="text-muted-foreground text-xs">Players with Arena Yapping enabled will appear here</p>
              </div>
            ) : (
              <>
                {/* Arena Podium */}
                {arenaLeaderboardData.length >= 3 && (
                  <div className="mb-10 flex justify-center pt-19 select-none">
                    <div className="relative mx-auto w-full max-w-[480px]">
                      <img
                        src="/leaderboard.svg"
                        alt="Arena Yapping Leaderboard"
                        width={480}
                        height={320}
                        className="h-auto w-full"
                      />

                      <div className="absolute inset-0 z-10 -mb-3 flex items-end justify-center gap-2 px-2 sm:gap-8">
                        {/* 2nd place */}
                        <Link
                          to="/profile/$username"
                          params={{ username: arenaLeaderboardData[1].slug }}
                          className="absolute left-12 mr-2 mb-4 flex flex-col items-center sm:mr-6 sm:mb-10"
                        >
                          <div className="mb-2 rounded-full border-2 border-orange-400 sm:mb-10">
                            <ProfileAvatar
                              src={getUserPhotoUrl(arenaLeaderboardData[1].playerAvatar)}
                              alt={arenaLeaderboardData[1].playerName}
                              name={arenaLeaderboardData[1].playerName}
                              size="full"
                              className="bg-background h-8 w-8 sm:h-16 sm:w-16 md:h-20 md:w-20"
                            />
                          </div>
                          <span
                            className="font-pixel text-center text-xs sm:text-sm text-orange-300"
                            title={arenaLeaderboardData[1].isCurrentUser ? 'YOU' : arenaLeaderboardData[1].playerName}
                          >
                            {arenaLeaderboardData[1].isCurrentUser
                              ? 'YOU'
                              : arenaLeaderboardData[1].playerName.length > 12
                                ? `${arenaLeaderboardData[1].playerName.slice(0, 12)}...`
                                : arenaLeaderboardData[1].playerName}
                          </span>
                        </Link>

                        {/* 1st place */}
                        <Link
                          to="/profile/$username"
                          params={{ username: arenaLeaderboardData[0].slug }}
                          className="absolute mb-8 ml-1 flex flex-col items-center sm:mb-24 sm:ml-2"
                        >
                          <div className="mb-2 rounded-full border-2 border-orange-500 sm:mb-12 sm:border-3">
                            <ProfileAvatar
                              src={getUserPhotoUrl(arenaLeaderboardData[0].playerAvatar)}
                              alt={arenaLeaderboardData[0].playerName}
                              name={arenaLeaderboardData[0].playerName}
                              size="full"
                              className="bg-background h-10 w-10 sm:h-20 sm:w-20 md:h-24 md:w-24"
                            />
                          </div>
                          <span
                            className="font-pixel text-center text-sm font-bold sm:text-base text-orange-400"
                            title={arenaLeaderboardData[0].isCurrentUser ? 'YOU' : arenaLeaderboardData[0].playerName}
                          >
                            {arenaLeaderboardData[0].isCurrentUser
                              ? 'YOU'
                              : arenaLeaderboardData[0].playerName.length > 12
                                ? `${arenaLeaderboardData[0].playerName.slice(0, 12)}...`
                                : arenaLeaderboardData[0].playerName}
                          </span>
                        </Link>

                        {/* 3rd place */}
                        <Link
                          to="/profile/$username"
                          params={{ username: arenaLeaderboardData[2].slug }}
                          className="absolute right-9 mb-2 ml-2 flex flex-col items-center sm:mb-6 sm:ml-6"
                        >
                          <div className="mb-2 rounded-full border-2 border-orange-300 sm:mb-7">
                            <ProfileAvatar
                              src={getUserPhotoUrl(arenaLeaderboardData[2].playerAvatar)}
                              alt={arenaLeaderboardData[2].playerName}
                              name={arenaLeaderboardData[2].playerName}
                              size="full"
                              className="bg-background h-6 w-6 sm:h-12 sm:w-12 md:h-16 md:w-16"
                            />
                          </div>
                          <span
                            className="font-pixel text-center text-xs text-orange-200"
                            title={arenaLeaderboardData[2].isCurrentUser ? 'YOU' : arenaLeaderboardData[2].playerName}
                          >
                            {arenaLeaderboardData[2].isCurrentUser
                              ? 'YOU'
                              : arenaLeaderboardData[2].playerName.length > 12
                                ? `${arenaLeaderboardData[2].playerName.slice(0, 12)}...`
                                : arenaLeaderboardData[2].playerName}
                          </span>
                        </Link>
                      </div>

                      <div className="absolute bottom-0 left-0 h-12 w-full bg-gradient-to-t from-[#060010] to-transparent"></div>
                    </div>
                  </div>
                )}

                {/* Arena Table — full list 1,2,3... */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-muted-foreground w-16 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">#</th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                        <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider sm:table-cell">Arena Profile</th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Arena Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arenaLeaderboardData.map((player, index) => {
                        const rank = index + 1;
                        return (
                          <tr
                            key={player.id}
                            className={cn(
                              'border-b border-border/20 transition-colors',
                              player.isCurrentUser && 'bg-orange-500/5'
                            )}
                          >
                            <td className="px-4 py-3.5 text-center">
                              <span className="text-sm font-semibold">
                                {rank}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <Link
                                to="/profile/$username"
                                params={{ username: player.slug }}
                                className="flex items-center gap-3"
                              >
                                <MemoizedPlayerAvatar
                                  src={getUserPhotoUrl(player.playerAvatar)}
                                  alt={player.playerName}
                                  name={player.playerName}
                                  size="sm"
                                  className="size-8"
                                  isAgent={agentIds.has(player.id)}
                                />
                                <span className="text-sm font-medium">
                                  {player.isCurrentUser ? 'You' : player.playerName}
                                </span>
                              </Link>
                            </td>
                            <td className="hidden px-4 py-3.5 sm:table-cell">
                              {player.slug ? (
                                <a
                                  href={`https://arena.social/${player.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                                >
                                  <Icons.arena className="size-3.5" />
                                  <span className="text-xs">@{player.slug.length > 15 ? `${player.slug.slice(0, 15)}...` : player.slug}</span>
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-sm font-semibold text-orange-400">
                                {(player.arenaPoints ?? 0).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <div className="w-full">
            {isAgentLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            ) : agentPlayers.length === 0 ? (
              <div className="py-12 text-center">
                <Icons.trophy className="mx-auto mb-3 size-8 text-cyan-500/50" />
                <p className="text-muted-foreground mb-1">No agents found</p>
                <p className="text-muted-foreground text-xs">Agents with GuudScore will appear here</p>
              </div>
            ) : (
              <>
                {/* Agent Podium */}
                {agentPlayers.length >= 3 && (
                  <div className="mb-10 flex justify-center pt-19 select-none">
                    <div className="relative mx-auto w-full max-w-[480px]">
                      <img
                        src="/leaderboard.svg"
                        alt="Agent Leaderboard"
                        width={480}
                        height={320}
                        className="h-auto w-full"
                      />

                      <div className="absolute inset-0 z-10 -mb-3 flex items-end justify-center gap-2 px-2 sm:gap-8">
                        {/* 2nd place */}
                        <Link
                          to="/profile/$username"
                          params={{ username: agentPlayers[1].slug }}
                          className="absolute left-12 mr-2 mb-4 flex flex-col items-center sm:mr-6 sm:mb-10"
                        >
                          <div className="relative mb-2 rounded-full border-2 border-cyan-400 sm:mb-10">
                            <ProfileAvatar
                              src={getUserPhotoUrl(agentPlayers[1].playerAvatar)}
                              alt={agentPlayers[1].playerName}
                              name={agentPlayers[1].playerName}
                              size="full"
                              className="bg-background h-8 w-8 sm:h-16 sm:w-16 md:h-20 md:w-20"
                              isAgent
                            />
                          </div>
                          <span
                            className="font-pixel text-center text-xs sm:text-sm text-cyan-300"
                            title={agentPlayers[1].playerName}
                          >
                            {agentPlayers[1].playerName.length > 12
                              ? `${agentPlayers[1].playerName.slice(0, 12)}...`
                              : agentPlayers[1].playerName}
                          </span>
                        </Link>

                        {/* 1st place */}
                        <Link
                          to="/profile/$username"
                          params={{ username: agentPlayers[0].slug }}
                          className="absolute mb-8 ml-1 flex flex-col items-center sm:mb-24 sm:ml-2"
                        >
                          <div className="relative mb-2 rounded-full border-2 border-cyan-500 sm:mb-12 sm:border-3">
                            <ProfileAvatar
                              src={getUserPhotoUrl(agentPlayers[0].playerAvatar)}
                              alt={agentPlayers[0].playerName}
                              name={agentPlayers[0].playerName}
                              size="full"
                              className="bg-background h-10 w-10 sm:h-20 sm:w-20 md:h-24 md:w-24"
                              isAgent
                            />
                          </div>
                          <span
                            className="font-pixel text-center text-sm font-bold sm:text-base text-cyan-400"
                            title={agentPlayers[0].playerName}
                          >
                            {agentPlayers[0].playerName.length > 12
                              ? `${agentPlayers[0].playerName.slice(0, 12)}...`
                              : agentPlayers[0].playerName}
                          </span>
                        </Link>

                        {/* 3rd place */}
                        <Link
                          to="/profile/$username"
                          params={{ username: agentPlayers[2].slug }}
                          className="absolute right-9 mb-2 ml-2 flex flex-col items-center sm:mb-6 sm:ml-6"
                        >
                          <div className="relative mb-2 rounded-full border-2 border-cyan-300 sm:mb-7">
                            <ProfileAvatar
                              src={getUserPhotoUrl(agentPlayers[2].playerAvatar)}
                              alt={agentPlayers[2].playerName}
                              name={agentPlayers[2].playerName}
                              size="full"
                              className="bg-background h-6 w-6 sm:h-12 sm:w-12 md:h-16 md:w-16"
                              isAgent
                            />
                          </div>
                          <span
                            className="font-pixel text-center text-xs text-cyan-200"
                            title={agentPlayers[2].playerName}
                          >
                            {agentPlayers[2].playerName.length > 12
                              ? `${agentPlayers[2].playerName.slice(0, 12)}...`
                              : agentPlayers[2].playerName}
                          </span>
                        </Link>
                      </div>

                      <div className="absolute bottom-0 left-0 h-12 w-full bg-gradient-to-t from-[#060010] to-transparent"></div>
                    </div>
                  </div>
                )}

                {/* Agent Table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-muted-foreground w-16 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">#</th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Agent</th>
                        <th className="text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">GuudScore</th>
                        <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider sm:table-cell">Tier</th>
                        <th className="text-muted-foreground hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider md:table-cell">Vouches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentPlayers.map((player) => (
                        <tr
                          key={player.id}
                          className="border-b border-border/20 transition-colors hover:bg-cyan-500/5"
                        >
                          <td className="px-4 py-3.5 text-center">
                            <span className={cn('text-sm font-semibold', getRankTextColor(player.rank))}>
                              {player.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <Link
                              to="/profile/$username"
                              params={{ username: player.slug }}
                              className="flex items-center gap-3"
                            >
                              <MemoizedPlayerAvatar
                                src={getUserPhotoUrl(player.playerAvatar)}
                                alt={player.playerName}
                                name={player.playerName}
                                size="sm"
                                className="size-8"
                                isAgent
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {player.playerName}
                                </span>
                                {Number(player.change) !== 0 && (
                                  <span className={cn(
                                    "text-xs",
                                    Number(player.change) > 0 ? "text-success" : "text-destructive"
                                  )}>
                                    {Number(player.change) > 0 ? '+' : ''}{player.change}
                                  </span>
                                )}
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-semibold text-cyan-400">
                              {player.guudScore.toLocaleString()}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3.5 sm:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {player.tier}
                            </Badge>
                          </td>
                          <td className="hidden px-4 py-3.5 md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Icons.thumbsUp className="size-3.5 text-success" />
                                <span className="text-xs text-success">{player.likesCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Icons.thumbsDown className="size-3.5 text-destructive" />
                                <span className="text-xs text-destructive">{player.dislikesCount || 0}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Agent Pagination */}
                {agentLeaderboardData && agentLeaderboardData.pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setAgentPage((p) => Math.max(1, p - 1))}
                            className={!agentLeaderboardData.pagination.hasPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-muted-foreground text-sm px-3">
                            Page {agentLeaderboardData.pagination.page} of {agentLeaderboardData.pagination.totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setAgentPage((p) => p + 1)}
                            className={!agentLeaderboardData.pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
