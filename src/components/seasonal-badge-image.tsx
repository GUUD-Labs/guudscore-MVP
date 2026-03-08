/**
 * Seasonal Badge Image Component
 * 
 * Uses pre-generated static badge images instead of canvas rendering.
 * Images are located in /public/badges/seasonal/
 * 
 * Naming convention: {chain}_{quarter}_{tier}.png
 * Example: avax_q1_arena-veteran.png
 */

import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { BadgeRarity, NetworkType } from '@/types/badge';

// ==========================================
// Chain-specific tier names mapping
// ==========================================

const CHAIN_TIER_NAMES: Record<string, Record<string, string>> = {
  AVAX: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'paper hands': 'paperhands',
    'maxi': 'avax-maxi',
    'avax maxi': 'avax-maxi',
    'avax-maxi': 'avax-maxi',
    'veteran': 'arena-veteran',
    'arena veteran': 'arena-veteran',
    'arena-veteran': 'arena-veteran',
    'arena vet': 'arena-veteran',
    'guudlord': 'guudlord',
    'guud lord': 'guudlord',
  },
  BASE: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'paper hands': 'paperhands',
    'maxi': 'base-maxi',
    'base maxi': 'base-maxi',
    'base-maxi': 'base-maxi',
    'veteran': 'virtuals-virgen',
    'virtuals virgen': 'virtuals-virgen',
    'virtuals-virgen': 'virtuals-virgen',
    'guudlord': 'guudlord',
    'guud lord': 'guudlord',
  },
  SOLANA: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'paper hands': 'paperhands',
    'maxi': 'sol-maxi',
    'sol maxi': 'sol-maxi',
    'sol-maxi': 'sol-maxi',
    'veteran': 'pumpfun-degen',
    'pumpfun degen': 'pumpfun-degen',
    'pumpfun-degen': 'pumpfun-degen',
    'pump fun degen': 'pumpfun-degen',
    'guudlord': 'guudlord',
    'guud lord': 'guudlord',
  },
  ARBITRUM: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'paper hands': 'paperhands',
    'maxi': 'arbitrumer',
    'arbitrumer': 'arbitrumer',
    'arb maxi': 'arbitrumer',
    'veteran': 'arbitrum-og',
    'arbitrum og': 'arbitrum-og',
    'arbitrum-og': 'arbitrum-og',
    'guudlord': 'guudlord',
    'guud lord': 'guudlord',
  },
  MONAD: {
    'tourist': 'tourist',
    'paperhands': 'paperhands',
    'paper hands': 'paperhands',
    'maxi': 'monad-maxi',
    'monad maxi': 'monad-maxi',
    'monad-maxi': 'monad-maxi',
    'veteran': 'monad-pioneer',
    'monad pioneer': 'monad-pioneer',
    'monad-pioneer': 'monad-pioneer',
    'guudlord': 'guudlord',
    'guud lord': 'guudlord',
  },
};

// Score to base tier mapping
const SCORE_TO_TIER: Array<{ min: number; max: number; tier: string }> = [
  { min: 0, max: 1999, tier: 'tourist' },
  { min: 2000, max: 3999, tier: 'paperhands' },
  { min: 4000, max: 5999, tier: 'maxi' },
  { min: 6000, max: 7999, tier: 'veteran' },
  { min: 8000, max: 10000, tier: 'guudlord' },
];

// ==========================================
// Props Interface
// ==========================================

export interface SeasonalBadgeImageProps {
  network: NetworkType;
  quarter: 1 | 2 | 3 | 4;
  year?: number; // Not used for image path but kept for compatibility
  tier?: string;
  score?: number; // Alternative to tier - determine tier from score
  rarity?: BadgeRarity; // Not used for image but kept for compatibility
  size?: number;
  onImageGenerated?: (dataUrl: string) => void;
  className?: string;
}

/**
 * Get tier name from score
 */
function getTierFromScore(score: number): string {
  for (const range of SCORE_TO_TIER) {
    if (score >= range.min && score <= range.max) {
      return range.tier;
    }
  }
  return 'tourist';
}

/**
 * Get the file name for a badge
 */
function getBadgeFileName(network: NetworkType, quarter: number, tier: string): string {
  const chainLower = network.toLowerCase();
  const tierLower = tier.toLowerCase().trim();
  
  // Get chain-specific tier name
  const chainTiers = CHAIN_TIER_NAMES[network];
  let tierFileName = chainTiers?.[tierLower];
  
  // If not found, try to normalize the tier name
  if (!tierFileName) {
    // Remove extra spaces and convert to kebab-case
    tierFileName = tierLower.replace(/\s+/g, '-');
    
    // Try common patterns
    if (tierLower.includes('veteran') || tierLower.includes('arena')) {
      tierFileName = chainTiers?.['veteran'] || 'arena-veteran';
    } else if (tierLower.includes('maxi')) {
      tierFileName = chainTiers?.['maxi'] || `${chainLower}-maxi`;
    } else if (tierLower.includes('guud') || tierLower.includes('lord')) {
      tierFileName = 'guudlord';
    } else if (tierLower.includes('paper')) {
      tierFileName = 'paperhands';
    } else if (tierLower.includes('tourist')) {
      tierFileName = 'tourist';
    } else if (tierLower.includes('season') || tierLower.includes('badge')) {
      // "Season Badge" is a generic badge - use the chain's maxi tier as fallback
      tierFileName = chainTiers?.['maxi'] || `${chainLower}-maxi`;
    }
  }
  
  return `${chainLower}_q${quarter}_${tierFileName}.png`;
}

// ==========================================
// Component
// ==========================================

export const SeasonalBadgeImage = ({
  network,
  quarter,
  tier,
  score,
  size = 64,
  onImageGenerated,
  className,
}: SeasonalBadgeImageProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine tier from score if not provided
  const effectiveTier = tier || (score !== undefined ? getTierFromScore(score) : 'tourist');
  
  // Get badge file name
  const fileName = getBadgeFileName(network, quarter, effectiveTier);
  const imagePath = `/badges/seasonal/${fileName}`;

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    setHasError(false);
    
    // Call onImageGenerated with the image src if provided
    if (onImageGenerated) {
      onImageGenerated(e.currentTarget.src);
    }
  };

  const handleError = () => {
    console.warn(`Failed to load badge image: ${imagePath} (network: ${network}, quarter: ${quarter}, tier: ${effectiveTier})`);
    setHasError(true);
    setIsLoaded(false);
  };

  if (hasError) {
    // Fallback to placeholder
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted/30 rounded-lg',
          className
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground text-xs">Badge</span>
      </div>
    );
  }

  return (
    <div 
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-muted/30 rounded-lg animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
      <img
        src={imagePath}
        alt={`${network} Q${quarter} ${effectiveTier} Badge`}
        width={size}
        height={size}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'rounded-lg object-contain transition-opacity',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100'
        )}
        style={{ width: size, height: size }}
      />
    </div>
  );
};

// Keep old name as alias for backward compatibility
export const SeasonalBadgeGenerator = SeasonalBadgeImage;

export default SeasonalBadgeImage;
