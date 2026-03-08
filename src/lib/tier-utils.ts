/**
 * Chain-based tier badge utilities
 * 
 * Tier System:
 * Score       AVAX             BASE              SOLANA            ARBITRUM          MONAD
 * 0-1999      Tourist          Tourist           Tourist           Tourist           Tourist
 * 2000-3999   Paperhands       Paperhands        Paperhands        Paperhands        Paperhands
 * 4000-5999   AVAX Maxi        BASE Maxi         SOL Maxi          Arbitrumer        Monad Maxi
 * 6000-7999   Arena Veteran    Virtuals Virgen   PumpFun Degen     Arbitrum OG       Monad Pioneer
 * 8000-10000  Guudlord         Guudlord          Guudlord          Guudlord          Guudlord
 */

export type ChainNetwork = 'AVAX' | 'BASE' | 'SOLANA' | 'ARBITRUM' | 'MONAD';

export interface TierInfo {
  name: string;
  image: string;
  description: string;
}

// Tier definitions per chain
const TIER_CONFIG: Record<ChainNetwork, Record<string, TierInfo>> = {
  AVAX: {
    tourist: { name: 'Tourist', image: '/badges/noob.png', description: 'Just getting started!' },
    paperhands: { name: 'Paperhands', image: '/badges/paperhand.png', description: 'Still learning the ropes.' },
    maxi: { name: 'AVAX Maxi', image: '/badges/avaxmaxi.png', description: 'True AVAX believer, probably has a red diamond tattoo.' },
    veteran: { name: 'Arena Veteran', image: '/badges/arenaveteran.png', description: 'Battle-tested in the Arena, has the scars to prove it.' },
    guudlord: { name: 'Guudlord', image: '/badges/guudlord.png', description: 'The ultimate GuudScore holder!' },
  },
  BASE: {
    tourist: { name: 'Tourist', image: '/badges/noob.png', description: 'Just getting started!' },
    paperhands: { name: 'Paperhands', image: '/badges/paperhand.png', description: 'Still learning the ropes.' },
    maxi: { name: 'BASE Maxi', image: '/badges/base-maxi.png', description: 'Based legend, shills BASE at every cafe they go to.' },
    veteran: { name: 'Virtuals Virgen', image: '/badges/virtuals-virgen.png', description: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.' },
    guudlord: { name: 'Guudlord', image: '/badges/guudlord.png', description: 'The ultimate GuudScore holder!' },
  },
  SOLANA: {
    tourist: { name: 'Tourist', image: '/badges/noob.png', description: 'Just getting started!' },
    paperhands: { name: 'Paperhands', image: '/badges/paperhand.png', description: 'Still learning the ropes.' },
    maxi: { name: 'SOL Maxi', image: '/badges/sol-maxi.png', description: 'Absolute Degenerate, makes excuses for SBF daily.' },
    veteran: { name: 'PumpFun Degen', image: '/badges/pump-fun-degen.png', description: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.' },
    guudlord: { name: 'Guudlord', image: '/badges/guudlord.png', description: 'The ultimate GuudScore holder!' },
  },
  ARBITRUM: {
    tourist: { name: 'Tourist', image: '/badges/noob.png', description: 'Just getting started!' },
    paperhands: { name: 'Paperhands', image: '/badges/paperhand.png', description: 'Still learning the ropes.' },
    maxi: { name: 'Arbitrumer', image: '/badges/arb-maxi.png', description: "Doesn't even know that other L2s exist." },
    veteran: { name: 'Arbitrum OG', image: '/badges/arbitrum-og.png', description: 'Came for the speed but stayed for the vibes.' },
    guudlord: { name: 'Guudlord', image: '/badges/guudlord.png', description: 'The ultimate GuudScore holder!' },
  },
  MONAD: {
    tourist: { name: 'Tourist', image: '/badges/noob.png', description: 'Just getting started!' },
    paperhands: { name: 'Paperhands', image: '/badges/paperhand.png', description: 'Still learning the ropes.' },
    maxi: { name: 'Monad Maxi', image: '/badges/monad-maxi.png', description: 'Believes Monad will flip everything.' },
    veteran: { name: 'Monad Pioneer', image: '/badges/monad-pioneer.png', description: 'Early adopter of the fastest chain.' },
    guudlord: { name: 'Guudlord', image: '/badges/guudlord.png', description: 'The ultimate GuudScore holder!' },
  },
};

/**
 * Get the tier key based on score
 */
function getTierKey(score: number): string {
  if (score >= 8000) return 'guudlord';
  if (score >= 6000) return 'veteran';
  if (score >= 4000) return 'maxi';
  if (score >= 2000) return 'paperhands';
  return 'tourist';
}

/**
 * Get tier info for a given score and chain
 */
export function getTierInfo(score: number, chain: ChainNetwork): TierInfo {
  const tierKey = getTierKey(score);
  return TIER_CONFIG[chain][tierKey];
}

/**
 * Get tier badge image for a given score and chain
 */
export function getTierBadgeImage(score: number, chain: ChainNetwork): string {
  return getTierInfo(score, chain).image;
}

/**
 * Get tier name for a given score and chain
 */
export function getTierName(score: number, chain: ChainNetwork): string {
  return getTierInfo(score, chain).name;
}

/**
 * Get tier description for a given score and chain
 */
export function getTierDescription(score: number, chain: ChainNetwork): string {
  return getTierInfo(score, chain).description;
}

/**
 * Get badge icon from badge name (for score.tsx badge list)
 * This function maps tier badges to chain-specific icons
 */
export function getUserBadgeIcon(badgeName: string, chain: ChainNetwork = 'AVAX'): string | null {
  const normalizedName = badgeName.toLowerCase().trim();
  
  // Common badges across all chains (same icon regardless of chain)
  const commonBadges: Record<string, string> = {
    'noob': '/badges/noob.png',
    'authenticated noob': '/badges/noob.png',
    'tourist': '/badges/noob.png',
    'paperhand': '/badges/paperhand.png',
    'paperhands': '/badges/paperhand.png',
    'guudlord': '/badges/guudlord.png',
    'guud lord': '/badges/guudlord.png',
    'degenerateautist': '/badges/degenerateautist.png',
    'degenerate autist': '/badges/degenerateautist.png',
    'coqlover': '/badges/coqlover.png',
    'coq lover': '/badges/coqlover.png',
  };

  // Check common badges first
  if (commonBadges[normalizedName]) {
    return commonBadges[normalizedName];
  }

  // All maxi badge names (from any chain)
  const allMaxiNames = [
    'avax maxi', 'avaxmaxi',
    'base maxi', 'basemaxi',
    'sol maxi', 'solmaxi',
    'arbitrumer',
    'monad maxi', 'monadmaxi',
  ];

  // All veteran badge names (from any chain)
  const allVeteranNames = [
    'arena veteran', 'arenaveteran',
    'virtuals virgen', 'virtualsvirgen',
    'pumpfun degen', 'pumpfundegen',
    'arbitrum og', 'arbitrumog',
    'monad pioneer', 'monadpioneer',
  ];

  // Chain-specific icons for maxi tier
  const maxiIcons: Record<ChainNetwork, string> = {
    AVAX: '/badges/avaxmaxi.png',
    BASE: '/badges/base-maxi.png',
    SOLANA: '/badges/sol-maxi.png',
    ARBITRUM: '/badges/arb-maxi.png',
    MONAD: '/badges/monad-maxi.png',
  };

  // Chain-specific icons for veteran tier
  const veteranIcons: Record<ChainNetwork, string> = {
    AVAX: '/badges/arenaveteran.png',
    BASE: '/badges/virtuals-virgen.png',
    SOLANA: '/badges/pump-fun-degen.png',
    ARBITRUM: '/badges/arbitrum-og.png',
    MONAD: '/badges/monad-pioneer.png',
  };

  // If it's any maxi badge, return the chain-specific maxi icon
  if (allMaxiNames.includes(normalizedName)) {
    return maxiIcons[chain];
  }

  // If it's any veteran badge, return the chain-specific veteran icon
  if (allVeteranNames.includes(normalizedName)) {
    return veteranIcons[chain];
  }

  return null;
}

/**
 * Get badge priority for sorting (for score.tsx)
 */
export function getUserBadgePriority(badgeName: string): number {
  const priorityMap: Record<string, number> = {
    // Tier badges (lowest to highest)
    'noob': 1,
    'authenticated noob': 1,
    'tourist': 1,
    'paperhand': 2,
    'paperhands': 2,
    // Maxi tiers (all chains, same priority level)
    'avax maxi': 3,
    'avaxmaxi': 3,
    'base maxi': 3,
    'basemaxi': 3,
    'sol maxi': 3,
    'solmaxi': 3,
    'arb maxi': 3,
    'arbmaxi': 3,
    'monad maxi': 3,
    'monadmaxi': 3,
    // Veteran tiers (all chains, same priority level)
    'arena veteran': 4,
    'arenaveteran': 4,
    'virtuals virgen': 4,
    'virtualsvirgen': 4,
    'pumpfun degen': 4,
    'pumpfundegen': 4,
    'arbitrum og': 4,
    'arbitrumog': 4,
    'monad pioneer': 4,
    'monadpioneer': 4,
    // Top tier
    'guud lord': 5,
    'guudlord': 5,
    // Special badges
    'degenerate autist': 6,
    'degenerateautist': 6,
    'coq lover': 7,
    'coqlover': 7,
  };

  const normalizedName = badgeName.toLowerCase().trim();
  return priorityMap[normalizedName] || 999;
}

/**
 * Get all tier names for a specific chain (useful for filtering/searching)
 */
export function getAllTierNames(chain: ChainNetwork): string[] {
  return Object.values(TIER_CONFIG[chain]).map(tier => tier.name);
}

/**
 * Badge name mapping - converts any tier badge name to chain-specific name
 */
const BADGE_NAME_MAPPING: Record<string, Record<ChainNetwork, string>> = {
  // Maxi tier badges
  'avax maxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'avaxmaxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'base maxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'basemaxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'sol maxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'solmaxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'arb maxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'arbmaxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'monad maxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  'monadmaxi': { AVAX: 'AVAX Maxi', BASE: 'BASE Maxi', SOLANA: 'SOL Maxi', ARBITRUM: 'ARB Maxi', MONAD: 'Monad Maxi' },
  // Veteran tier badges
  'arena veteran': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'arenaveteran': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'virtuals virgen': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'virtualsvirgen': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'pumpfun degen': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'pumpfundegen': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'arbitrum og': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'arbitrumog': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'monad pioneer': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
  'monadpioneer': { AVAX: 'Arena Veteran', BASE: 'Virtuals Virgen', SOLANA: 'PumpFun Degen', ARBITRUM: 'Arbitrum OG', MONAD: 'Monad Pioneer' },
};

/**
 * Badge description mapping - converts any tier badge to chain-specific description
 */
const BADGE_DESCRIPTION_MAPPING: Record<string, Record<ChainNetwork, string>> = {
  // Maxi tier badges
  'avax maxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'avaxmaxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'base maxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'basemaxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'sol maxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'solmaxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'arb maxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'arbmaxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'monad maxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  'monadmaxi': { AVAX: 'True AVAX believer, probably has a red diamond tattoo.', BASE: 'Based legend, shills BASE at every cafe they go to.', SOLANA: 'Absolute Degenerate, makes excuses for SBF daily.', ARBITRUM: 'Layer 2 maximalist, believes Arbitrum will flip Ethereum.', MONAD: 'Believes Monad will flip everything.' },
  // Veteran tier badges
  'arena veteran': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'arenaveteran': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'virtuals virgen': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'virtualsvirgen': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'pumpfun degen': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'pumpfundegen': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'arbitrum og': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'arbitrumog': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'monad pioneer': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
  'monadpioneer': { AVAX: 'Battle-tested in the Arena, has the scars to prove it.', BASE: 'Instead of going outside and talking to girls you chose to find the next big AI gem on Virtuals.', SOLANA: 'You gamble on PumpFun so often that you dream of trading shitters in your sleep.', ARBITRUM: 'Been on Arbitrum since day one, survived the airdrop chaos.', MONAD: 'Early adopter of the fastest chain.' },
};

/**
 * Get chain-specific badge name for display
 * Converts any tier badge name (AVAX Maxi, BASE Maxi, etc.) to the chain-appropriate name
 */
export function getChainBadgeName(badgeName: string, chain: ChainNetwork): string {
  const normalizedName = badgeName.toLowerCase().trim();
  const mapping = BADGE_NAME_MAPPING[normalizedName];
  if (mapping) {
    return mapping[chain];
  }
  return badgeName; // Return original if not a tier badge
}

/**
 * Get chain-specific badge description for display
 * Returns chain-appropriate description for tier badges
 */
export function getChainBadgeDescription(badgeName: string, chain: ChainNetwork, originalDescription?: string): string {
  const normalizedName = badgeName.toLowerCase().trim();
  const mapping = BADGE_DESCRIPTION_MAPPING[normalizedName];
  if (mapping) {
    return mapping[chain];
  }
  return originalDescription || ''; // Return original if not a tier badge
}
