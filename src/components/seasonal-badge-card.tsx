import { ExternalLink, Trophy } from 'lucide-react';

import { SeasonalBadgeImage } from '@/components/seasonal-badge-image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BadgeRarity, NetworkType, SeasonBadge } from '@/types/badge';

// ==========================================
// Rarity Colors
// ==========================================

const RARITY_STYLES: Record<BadgeRarity, {
  badgeClass: string;
  glowClass: string;
  label: string;
}> = {
  COMMON: {
    badgeClass: 'bg-gray-600/20 text-gray-300 border-gray-500',
    glowClass: '',
    label: 'Common',
  },
  RARE: {
    badgeClass: 'bg-blue-600/20 text-blue-300 border-blue-500',
    glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    label: 'Rare',
  },
  EPIC: {
    badgeClass: 'bg-purple-600/20 text-purple-300 border-purple-500',
    glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    label: 'Epic',
  },
  LEGENDARY: {
    badgeClass: 'bg-amber-600/20 text-amber-300 border-amber-500',
    glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.5)]',
    label: 'Legendary',
  },
};

const NETWORK_COLORS: Record<NetworkType, string> = {
  AVAX: 'text-red-400',
  BASE: 'text-blue-400',
  SOLANA: 'text-purple-400',
  ARBITRUM: 'text-sky-400',
  MONAD: 'text-violet-400',
};

// ==========================================
// Props Interface
// ==========================================

export interface SeasonalBadgeCardProps {
  badge: SeasonBadge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
  onClick?: () => void;
}

// ==========================================
// Component
// ==========================================

export const SeasonalBadgeCard = ({
  badge,
  size = 'md',
  showDetails = true,
  className,
  onClick,
}: SeasonalBadgeCardProps) => {
  const rarityStyle = RARITY_STYLES[badge.rarity];
  const networkColor = NETWORK_COLORS[badge.network];

  const badgeSizes = {
    sm: 100,
    md: 150,
    lg: 200,
  };

  const imageSize = badgeSizes[size];

  return (
    <Card
      className={cn(
        'glass border-glass-border overflow-hidden transition-all duration-300 hover:scale-[1.02]',
        rarityStyle.glowClass,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn('p-4', size === 'sm' && 'p-2')}>
        <div className="flex flex-col items-center gap-3">
          {/* Badge Image */}
          <div className="relative">
            <SeasonalBadgeImage
              network={badge.network}
              quarter={badge.quarter}
              tier={badge.tier}
              size={imageSize}
            />
            
            {/* NFT indicator */}
            {badge.nftTokenId && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-1">
                <Trophy className="size-3 text-white" />
              </div>
            )}
          </div>

          {showDetails && (
            <div className="w-full space-y-2 text-center">
              {/* Season Name */}
              <h3 className="font-pixel text-sm text-white truncate">
                {badge.seasonName}
              </h3>

              {/* Tier */}
              <p className={cn('text-xs font-medium', networkColor)}>
                {badge.tier}
              </p>

              {/* Rarity Badge */}
              <Badge
                variant="outline"
                className={cn('text-[10px]', rarityStyle.badgeClass)}
              >
                {rarityStyle.label}
              </Badge>

              {/* Score & Rank */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>Score: <span className="text-white font-medium">{badge.score.toLocaleString()}</span></span>
                <span>Rank: <span className="text-white font-medium">#{badge.rank}</span></span>
              </div>

              {/* NFT Link */}
              {badge.nftTokenId && badge.nftContractAddress && (
                <a
                  href={`https://snowtrace.io/nft/${badge.nftContractAddress}/${badge.nftTokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View NFT <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// Skeleton Loader
// ==========================================

export const SeasonalBadgeCardSkeleton = ({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) => {
  const badgeSizes = {
    sm: 100,
    md: 150,
    lg: 200,
  };

  return (
    <Card className="glass border-glass-border overflow-hidden">
      <CardContent className={cn('p-4', size === 'sm' && 'p-2')}>
        <div className="flex flex-col items-center gap-3">
          <Skeleton
            className="rounded-xl"
            style={{ width: badgeSizes[size], height: badgeSizes[size] }}
          />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// Mini Badge (for profile display)
// ==========================================

export interface SeasonalBadgeMiniProps {
  badge: SeasonBadge;
  size?: number;
  showTooltip?: boolean;
  className?: string;
}

export const SeasonalBadgeMini = ({
  badge,
  size = 48,
  className,
}: SeasonalBadgeMiniProps) => {
  const rarityStyle = RARITY_STYLES[badge.rarity];

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden transition-transform hover:scale-110',
        rarityStyle.glowClass,
        className
      )}
      title={`${badge.seasonName} - ${badge.tier} (${badge.rarity})`}
    >
      <SeasonalBadgeImage
        network={badge.network}
        quarter={badge.quarter}
        tier={badge.tier}
        size={size}
      />
    </div>
  );
};

export default SeasonalBadgeCard;
