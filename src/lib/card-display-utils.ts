import type { CardTemplate } from '@/components/social-media-card';
import type { ExtendedUser } from '@/types';

/**
 * Theme metadata for title/description overrides
 */
const THEME_METADATA = {
  guud: {
    title: 'GUUD Score Holder',
    description: 'Official member of the GUUD community',
  },
  avax: {
    title: 'Avalanche Power User',
    description: 'Active participant in the Avalanche ecosystem',
  },
  desci: {
    title: 'DeSci Pioneer',
    description: 'Advancing decentralized science research',
  },
  'no-chillio': {
    title: 'Nochillio Holder',
    description: 'Premium NFT collection owner',
  },
  gta: {
    title: 'GTA Collector',
    description: 'Grand Theft Ape collection holder',
  },
  coq: {
    title: 'COQ Holder',
    description: '$COQ token ecosystem participant',
  },
};

/**
 * Badge priority order for regular design
 */
const BADGE_PRIORITY = [
  {
    template: 'guud' as CardTemplate,
    keywords: ['guud', 'guud badge', 'guud score'],
  },
  { template: 'avax' as CardTemplate, keywords: ['avax', 'avalanche'] },
  {
    template: 'desci' as CardTemplate,
    keywords: ['desci', 'de sci', 'decentralized science'],
  },
  {
    template: 'no-chillio' as CardTemplate,
    keywords: ['nochillio', 'no chillio', 'chillio', 'no-chillio'],
  },
  { template: 'coq' as CardTemplate, keywords: ['coq', '$coq'] },
];

/**
 * Extract keywords from badge data for matching
 */
const extractBadgeKeywords = (badgeData: unknown): Set<string> => {
  const keywords = new Set<string>();

  const addString = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      keywords.add(value.toLowerCase().trim());
    }
  };

  const traverse = (obj: unknown) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      addString(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(traverse);
    }
  };

  traverse(badgeData);
  return keywords;
};

/**
 * Get badge information for card display
 */
const getBadgeInfo = (
  user: ExtendedUser | undefined,
  selectedTemplate: CardTemplate,
  hasEmptyWallets: boolean
) => {
  // Case 1: User has no wallets (authenticated but no onchain activity)
  if (hasEmptyWallets) {
    return {
      title: 'Authenticated Noob',
      description: 'User verified, awaiting first badge',
      usesThemeOverride: false,
    };
  }

  // Case 2: User has wallets but no badges
  const hasBadges =
    user?.badges?.userBadges?.length ||
    user?.badges?.poapBadges?.length ||
    user?.badges?.nftBadges?.length;

  if (!hasBadges || hasBadges === 0) {
    return {
      title: 'Authenticated Noob',
      description: 'User verified, awaiting first badge',
      usesThemeOverride: false,
    };
  }

  // Case 3: Regular design (guud template) - use highest priority badge
  if (selectedTemplate === 'guud') {
    const badgeKeywords = new Set<string>();

    // Extract keywords from all badge types
    ['userBadges', 'poapBadges', 'nftBadges'].forEach(badgeType => {
      const badges = user?.badges?.[badgeType as keyof typeof user.badges];
      if (badges && Array.isArray(badges)) {
        const keywords = extractBadgeKeywords(badges);
        keywords.forEach(keyword => badgeKeywords.add(keyword));
      }
    });

    // Find highest priority badge
    for (const { template, keywords } of BADGE_PRIORITY) {
      const hasMatchingKeyword = Array.from(badgeKeywords).some(badgeKeyword =>
        keywords.some(
          keyword =>
            keyword.includes(badgeKeyword) || badgeKeyword.includes(keyword)
        )
      );

      if (hasMatchingKeyword) {
        const themeData = THEME_METADATA[template];
        return {
          title: themeData.title,
          description: themeData.description,
          usesThemeOverride: false,
        };
      }
    }

    // Fallback if no matching badges found
    return {
      title: 'Badge Holder',
      description: 'Active community member with earned badges',
      usesThemeOverride: false,
    };
  }

  // Case 4: Themed design - use theme-specific override
  const themeData = THEME_METADATA[selectedTemplate];
  if (themeData) {
    return {
      title: themeData.title,
      description: themeData.description,
      usesThemeOverride: true,
    };
  }

  // Fallback
  return {
    title: 'Badge Holder',
    description: 'Active community member with earned badges',
    usesThemeOverride: false,
  };
};

/**
 * Get card display props for theme components
 */
type CardDisplayOverrides = {
  score?: number;
  title?: string;
  description?: string;
};

export const getCardDisplayProps = (
  user: ExtendedUser | undefined,
  selectedTemplate: CardTemplate,
  score: number,
  cardPhotoUrl?: string,
  hasEmptyWallets: boolean = false,
  providedName?: string,
  overrides?: CardDisplayOverrides,
  width?: number,
  height?: number
) => {
  // Use provided name if available (for backward compatibility), otherwise use actual name, then slug as fallback
  let displayUsername: string;
  if (user?.twitterName) {
    displayUsername = user.twitterName;
  } else if (providedName) {
    displayUsername = providedName;
  } else if (user?.slug) {
    displayUsername = user.slug;
  } else if (user?.name) {
    displayUsername = user.name;
  } else if (user?.username) {
    displayUsername = user.username;
  } else {
    displayUsername = 'Anonymous';
  }

  // Format score properly
  const rawScore = overrides?.score ?? score;
  const formattedScore = Number.isFinite(rawScore)
    ? Math.max(0, Math.round(rawScore)).toString()
    : '0';

  // Get badge information
  const badgeInfo = getBadgeInfo(user, selectedTemplate, hasEmptyWallets);

  return {
    username: displayUsername,
    imageUrl: cardPhotoUrl || '/placeholder.svg',
    score: formattedScore,
    subtitleHeader: overrides?.title ?? badgeInfo.title,
    description: overrides?.description ?? badgeInfo.description,
    hasEmptyWallets,
    width,
    height,
  };
};

/**
 * Get card display props for theme components (simplified version for share dialog)
 */
export const getCardDisplayPropsSimple = (
  selectedTemplate: CardTemplate,
  name: string,
  score: number,
  cardPhotoUrl?: string,
  hasEmptyWallets: boolean = false,
  rankTitle?: string,
  rankDescription?: string
) => {
  // For the share dialog, we don't have access to full user data, so use provided props
  const displayUsername = name || 'Anonymous';

  // Format score properly
  const formattedScore = Number.isFinite(score)
    ? Math.max(0, Math.round(score)).toString()
    : '0';

  // Use provided rank info or fallback based on wallet status
  let title: string;
  let description: string;

  if (hasEmptyWallets) {
    title = 'Authenticated Noob';
    description = 'User verified, awaiting first badge';
  } else if (rankTitle) {
    title = rankTitle;
    description = rankDescription || 'Active community member';
  } else {
    // For themed designs, use theme metadata
    const themeData = THEME_METADATA[selectedTemplate];
    if (themeData && selectedTemplate !== 'guud') {
      title = themeData.title;
      description = themeData.description;
    } else {
      title = 'Badge Holder';
      description = 'Active community member with earned badges';
    }
  }

  return {
    username: displayUsername,
    imageUrl: cardPhotoUrl || '/placeholder.svg',
    score: formattedScore,
    subtitleHeader: title,
    description,
    hasEmptyWallets,
  };
};
