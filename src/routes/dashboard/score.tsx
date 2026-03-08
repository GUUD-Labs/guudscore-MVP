import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { createFileRoute } from '@tanstack/react-router';

import { Card } from '@/components/card';
import { ErrorMessage } from '@/components/error-message';
import { NftAvatar } from '@/components/nft-avatar';
import { Badge } from '@/components/ui/badge';
import { useChain } from '@/contexts/chain-context';
import { useBadgesList, useGuudScoreHistory } from '@/hooks';
import { getChainBadgeDescription, getChainBadgeName, getUserBadgeIcon, getUserBadgePriority, type ChainNetwork } from '@/lib/tier-utils';
import { dateFormatter } from '@/lib/utils';

export const Route = createFileRoute('/dashboard/score')({
  component: RouteComponent,
});

function RouteComponent() {
  const { selectedNetwork } = useChain();
  const { data: scoreHistoryData, isLoading, error } = useGuudScoreHistory();

  const {
    data: badgesData,
    isLoading: badgesLoading,
    error: badgesError,
  } = useBadgesList({
    page: 1,
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h4 className="text-muted text-sm">Loading score...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        header="Error loading score"
        error={error.message || 'Unknown error'}
      />
    );
  }

  const scoreHistory =
    scoreHistoryData?.map(item => ({
      date: dateFormatter(item.date),
      score: item.score,
    })) || [];

  const getBadgeTypeColor = (type: string) => {
    switch (type) {
      case 'POAP_BADGE':
        return 'text-yellow-400';
      case 'NFT_BADGE':
        return 'text-purple-400';
      case 'USER_BADGE':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const sortedBadges = badgesData?.data?.badges ? [...badgesData.data.badges].sort((a, b) => {
    const aIsUserBadge = a.type === 'USER_BADGE';
    const bIsUserBadge = b.type === 'USER_BADGE';

    // USER_BADGE'leri en üste çıkar
    if (aIsUserBadge && !bIsUserBadge) return -1;
    if (!aIsUserBadge && bIsUserBadge) return 1;

    // İkisi de USER_BADGE ise priority'ye göre sırala
    if (aIsUserBadge && bIsUserBadge) {
      return getUserBadgePriority(a.name) - getUserBadgePriority(b.name);
    }

    // Diğer badge'ler için mevcut sıralamayı koru
    return 0;
  }) : [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card
          title="Your GuudScore History"
          headingClassName="text-base sm:text-lg md:text-xl font-pixel"
        >
          <div className="h-64 sm:h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={scoreHistory}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <defs>
                  <linearGradient
                    id="scoreGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  className="font-pixel text-muted text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  dataKey="score"
                  axisLine={false}
                  tickLine={false}
                  className="font-pixel text-muted text-xs"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass min-w-[248px] rounded-xl p-3">
                          <div className="space-y-2">
                            <div className="text-xl font-bold uppercase">
                              {label
                                ? new Date(label).toLocaleDateString('tr-TR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : 'N/A'}
                            </div>
                            <div className="font-pixel text-xs">
                              <span
                                className="mr-2 inline-block h-3 w-3 rounded-full"
                                style={{ backgroundColor: 'var(--primary)' }}
                              />
                              GuudScore: {payload[0].value}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card title="Badges" headingClassName="text-base sm:text-lg md:text-xl font-pixel">
          <div className="space-y-3 sm:space-y-4">
            {badgesLoading ? (
              <div className="py-8 text-center">
                <p className="text-muted font-pixel text-sm">
                  Loading badges...
                </p>
              </div>
            ) : badgesError ? (
              <div className="py-8 text-center">
                <p className="text-destructive font-pixel text-sm">
                  Failed to load badges
                </p>
              </div>
            ) : sortedBadges.length ? (
              sortedBadges.map(badge => {
                const userBadgeIcon = badge.type === 'USER_BADGE' ? getUserBadgeIcon(badge.name, selectedNetwork as ChainNetwork) : null;
                const badgeImageSrc = userBadgeIcon || badge.imageUrl;
                // Get chain-specific name and description for USER_BADGE tier badges
                const displayName = badge.type === 'USER_BADGE' 
                  ? getChainBadgeName(badge.name, selectedNetwork as ChainNetwork) 
                  : badge.name;
                const displayDescription = badge.type === 'USER_BADGE' 
                  ? getChainBadgeDescription(badge.name, selectedNetwork as ChainNetwork, badge.description) 
                  : badge.description;
                
                return (
                  <div
                    key={badge.id}
                    className="glass rounded-md p-4 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <NftAvatar
                        src={badgeImageSrc}
                        name={displayName}
                        size="md"
                        showBorder={false}
                        className="flex-shrink-0"
                      />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-pixel truncate text-sm font-semibold">
                          {displayName}
                        </h3>
                        {badge.isFeatured && (
                          <Badge variant="legendary">Featured</Badge>
                        )}
                      </div>
                      <p className="text-muted !mt-0 mb-2 text-xs">
                        {displayDescription}
                      </p>
                      <span
                        className={`font-pixel text-xs font-semibold ${getBadgeTypeColor(badge.type)}`}
                      >
                        {badge.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })) : (
              <div className="py-8 text-center">
                <p className="text-muted font-pixel text-sm">No badges found</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
