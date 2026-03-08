import { useQuery } from '@tanstack/react-query';

import type { ReferralStats } from '@/types';

import { userService } from '@/services/user';

// Query keys
export const REFERRAL_QUERY_KEYS = {
  all: ['referral'] as const,
  stats: () => [...REFERRAL_QUERY_KEYS.all, 'stats'] as const,
} as const;

/**
 * Hook to generate referral link for current user
 * @param slug - User's slug (referral code)
 * @returns Full referral URL or null if slug not provided
 */
export const useReferralLink = (slug?: string): string | null => {
  if (!slug) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/ref?ref=${encodeURIComponent(slug)}`;
};

/**
 * Hook to fetch referral statistics
 * @returns Query result with referral stats
 */
export const useReferralStats = () => {
  return useQuery<ReferralStats>({
    queryKey: REFERRAL_QUERY_KEYS.stats(),
    queryFn: () => userService.getReferralStats(),
  });
};
