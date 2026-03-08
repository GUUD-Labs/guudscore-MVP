/**
 * Leaderboard Seasonal Badge
 * 
 * A compact seasonal badge component designed for leaderboard tables.
 * Parses badge name and renders a dynamic seasonal badge image.
 */

import { useMemo } from 'react';

import { SeasonalBadgeImage } from '@/components/seasonal-badge-image';
import {
    isSeasonalBadgeName,
    parseSeasonalBadgeName,
    type ParsedSeasonalBadge,
} from '@/lib/seasonal-badge-utils';
import { cn } from '@/lib/utils';
import type { NetworkType } from '@/types/badge';

export interface LeaderboardSeasonalBadgeProps {
  badgeName: string;
  size?: number;
  className?: string;
  showName?: boolean;
  defaultNetwork?: NetworkType;
}

export const LeaderboardSeasonalBadge = ({
  badgeName,
  size = 32,
  className,
  showName = true,
  defaultNetwork = 'AVAX',
}: LeaderboardSeasonalBadgeProps) => {
  const parsed = useMemo(() => parseSeasonalBadgeName(badgeName, defaultNetwork), [badgeName, defaultNetwork]);

  if (!parsed.isSeasonalBadge) {
    return null;
  }

  const seasonalBadge = parsed as ParsedSeasonalBadge;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SeasonalBadgeImage
        network={seasonalBadge.network}
        quarter={seasonalBadge.quarter}
        tier={seasonalBadge.tier}
        size={size}
        className="shrink-0"
      />
      {showName && (
        <span
          className="text-xs max-w-[120px] truncate"
          title={badgeName}
        >
          {badgeName}
        </span>
      )}
    </div>
  );
};

/**
 * Check if a badge name is seasonal and render appropriate component
 */
export const renderBadgeForLeaderboard = (
  badgeName: string,
  fallbackComponent: React.ReactNode,
  size = 32,
  defaultNetwork: NetworkType = 'AVAX'
) => {
  if (isSeasonalBadgeName(badgeName)) {
    return <LeaderboardSeasonalBadge badgeName={badgeName} size={size} defaultNetwork={defaultNetwork} />;
  }
  return fallbackComponent;
};

export default LeaderboardSeasonalBadge;
