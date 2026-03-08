import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { authService } from '@/services/auth';
import { twitterService } from '@/services/twitter';

interface ShareToXParams {
  text: string;
  imageUrl: string;
}

interface PendingShare {
  text: string;
  imageUrl: string;
  timestamp: number;
}

const PENDING_SHARE_KEY = 'pendingTwitterShare';
const PENDING_SHARE_TIMEOUT = 1000 * 60 * 10; // 10 minutes

/**
 * Hook for sharing to X (Twitter) with hybrid OAuth flow
 * 
 * This hook implements the hybrid OAuth system:
 * 1. Try to share with existing OAuth 1.0a tokens
 * 2. If authRequired, redirect user to OAuth 1.0a authorization
 * 3. After callback, automatically retry the share
 * 
 * Usage:
 * ```tsx
 * const { shareToX, isSharing } = useShareToX({
 *   onSuccess: (data) => {
 *     if (data.shareUrl) {
 *       window.open(data.shareUrl, '_blank');
 *     }
 *   },
 *   onAuthRequired: (authUrl) => {
 *     // Optional: custom handling before redirect
 *     window.location.href = authUrl;
 *   }
 * });
 * 
 * // To share
 * shareToX({
 *   text: 'Check out my Guud Card!',
 *   imageUrl: 'https://...'
 * });
 * ```
 */
export function useShareToX(options?: {
  onSuccess?: (data: { shareUrl?: string; tweetId?: string }) => void;
  onError?: (error: Error) => void;
  onAuthRequired?: (authUrl: string) => void;
  returnTo?: string; // URL to return to after OAuth callback (default: current path)
}) {
  const hasHandledCallbackRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async ({ text, imageUrl }: ShareToXParams) => {
      console.log('[ShareToX] Attempting to share with hybrid OAuth...');

      try {
        const response = await twitterService.shareToXHybrid(text, imageUrl);

        console.log('[ShareToX] Backend response:', {
          success: response.success,
          data: response.data,
          authRequired: response.data?.authRequired,
        });

        // Check if OAuth 1.0a authorization is required
        if (response.data?.authRequired) {
          console.log('[ShareToX] OAuth 1.0a authorization required');

          // Store pending share for retry after callback
          const pendingShare: PendingShare = {
            text,
            imageUrl,
            timestamp: Date.now(),
          };
          localStorage.setItem(PENDING_SHARE_KEY, JSON.stringify(pendingShare));
          console.log('[ShareToX] Pending share saved to localStorage');

          // Get the auth URL (either from response or generate it)
          let authUrl = response.data.authUrl;
          console.log('[ShareToX] Auth URL from backend:', authUrl);

          if (!authUrl) {
            console.log('[ShareToX] No authUrl from backend, generating...');
            // If backend didn't provide authUrl, generate it
            const returnTo = options?.returnTo || window.location.pathname;
            authUrl = await authService.getTwitterOAuth1ShareAuthUrl(returnTo);
            console.log('[ShareToX] Generated auth URL:', authUrl);
          }

          // Call the optional onAuthRequired callback
          if (options?.onAuthRequired) {
            console.log('[ShareToX] Calling onAuthRequired callback');
            options.onAuthRequired(authUrl);
            return { authRequired: true, authUrl };
          }

          // Redirect to OAuth 1.0a authorization
          console.log('[ShareToX] Redirecting to OAuth 1.0a authorization:', authUrl);
          window.location.href = authUrl;

          return { authRequired: true, authUrl };
        }

        // Success! Share was posted
        if (response.data?.success && response.data.shareUrl) {
          console.log('[ShareToX] Successfully shared to X:', response.data.shareUrl);

          // Clear any pending share
          localStorage.removeItem(PENDING_SHARE_KEY);

          return {
            success: true,
            shareUrl: response.data.shareUrl,
            tweetId: response.data.tweetId,
          };
        }

        throw new Error(response.message || 'Failed to share to X');
      } catch (error) {
        console.error('[ShareToX] Error:', error);
        
        // Check if error is related to invalid/expired OAuth token
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTokenError = 
          errorMessage.includes('401') || 
          errorMessage.includes('Invalid or expired token') ||
          errorMessage.includes('Twitter code 89');
        
        if (isTokenError) {
          console.log('[ShareToX] OAuth1 token expired, triggering re-authorization...');
          
          // Store pending share
          const pendingShare: PendingShare = {
            text,
            imageUrl,
            timestamp: Date.now(),
          };
          localStorage.setItem(PENDING_SHARE_KEY, JSON.stringify(pendingShare));
          
          // Trigger onAuthRequired callback to re-authorize
          if (options?.onAuthRequired) {
            const returnTo = options?.returnTo || window.location.pathname;
            // Generate a dummy authUrl, callback will handle the actual generation
            options.onAuthRequired(`/auth/twitter-oauth1/authorize-share?returnTo=${returnTo}`);
          }
          
          return { authRequired: true, authUrl: '' };
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success && options?.onSuccess) {
        options.onSuccess({
          shareUrl: data.shareUrl,
          tweetId: data.tweetId,
        });
      }
    },
    onError: (error: Error) => {
      console.error('[ShareToX] Mutation error:', error);
      if (options?.onError) {
        options.onError(error);
      }
    },
  });

  /**
   * Check for OAuth callback and automatically retry pending share
   */
  useEffect(() => {
    // Only run once
    if (hasHandledCallbackRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const twitterAuth = params.get('twitterAuth');

    if (twitterAuth === 'success') {
      hasHandledCallbackRef.current = true;

      console.log('[ShareToX] OAuth callback detected, checking for pending share...');

      // Get pending share from localStorage
      const pendingShareStr = localStorage.getItem(PENDING_SHARE_KEY);

      if (pendingShareStr) {
        try {
          const pendingShare: PendingShare = JSON.parse(pendingShareStr);

          // Check if pending share is not expired
          const age = Date.now() - pendingShare.timestamp;
          if (age > PENDING_SHARE_TIMEOUT) {
            console.log('[ShareToX] Pending share expired, ignoring');
            localStorage.removeItem(PENDING_SHARE_KEY);
            return;
          }

          console.log('[ShareToX] Retrying pending share...');

          // Retry share automatically
          mutation.mutate({
            text: pendingShare.text,
            imageUrl: pendingShare.imageUrl,
          });

          // Clean up URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('twitterAuth');
          window.history.replaceState({}, '', newUrl.toString());
        } catch (error) {
          console.error('[ShareToX] Error parsing pending share:', error);
          localStorage.removeItem(PENDING_SHARE_KEY);
        }
      }
    }
  }, [mutation]);

  return {
    shareToX: mutation.mutate,
    shareToXAsync: mutation.mutateAsync,
    isSharing: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

/**
 * Utility function to check if there's a pending share
 */
export function hasPendingShare(): boolean {
  const pendingShareStr = localStorage.getItem(PENDING_SHARE_KEY);
  if (!pendingShareStr) return false;

  try {
    const pendingShare: PendingShare = JSON.parse(pendingShareStr);
    const age = Date.now() - pendingShare.timestamp;
    return age <= PENDING_SHARE_TIMEOUT;
  } catch {
    return false;
  }
}

/**
 * Utility function to clear pending share
 */
export function clearPendingShare(): void {
  localStorage.removeItem(PENDING_SHARE_KEY);
}
