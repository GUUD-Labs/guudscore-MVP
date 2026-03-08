import { Clock, Medal, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    SeasonalBadgeCard,
    SeasonalBadgeCardSkeleton,
    SeasonalBadgeMini,
} from '@/components/seasonal-badge-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NetworkType } from '@/contexts/chain-context';
import {
    getCurrentQuarterInfo,
    getDaysRemainingInQuarter,
    useMySeasonalBadges,
    useUserSeasonalBadges,
} from '@/hooks';
import { cn } from '@/lib/utils';
import type { SeasonBadge } from '@/types/badge';

// ==========================================
// Props Interface
// ==========================================

export interface SeasonalBadgesSectionProps {
  userId?: string; // If provided, shows another user's badges. Otherwise shows current user's badges.
  className?: string;
  compact?: boolean; // Compact mode for sidebar or smaller displays
}

// ==========================================
// Network Tab Labels
// ==========================================

const NETWORK_LABELS: Record<NetworkType, { label: string; color: string }> = {
  AVAX: { label: 'Avalanche', color: 'text-red-400' },
  BASE: { label: 'Base', color: 'text-blue-400' },
  SOLANA: { label: 'Solana', color: 'text-purple-400' },
  ARBITRUM: { label: 'Arbitrum', color: 'text-sky-400' },
  MONAD: { label: 'Monad', color: 'text-violet-400' },
};

const NETWORKS: NetworkType[] = ['AVAX', 'BASE', 'SOLANA', 'ARBITRUM', 'MONAD'];

// ==========================================
// Quarter Countdown Component
// ==========================================

const QuarterCountdown = () => {
  const { quarter, year } = getCurrentQuarterInfo();
  const daysRemaining = getDaysRemainingInQuarter();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="size-3" />
      <span>
        Q{quarter} {year} ends in <span className="text-white font-medium">{daysRemaining} days</span>
      </span>
    </div>
  );
};

// ==========================================
// Stats Summary Component
// ==========================================

interface BadgeStatsSummaryProps {
  badges: SeasonBadge[];
}

const BadgeStatsSummary = ({ badges }: BadgeStatsSummaryProps) => {
  const stats = useMemo(() => {
    const legendary = badges.filter(b => b.rarity === 'LEGENDARY').length;
    const epic = badges.filter(b => b.rarity === 'EPIC').length;
    const rare = badges.filter(b => b.rarity === 'RARE').length;
    const common = badges.filter(b => b.rarity === 'COMMON').length;
    const networksWithBadges = new Set(badges.map(b => b.network)).size;
    const bestRank = badges.length > 0 ? Math.min(...badges.map(b => b.rank)) : null;

    return {
      total: badges.length,
      legendary,
      epic,
      rare,
      common,
      networksWithBadges,
      bestRank,
    };
  }, [badges]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="glass rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-xs text-muted-foreground">Total Badges</div>
      </div>
      <div className="glass rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-amber-400">{stats.legendary}</div>
        <div className="text-xs text-muted-foreground">Legendary</div>
      </div>
      <div className="glass rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-purple-400">{stats.epic}</div>
        <div className="text-xs text-muted-foreground">Epic</div>
      </div>
      <div className="glass rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-primary">{stats.bestRank ? `#${stats.bestRank}` : '-'}</div>
        <div className="text-xs text-muted-foreground">Best Rank</div>
      </div>
    </div>
  );
};

// ==========================================
// Main Component
// ==========================================

