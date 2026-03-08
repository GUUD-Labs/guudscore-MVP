import { useMutation } from '@tanstack/react-query';

import { shareService } from '@/services/share';
import type { ShareCardRequest } from '@/services/share';

/**
 * Hook for generating card share URLs with proper Twitter Card meta tags
 */
export const useShareCard = () => {
  return useMutation({
    mutationFn: ({ userId, imageUrl, text, slug }: ShareCardRequest) =>
      shareService.generateCardShareUrl(userId, imageUrl, text, slug),
    onError: (error) => {
      console.error('Failed to generate share URL:', error);
    },
  });
};

/**
 * Hook for building share URLs client-side (immediate response)
 */
export const useBuildShareUrl = () => {
  return {
    buildShareUrl: (
      baseUrl: string,
      userId: string,
      imageUrl: string,
      text: string,
      slug: string
    ): string => {
      return shareService.buildShareUrl(baseUrl, userId, imageUrl, text, slug);
    },
  };
};

/**
 * Hook for validating share URL parameters
 */
export const useValidateShareParams = () => {
  return {
    isValid: (params: {
      userId?: string;
      imageUrl?: string;
      text?: string;
      slug?: string;
    }): boolean => {
      return !!(
        params.userId &&
        params.imageUrl &&
        params.text &&
        params.slug &&
        params.imageUrl.startsWith('http')
      );
    },
  };
};