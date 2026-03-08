import type {
    ApiResponse,
    AuthResponse,
    AuthTokens,
    SignInRequest,
    SignUpRequest,
    User,
    ValidateResponse,
    WalletLinkRequest,
    WalletNonceRequest,
    WalletNonceResponse,
    WalletVerifyRequest,
    WalletVerifyResponse,
} from '@/types';

import { secureTokenStore } from '@/lib/token-store';
import { API_CONFIG, ApiService } from './api';

// Auth error types
export interface AuthError {
  message: string;
  code: string;
  field?: string;
}

class AuthService extends ApiService {
  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    // Use raw fetch for this endpoint since it doesn't follow ApiResponse format
    const url = `${API_CONFIG.baseURL}/auth/email/signin`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include', // Include httpOnly refresh token cookie
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Login failed: ${response.status} ${response.statusText}`
      );
    }

    const { accessToken } = await response.json();

    // Set token for subsequent requests
    this.setAuthToken(accessToken);

    try {
      // Get user data using the token
      const userResponse = await this.validate();

      if (!userResponse.valid || !userResponse.user) {
        throw new Error('Failed to validate user after login');
      }

      return {
        user: userResponse.user,
        tokens: {
          accessToken,
          refreshToken: '', // Stored in httpOnly cookie by backend
          expiresIn: 2592000, // 30 days in seconds (backend token duration)
        },
      };
    } catch (error) {
      // If validate fails, clear the token and re-throw
      this.removeAuthToken();
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpRequest): Promise<AuthResponse> {
    // Use raw fetch for this endpoint since it doesn't follow ApiResponse format
    const url = `${API_CONFIG.baseURL}/auth/email/signup`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include', // Include httpOnly refresh token cookie
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Signup failed: ${response.status} ${response.statusText}`
      );
    }

    const { accessToken } = await response.json();

    // Set token for subsequent requests
    this.setAuthToken(accessToken);

    try {
      // Get user data using the token
      const userResponse = await this.validate();

      if (!userResponse.valid || !userResponse.user) {
        throw new Error('Failed to validate user after signup');
      }

      return {
        user: userResponse.user,
        tokens: {
          accessToken,
          refreshToken: '', // Stored in httpOnly cookie by backend
          expiresIn: 2592000, // 30 days in seconds (backend token duration)
        },
      };
    } catch (error) {
      // If validate fails, clear the token and re-throw
      this.removeAuthToken();
      throw error;
    }
  }

  /**
   * Request a nonce for wallet sign-in
   */
  async walletNonce(data: WalletNonceRequest): Promise<WalletNonceResponse> {
    const url = `${API_CONFIG.baseURL}/auth/wallet/nonce`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to request nonce: ${response.status}`
      );
    }

    return await response.json();
  }

  /**
   * Verify wallet signature and authenticate
   */
  async walletVerify(data: WalletVerifyRequest): Promise<AuthResponse> {
    const url = `${API_CONFIG.baseURL}/auth/wallet/verify`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Wallet verification failed: ${response.status}`
      );
    }

    const { accessToken } = (await response.json()) as WalletVerifyResponse;

    this.setAuthToken(accessToken);

    try {
      const userResponse = await this.validate();

      if (!userResponse.valid || !userResponse.user) {
        throw new Error('Failed to validate user after wallet sign-in');
      }

      return {
        user: userResponse.user,
        tokens: {
          accessToken,
          refreshToken: '',
          expiresIn: 2592000,
        },
      };
    } catch (error) {
      this.removeAuthToken();
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.post<ApiResponse<void>>('/auth/logout');
  }

  /**
   * Refresh access token
   */
  async refresh(): Promise<AuthTokens> {
    const response = await this.post<ApiResponse<AuthTokens>>('/auth/refresh');
    return response.data.data;
  }

  /**
   * Validate current session
   */
  async validate(): Promise<ValidateResponse> {
    // Check if we have a token in the headers
    const headers = this.getHeaders();
    if (!headers.Authorization) {
      return {
        valid: false,
      };
    }

    const response = await this.post<User>('/auth/validate');

    if (response.success && response.data) {
      return {
        valid: true,
        user: {
          ...response.data,
          // Map API fields to expected fields for backward compatibility
          username: response.data.name,
          isEmailVerified: response.data.emailVerified,
        },
      };
    }

    return {
      valid: false,
    };
  }

  /**
   * Link wallet to account
   */
  async linkWallet(data: WalletLinkRequest): Promise<User> {
    const response = await this.post<ApiResponse<User>>(
      '/auth/wallet/link',
      data
    );
    const userData = response.data?.data || response.data;
    return userData;
  }

  /**
   * Unlink wallet from account
   */
  async unlinkWallet(walletId: string): Promise<User> {
    const response = await this.delete<ApiResponse<User>>(
      `/auth/wallet/${walletId}`
    );
    return response.data.data;
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const validateResult = await this.validate();
      return validateResult.valid ? validateResult.user || null : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * ========================================
   * Twitter OAuth 2.0 Authentication Flow (RECOMMENDED FOR LOGIN)
   * ========================================
   * 
   * Modern, fast OAuth 2.0 flow for user login
   * Use this for the main login flow
   */

  /**
   * Get Twitter OAuth 2.0 login URL
   * @param referralCode - Optional referral code
   * @returns Promise with OAuth 2.0 authorization URL
   */
  async getTwitterOAuthUrl(referralCode?: string): Promise<string> {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'https://api.guud.fun/api';

    // Use provided referral code or get from localStorage
    const refCode = referralCode || localStorage.getItem('referralCode');

    // Build URL with optional referral parameter (only if valid)
    let url = `${backendUrl}/auth/twitter/start`;
    if (refCode && refCode.trim().length > 0) {
      url += `?ref=${encodeURIComponent(refCode.trim())}`;
      console.log('[Twitter OAuth 2.0] Using referral code:', refCode);
    } else {
      console.log('[Twitter OAuth 2.0] No referral code');
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include', // Include cookies for session management
      });

      if (!response.ok) {
        throw new Error(`Failed to get Twitter OAuth URL: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.data?.url) {
        throw new Error('Invalid response from Twitter OAuth start endpoint');
      }

      console.log('[Twitter OAuth 2.0] Generated URL:', {
        hasReferral: data.data.hasReferral,
        state: data.data.state?.substring(0, 8) + '...',
      });

      // Clear referral code after using it
      if (refCode) {
        localStorage.removeItem('referralCode');
      }

      return data.data.url;
    } catch (error) {
      console.error('Error getting Twitter OAuth URL:', error);
      throw error;
    }
  }

  /**
   * Get Twitter OAuth 1.0a share authorization URL
   * This is used when a user needs to authorize OAuth 1.0a for sharing with images
   * @param returnTo - URL to return to after authorization (e.g., '/share')
   * @param force - Force new authorization even if tokens exist (for expired tokens)
   * @returns Promise with OAuth 1.0a authorization URL
   */
  async getTwitterOAuth1ShareAuthUrl(returnTo?: string, force?: boolean): Promise<string> {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'https://api.guud.fun/api';

    // Build URL with optional returnTo and force parameters
    const params = new URLSearchParams();
    if (returnTo) {
      params.append('returnTo', returnTo);
    }
    if (force) {
      params.append('force', 'true');
    }
    const url = `${backendUrl}/auth/twitter-oauth1/authorize-share${params.toString() ? `?${params.toString()}` : ''}`;

    try {
      // Requires JWT authentication
      const token = secureTokenStore.getAccessToken();
      if (!token) {
        throw new Error('Authentication required. Please login first.');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include', // Include cookies for refresh token
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get Twitter OAuth 1.0a share auth URL: ${response.status}`
        );
      }

      const data = await response.json();

      console.log('[Twitter OAuth 1.0a Share] Backend response:', data);

      // Backend returns: { success: true, data: { url: '...', session: '...', alreadyAuthorized: false } }
      // or { success: true, data: { alreadyAuthorized: true } } if tokens exist but may be expired
      const authUrl = data.data?.url;
      const alreadyAuthorized = data.data?.alreadyAuthorized;

      // If backend says already authorized but we're forcing, this shouldn't happen
      // But if it does, and we don't have a URL, retry with force=true
      if (alreadyAuthorized && !authUrl && !force) {
        console.warn('[Twitter OAuth 1.0a Share] Backend says already authorized but tokens may be expired, retrying with force=true');
        return this.getTwitterOAuth1ShareAuthUrl(returnTo, true);
      }

      if (!data.success || !authUrl) {
        console.error('[Twitter OAuth 1.0a Share] Invalid response structure:', {
          success: data.success,
          hasData: !!data.data,
          hasUrl: !!data.data?.url,
          alreadyAuthorized,
          dataKeys: data.data ? Object.keys(data.data) : [],
          fullData: data
        });
        throw new Error(
          'Invalid response from Twitter OAuth 1.0a authorize-share endpoint'
        );
      }

      console.log('[Twitter OAuth 1.0a Share] Authorization URL generated:', authUrl);

      return authUrl;
    } catch (error) {
      console.error('Error getting Twitter OAuth 1.0a share auth URL:', error);
      throw error;
    }
  }

  /**
   * ========================================
   * Twitter OAuth 1.0a Authentication Flow
   * ========================================
   *
   * USAGE EXAMPLE:
   *
   * // Step 1: Start the OAuth 1.0a flow
   * const { url, session } = await authService.startTwitterOAuth1('referralCode');
   *
   * // Step 2: Redirect user to the authentication URL
   * window.location.href = url;
   *
   * // Step 3: User will be redirected back to your callback URL with oauth_token and oauth_verifier
   * // Handle this in your callback route component
   *
   * ========================================
   */

  /**
   * Twitter OAuth 1.0a - Start authentication
   * Initiates the OAuth 1.0a flow and returns the authentication URL
   * @param referralCode - Optional referral slug
   * @returns Promise with authentication URL and session info
   */
  async startTwitterOAuth1(referralCode?: string): Promise<{
    url: string;
    hasReferral: boolean;
    session: string;
  }> {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'https://api.guud.fun/api';

    // Build URL with optional referral parameter
    let url = `${backendUrl}/auth/twitter-oauth1/start`;
    if (referralCode && referralCode.trim().length > 0) {
      url += `?ref=${encodeURIComponent(referralCode.trim())}`;
      console.log('[Twitter OAuth 1.0a] Using referral code:', referralCode);
    } else {
      console.log('[Twitter OAuth 1.0a] No referral code');
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to start Twitter OAuth 1.0a: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.data?.url) {
        throw new Error(
          'Invalid response from Twitter OAuth 1.0a start endpoint'
        );
      }

      console.log('[Twitter OAuth 1.0a] Authentication started:', {
        hasReferral: data.data.hasReferral,
        session: data.data.session?.substring(0, 8) + '...',
      });

      return {
        url: data.data.url,
        hasReferral: data.data.hasReferral,
        session: data.data.session,
      };
    } catch (error) {
      console.error('Error starting Twitter OAuth 1.0a:', error);
      throw error;
    }
  }

  /**
   * Twitter OAuth 1.0a - Initiate login
   * This endpoint is called by the backend redirect from startTwitterOAuth1
   * Returns the Twitter authorization URL
   * @param session - Session ID from startTwitterOAuth1
   * @returns Redirects to Twitter authorization page
   */
  getTwitterOAuth1LoginUrl(session: string): string {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'https://api.guud.fun/api';

    const url = `${backendUrl}/auth/twitter-oauth1?session=${encodeURIComponent(session)}`;

    console.log('[Twitter OAuth 1.0a] Login URL:', url);

    return url;
  }

  /**
   * Twitter OAuth 1.0a - Complete authentication after callback
   * This method handles the OAuth 1.0a callback flow
   * Note: The callback endpoint typically redirects with tokens in the URL
   * The actual handling is done in the callback route component
   * @param oauthToken - OAuth token from callback
   * @param oauthVerifier - OAuth verifier from callback
   * @returns Authentication URL for callback processing
   */
  getTwitterOAuth1CallbackUrl(
    oauthToken?: string,
    oauthVerifier?: string
  ): string {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'https://api.guud.fun/api';

    let url = `${backendUrl}/auth/twitter-oauth1/callback`;

    const params = new URLSearchParams();
    if (oauthToken) {
      params.append('oauth_token', oauthToken);
    }
    if (oauthVerifier) {
      params.append('oauth_verifier', oauthVerifier);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('[Twitter OAuth 1.0a] Callback URL:', url);

    return url;
  }

  /**
   * Initiate Twitter OAuth flow
   * Returns the backend endpoint URL that will redirect to Twitter OAuth
   */
  /**
   * Initiate Twitter OAuth flow
   * Returns the backend endpoint URL that will redirect to Twitter OAuth
   * IMPORTANT: Must use direct backend URL, not Vercel proxy
   */
  getTwitterLoginUrl(): string {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || 'https://api.guud.fun/api';
    const callbackUrl =
      import.meta.env.VITE_TWITTER_CALLBACK_URL ||
      'https://app.guud.fun/auth/callback/twitter';

    // Get referral code from localStorage if present
    const referralCode = localStorage.getItem('referralCode');

    // Build OAuth URL with callback
    let oauthUrl = `${backendUrl}/auth/twitter?callback_url=${encodeURIComponent(callbackUrl)}`;

    // Append referral code if present
    if (referralCode && referralCode.trim().length > 0) {
      oauthUrl += `&referral_code=${encodeURIComponent(referralCode.trim())}`;
    }

    // Debug log for development
    if (import.meta.env.DEV) {
      console.log('🔐 Twitter OAuth - Starting Auth Flow:', {
        environment: import.meta.env.MODE,
        backendUrl,
        callbackUrl,
        referralCode: referralCode || 'none',
        fullUrl: oauthUrl,
        timestamp: new Date().toISOString(),
      });
    }

    return oauthUrl;
  }

  /**
   * @deprecated This method is not needed anymore
   * Backend now redirects directly to frontend with tokens in URL
   * Use the callback route component instead
   */
  async completeTwitterLogin(
    code: string,
    state: string
  ): Promise<AuthResponse> {
    const url = `${API_CONFIG.baseURL}/auth/twitter/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include', // Include httpOnly refresh token cookie
    });

    if (!response.ok) {
      throw new Error(
        `Twitter login failed: ${response.status} ${response.statusText}`
      );
    }

    const { accessToken } = await response.json();

    // Set token for subsequent requests
    this.setAuthToken(accessToken);

    try {
      // Get user data using the token
      const userResponse = await this.validate();

      if (!userResponse.valid || !userResponse.user) {
        throw new Error('Failed to validate user after Twitter login');
      }

      return {
        user: userResponse.user,
        tokens: {
          accessToken,
          refreshToken: '', // Stored in httpOnly cookie by backend
          expiresIn: 2592000, // 30 days in seconds (backend token duration)
        },
      };
    } catch (error) {
      // If validate fails, clear the token and re-throw
      this.removeAuthToken();
      throw error;
    }
  }

  /**
   * Set authorization token for future requests
   */
  setAuthToken(token: string): void {
    this.setHeader('Authorization', `Bearer ${token}`);
  }

  /**
   * Remove authorization token
   */
  removeAuthToken(): void {
    this.removeHeader('Authorization');
  }
}

// Create and export the service instance
export const authService = new AuthService();
export default authService;
