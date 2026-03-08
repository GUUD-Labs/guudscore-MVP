import { useMutation } from '@tanstack/react-query';

import { authService } from '@/services/auth';

/**
 * Hook for initiating Twitter OAuth 2.0 login (RECOMMENDED)
 * Calls backend to start OAuth 2.0 flow and redirects user
 */
export function useTwitterLogin() {
  return useMutation({
    mutationFn: async () => {
      // Get referral code from localStorage if exists
      const referralCode = localStorage.getItem('referralCode');

      // Start OAuth 2.0 flow
      const url = await authService.getTwitterOAuthUrl(
        referralCode || undefined
      );

      console.log('🔵 Twitter OAuth 2.0 - Redirecting to:', url);

      // Redirect to Twitter OAuth
      window.location.href = url;
    },
    onError: (error: Error) => {
      console.error('❌ Failed to initiate Twitter login:', error);
    },
  });
}

/**
 * Hook for completing Twitter OAuth callback
 */
export function useTwitterCallback() {
  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      return await authService.completeTwitterLogin(code, state);
    },
    onError: (error: Error) => {
      console.error('Twitter login callback failed:', error);
    },
  });
}
