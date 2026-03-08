import { tokenStorage } from '@/hooks/use-auth';
import { authService } from '@/services/auth';
import { twitterService } from '@/services/twitter';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

// Define search params schema
type TwitterCallbackSearch = {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  state?: string;
  oauth_token?: string;
  oauth_verifier?: string;
  denied?: string;
  sharing?: string;
};

export const Route = createFileRoute('/auth/callback/twitter')({
  component: TwitterCallback,
  validateSearch: (search: Record<string, unknown>): TwitterCallbackSearch => {
    return {
      accessToken: search.accessToken as string,
      refreshToken: search.refreshToken as string,
      code: search.code as string,
      state: search.state as string,
      oauth_token: search.oauth_token as string,
      oauth_verifier: search.oauth_verifier as string,
      denied: search.denied as string,
      sharing: search.sharing as string,
    };
  },
});

function TwitterCallback() {
  const { accessToken, refreshToken, code, state, oauth_token, oauth_verifier, denied, sharing } = Route.useSearch();
  const [isExchangingCode, setIsExchangingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple executions (React strict mode or re-renders)
    if (hasProcessed) {
      console.log('[⚠️ Twitter Callback] Already processed, skipping...');
      return;
    }

    const handleCallback = async () => {
      setHasProcessed(true);

      // Check if already authenticated (prevent loops)
      const existingToken = tokenStorage.getAccessToken();
      if (existingToken && !accessToken && !code) {
        window.location.href = '/dashboard';
        return;
      }

      const debugInfo = {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasCode: !!code,
        hasState: !!state,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length,
        fullURL: window.location.href,
        searchParams: new URLSearchParams(window.location.search).toString(),
        timestamp: new Date().toISOString(),
      };

      console.log('[🔵 Twitter Callback] Received URL parameters:', debugInfo);

      // FLOW 1: Backend returned accessToken directly (existing users or updated backend)
      if (accessToken) {
        console.log('[✅ Twitter Callback] Found accessToken, setting tokens...');

        try {
          // Backend stores refreshToken in httpOnly cookie (30 days)
          // Access token is also valid for 30 days (2,592,000 seconds)
          // tokenStorage.setTokens will automatically calculate expiry
          tokenStorage.setTokens({
            accessToken,
            refreshToken: '', // Not needed - stored in httpOnly cookie by backend
            expiresIn: 2592000, // 30 days in seconds (backend token duration)
          });

          const storedAccessToken = tokenStorage.getAccessToken();

          if (storedAccessToken) {
            // Clean up referral code from localStorage after successful auth
            const referralCode = localStorage.getItem('referralCode');
            if (referralCode) {
              localStorage.removeItem('referralCode');
            }

            // Set flag to prevent aggressive token validation during initial redirect
            sessionStorage.setItem('oauth_login_in_progress', 'true');

            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 500);
          } else {
            setError('Failed to save authentication tokens');
          }
        } catch (error) {
          console.error('[❌ Twitter Callback] Error setting tokens:', error);
          setError('Authentication error occurred');
        }
      }
      // FLOW 2: Backend returned code/state (new users - needs token exchange)
      else if (code && state) {
        console.log('[🔵 Twitter Callback] Received OAuth code, exchanging for tokens...');
        setIsExchangingCode(true);

        try {
          // Exchange code for tokens using the backend callback endpoint
          const authResponse = await authService.completeTwitterLogin(code, state);

          console.log('[✅ Twitter Callback] Successfully exchanged code for tokens');

          // Store tokens
          tokenStorage.setTokens(authResponse.tokens);

          // Clean up referral code
          const referralCode = localStorage.getItem('referralCode');
          if (referralCode) {
            localStorage.removeItem('referralCode');
            console.log('[✅ Twitter Callback] Cleaned up referral code:', referralCode);
          }

          // Set flag to prevent aggressive token validation during initial redirect
          sessionStorage.setItem('oauth_login_in_progress', 'true');

          console.log('[✅ Twitter Callback] Authentication complete, redirecting to dashboard...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        } catch (error) {
          console.error('[❌ Twitter Callback] Failed to exchange code for tokens:', error);
          setError(error instanceof Error ? error.message : 'Failed to complete authentication');
          setIsExchangingCode(false);
        }
      }
      // FLOW 4: Handle sharing OAuth callback
      else if (sharing === 'true' && oauth_token && oauth_verifier) {
        console.log('[🔵 Twitter Callback] Processing sharing OAuth callback...');
        setIsExchangingCode(true);

        try {
          const oauthDataStr = sessionStorage.getItem('twitter_oauth_data');
          if (!oauthDataStr) {
            throw new Error('No OAuth data found in session storage');
          }

          const oauthData = JSON.parse(oauthDataStr);

          // Complete OAuth flow and share to X
          const shareResponse = await twitterService.shareToXOAuth(
            oauthData.text,
            oauthData.imageUrl,
            oauth_token,
            oauth_verifier
          );

          console.log('[✅ Twitter Callback] Successfully shared to X:', shareResponse);

          // Store success result for parent window
          sessionStorage.setItem('twitter_oauth_result', JSON.stringify({
            success: true,
            tweetUrl: shareResponse.data?.tweetUrl,
            tweetId: shareResponse.data?.tweetId,
          }));

          // Clean up
          sessionStorage.removeItem('twitter_oauth_data');

          // Close this window (it was opened as a popup)
          setTimeout(() => {
            window.close();
          }, 1000);

        } catch (error) {
          console.error('[❌ Twitter Callback] Failed to share to X:', error);

          // Store error result for parent window
          sessionStorage.setItem('twitter_oauth_result', JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to share to X',
          }));

          // Clean up
          sessionStorage.removeItem('twitter_oauth_data');

          // Close this window
          setTimeout(() => {
            window.close();
          }, 1000);
        } finally {
          setIsExchangingCode(false);
        }
      }
      // FLOW 5: Handle OAuth denial
      else if (denied || (sharing === 'true' && !oauth_token)) {
        console.log('[❌ Twitter Callback] OAuth was denied by user');

        if (sharing === 'true') {
          // Store cancellation result for parent window
          sessionStorage.setItem('twitter_oauth_result', JSON.stringify({
            success: false,
            error: 'OAuth was cancelled by user',
          }));

          sessionStorage.removeItem('twitter_oauth_data');

          // Close this window
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // Redirect to login page for normal auth flow
          console.log('[🔄 Twitter Callback] Redirecting to login page...');
          window.location.href = '/login';
        }
      }
      // FLOW 6: No valid parameters received
      else {
        console.error('[❌ Twitter Callback] No valid authentication parameters received:', debugInfo);
        // Redirect to login page instead of showing error
        console.log('[🔄 Twitter Callback] Redirecting to login page...');
        window.location.href = '/login';
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="mb-2 text-gray-900 dark:text-gray-100 font-medium">Authentication Failed</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Return to login
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {isExchangingCode ? 'Completing authentication...' : 'Authenticating...'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
