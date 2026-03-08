/**
 * Seasonal Badge Utilities
 * 
 * Utilities for parsing and rendering seasonal tier badges
 * from badge names like "Q1 2026 AVAX Maxi", "Q1 2026 Arena Veteran", or "SEASON Q1 2026 BADGES"
 */

import type { BadgeRarity, NetworkType } from '@/types/badge';

export interface ParsedSeasonalBadge {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  network: NetworkType;
  tier: string;
  rarity: BadgeRarity;
  isSeasonalBadge: true;
}

export interface NonSeasonalBadge {
  isSeasonalBadge: false;
}

export type SeasonalBadgeParseResult = ParsedSeasonalBadge | NonSeasonalBadge;

// Multiple regex patterns to match different seasonal badge formats
// Pattern 1: "Q1 2026 AVAX Maxi" - with network name
const SEASONAL_BADGE_WITH_NETWORK = /^Q([1-4])\s+(\d{4})\s+(AVAX|BASE|SOLANA|SOL|ARBITRUM|ARB|MONAD)\s+(.+)$/i;

// Pattern 2: "Q1 2026 Arena Veteran" - without network name (just Q + year + tier)
const SEASONAL_BADGE_WITHOUT_NETWORK = /^Q([1-4])\s+(\d{4})\s+(.+)$/i;

// Pattern 3: "SEASON Q1 2026 BADGES" or "Season Q1 2026"
const SEASONAL_BADGE_SEASON_PREFIX = /^SEASON\s+Q([1-4])\s+(\d{4})(?:\s+BADGES?)?$/i;

// Map network variations to standard NetworkType
const NETWORK_MAP: Record<string, NetworkType> = {
  'AVAX': 'AVAX',
  'AVALANCHE': 'AVAX',
  'BASE': 'BASE',
  'SOLANA': 'SOLANA',
  'SOL': 'SOLANA',
  'ARBITRUM': 'ARBITRUM',
  'ARB': 'ARBITRUM',
  'MONAD': 'MONAD',
};

// Map tier names to rarity
const TIER_RARITY_MAP: Record<string, BadgeRarity> = {
  'tourist': 'COMMON',
  'paperhands': 'COMMON',
  'maxi': 'RARE',
  'avax maxi': 'RARE',
  'base maxi': 'RARE',
  'sol maxi': 'RARE',
  'solana maxi': 'RARE',
  'arbitrumer': 'RARE',
  'arb maxi': 'RARE',
  'monad maxi': 'RARE',
  'arena veteran': 'EPIC',
  'arena vet': 'EPIC',
  'virtuals virgen': 'EPIC',
  'pumpfun degen': 'EPIC',
  'pump fun degen': 'EPIC',
  'arbitrum og': 'EPIC',
  'monad pioneer': 'EPIC',
  'guudlord': 'LEGENDARY',
  'guud lord': 'LEGENDARY',
};

/**
 * Parse a badge name to extract seasonal badge info
 * Returns parsed info if it's a seasonal badge, or { isSeasonalBadge: false } otherwise
 * 
 * Supported formats:
 * - "Q1 2026 AVAX Maxi" (with network)
 * - "Q1 2026 Arena Veteran" (without network)
 * - "SEASON Q1 2026 BADGES" (season prefix)
 */
export function parseSeasonalBadgeName(badgeName: string, defaultNetwork: NetworkType = 'AVAX'): SeasonalBadgeParseResult {
  if (!badgeName) {
    return { isSeasonalBadge: false };
  }

  let quarter: 1 | 2 | 3 | 4;
  let year: number;
  let network: NetworkType = defaultNetwork;
  let tier: string = '';

  // Try Pattern 1: "Q1 2026 AVAX Maxi" - with network name
  let match = badgeName.match(SEASONAL_BADGE_WITH_NETWORK);
  if (match) {
    const [, quarterStr, yearStr, networkStr, tierStr] = match;
    quarter = parseInt(quarterStr, 10) as 1 | 2 | 3 | 4;
    year = parseInt(yearStr, 10);
    network = NETWORK_MAP[networkStr.toUpperCase()] || defaultNetwork;
    tier = tierStr.trim();
  } else {
    // Try Pattern 3: "SEASON Q1 2026 BADGES"
    match = badgeName.match(SEASONAL_BADGE_SEASON_PREFIX);
    if (match) {
      const [, quarterStr, yearStr] = match;
      quarter = parseInt(quarterStr, 10) as 1 | 2 | 3 | 4;
      year = parseInt(yearStr, 10);
      tier = 'Season Badge';
    } else {
      // Try Pattern 2: "Q1 2026 Arena Veteran" - without network
      match = badgeName.match(SEASONAL_BADGE_WITHOUT_NETWORK);
      if (match) {
        const [, quarterStr, yearStr, tierStr] = match;
        quarter = parseInt(quarterStr, 10) as 1 | 2 | 3 | 4;
        year = parseInt(yearStr, 10);
        tier = tierStr.trim();
        
        // Check if tier contains a network name
        const tierUpper = tier.toUpperCase();
        for (const [netKey, netValue] of Object.entries(NETWORK_MAP)) {
          if (tierUpper.startsWith(netKey + ' ')) {
            network = netValue;
            tier = tier.substring(netKey.length + 1).trim();
            break;
          }
        }
      } else {
        return { isSeasonalBadge: false };
      }
    }
  }
  
  // Determine rarity from tier
  const tierLower = tier.toLowerCase();
  let rarity: BadgeRarity = 'COMMON';
  
  for (const [key, value] of Object.entries(TIER_RARITY_MAP)) {
    if (tierLower.includes(key) || key.includes(tierLower)) {
      rarity = value;
      break;
    }
  }
  
  // Check for specific patterns
  if (tierLower.includes('guud')) rarity = 'LEGENDARY';
  else if (tierLower.includes('veteran') || tierLower.includes('virgen') || tierLower.includes('degen') || tierLower.includes('og') || tierLower.includes('pioneer')) rarity = 'EPIC';
  else if (tierLower.includes('maxi') || tierLower.includes('arbitrumer')) rarity = 'RARE';

  return {
    quarter,
    year,
    network,
    tier,
    rarity,
    isSeasonalBadge: true,
  };
}

/**
 * Check if a badge name is a seasonal badge
 */
export function isSeasonalBadgeName(badgeName: string): boolean {
  return parseSeasonalBadgeName(badgeName).isSeasonalBadge;
}

/**
 * Get display info for a seasonal badge
 */
export function getSeasonalBadgeDisplayInfo(parsed: ParsedSeasonalBadge) {
  return {
    seasonName: `Q${parsed.quarter} ${parsed.year} ${parsed.network}`,
    fullName: `Q${parsed.quarter} ${parsed.year} ${parsed.network} ${parsed.tier}`,
    shortName: `Q${parsed.quarter} ${parsed.tier}`,
  };
}