export const SeasonalBadgesSection = ({
  userId,
  className,
  compact = false,
}: SeasonalBadgesSectionProps) => {
  const [activeNetwork, setActiveNetwork] = useState<NetworkType | 'ALL'>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<SeasonBadge | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Fetch badges based on whether we're viewing own or another user's badges
  const {
    data: myBadges,
    isLoading: isLoadingMyBadges,
  } = useMySeasonalBadges({ network: activeNetwork === 'ALL' ? undefined : activeNetwork });

  const {
    data: userBadges,
    isLoading: isLoadingUserBadges,
  } = useUserSeasonalBadges(userId || '', {
    network: activeNetwork === 'ALL' ? undefined : activeNetwork,
  });

  const badges = userId ? userBadges : myBadges;
  const isLoading = userId ? isLoadingUserBadges : isLoadingMyBadges;

  // Filter badges by year
  const filteredBadges = useMemo(() => {
    if (!badges) return [];
    if (yearFilter === 'all') return badges;
    return badges.filter(b => b.year.toString() === yearFilter);
  }, [badges, yearFilter]);

  // Get unique years for filter
  const availableYears = useMemo(() => {
    if (!badges) return [];
    const years = [...new Set(badges.map(b => b.year))];
    return years.sort((a, b) => b - a);
  }, [badges]);

  // Group badges by quarter and network
  const groupedBadges = useMemo(() => {
    const groups: Record<string, SeasonBadge[]> = {};
    filteredBadges.forEach(badge => {
      const key = `Q${badge.quarter} ${badge.year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(badge);
    });
    
    // Sort by date (newest first)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const [qA, yA] = a.split(' ');
      const [qB, yB] = b.split(' ');
      if (yA !== yB) return parseInt(yB) - parseInt(yA);
      return parseInt(qB.replace('Q', '')) - parseInt(qA.replace('Q', ''));
    });

    return { groups, sortedKeys };
  }, [filteredBadges]);

  // ==========================================
  // Compact View (for sidebar)
  // ==========================================
  if (compact) {
    return (
      <Card className={cn('glass border-glass-border', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="size-4 text-amber-400" />
            Season Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex gap-2 flex-wrap">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="size-12 rounded-lg" />
              ))}
            </div>
          ) : filteredBadges.length === 0 ? (
            <p className="text-xs text-muted-foreground">No seasonal badges yet</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {filteredBadges.slice(0, 6).map(badge => (
                <SeasonalBadgeMini
                  key={badge.id}
                  badge={badge}
                  size={48}
                  className="cursor-pointer"
                />
              ))}
              {filteredBadges.length > 6 && (
                <div className="size-12 rounded-lg glass flex items-center justify-center text-xs text-muted-foreground">
                  +{filteredBadges.length - 6}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ==========================================
  // Full View
  // ==========================================
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Medal className="size-6 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Seasonal Badges</h2>
            <QuarterCountdown />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] glass border-glass-border">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Summary */}
      {!isLoading && badges && badges.length > 0 && (
        <BadgeStatsSummary badges={badges} />
      )}

      {/* Network Tabs */}
      <Tabs
        value={activeNetwork}
        onValueChange={(v: string) => setActiveNetwork(v as NetworkType | 'ALL')}
      >
        <TabsList className="glass border-glass-border w-full justify-start overflow-x-auto">
          <TabsTrigger value="ALL" className="data-[state=active]:bg-primary/20">
            All Networks
          </TabsTrigger>
          {NETWORKS.map(network => (
            <TabsTrigger
              key={network}
              value={network}
              className={cn('data-[state=active]:bg-primary/20', NETWORK_LABELS[network].color)}
            >
              {NETWORK_LABELS[network].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeNetwork} className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <SeasonalBadgeCardSkeleton key={i} size="md" />
              ))}
            </div>
          ) : filteredBadges.length === 0 ? (
            <Card className="glass border-glass-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="size-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Seasonal Badges Yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {userId
                    ? "This user hasn't earned any seasonal badges yet."
                    : 'Keep building your GuudScore to earn badges at the end of each quarter!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedBadges.sortedKeys.map(quarterKey => (
                <div key={quarterKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="glass border-glass-border">
                      {quarterKey}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {groupedBadges.groups[quarterKey].length} badge(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupedBadges.groups[quarterKey].map(badge => (
                      <SeasonalBadgeCard
                        key={badge.id}
                        badge={badge}
                        size="md"
                        onClick={() => setSelectedBadge(badge)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Badge Detail Dialog */}
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="glass border-glass-border max-w-md">
          <DialogHeader>
            <DialogTitle>Badge Details</DialogTitle>
          </DialogHeader>
          {selectedBadge && (
            <div className="flex flex-col items-center gap-4">
              <SeasonalBadgeCard badge={selectedBadge} size="lg" showDetails />
              
              {/* Additional details */}
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Season</span>
                  <span className="text-white">{selectedBadge.seasonName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Users</span>
                  <span className="text-white">{selectedBadge.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Rank</span>
                  <span className="text-white">#{selectedBadge.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Awarded</span>
                  <span className="text-white">
                    {new Date(selectedBadge.awardedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedBadge(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeasonalBadgesSection;
