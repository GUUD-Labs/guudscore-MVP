import type { ApiResponse } from '@/types';
import { ApiError } from '@/types';

import { secureTokenStore } from '@/lib/token-store';

// Base API configuration and service class
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

export class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = config.defaultHeaders;
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async handleRefreshToken(): Promise<string> {
    try {
      // Backend stores refresh token in httpOnly cookie
      // No need to send it manually, browser will send it automatically
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies in request
      });

      if (!response.ok) {
        throw new Error('Refresh token failed');
      }

      const data = await response.json();
      
      // Backend response: { success: true, data: { accessToken: '...' } }
      const newAccessToken = data.data?.accessToken || data.accessToken;

      if (newAccessToken) {
        // Save new access token via secure store
        secureTokenStore.setTokens(newAccessToken);
        
        this.setHeader('Authorization', `Bearer ${newAccessToken}`);
        return newAccessToken;
      }

      throw new Error('No access token in refresh response');
    } catch (error) {
      // Clear access token on refresh failure
      secureTokenStore.clearTokens();
      this.removeHeader('Authorization');
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Prepare headers, but exclude Content-Type for FormData
    let headers = { ...this.defaultHeaders };

    // Automatically add Authorization header from secure store
    const accessToken = secureTokenStore.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (options.body instanceof FormData) {
      // Remove Content-Type for FormData to let browser set it with boundary
      const { 'Content-Type': _, ...headersWithoutContentType } = headers;
      headers = headersWithoutContentType;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: 'include', // Always include cookies for httpOnly refresh token
    };

    console.log('Making API request:', {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: options.body instanceof FormData ? '[FormData]' : options.body,
    });

    try {
      const response = await fetch(url, config);

      console.log('API response status:', response.status);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retry) {
        console.log('[API] 401 Unauthorized - attempting token refresh');

        if (this.isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry the original request after refresh
            return this.request<T>(endpoint, options, false);
          });
        }

        this.isRefreshing = true;

        try {
          const newToken = await this.handleRefreshToken();
          console.log('[API] Token refresh successful');
          this.processQueue(null, newToken);
          this.isRefreshing = false;

          // Retry the original request with new token
          return this.request<T>(endpoint, options, false);
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          this.processQueue(refreshError, null);
          this.isRefreshing = false;

          // Redirect to login
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith('/login') && !currentPath.startsWith('/auth/callback/')) {
              window.location.href = '/login';
            }
          }

          throw new ApiError('Session expired. Please login again.', 401);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new ApiError(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
          response.status
        );
      }

      // Handle empty body (e.g. 201 Created with no content)
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      if (contentLength === '0' || (!contentType?.includes('application/json') && response.status === 204)) {
        return { success: true, data: null as any, message: '', count: 0 } as ApiResponse<T>;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        return { success: true, data: null as any, message: '', count: 0 } as ApiResponse<T>;
      }

      const data = JSON.parse(text);
      console.log('API response data:', data);
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;

    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Handle FormData differently - don't stringify it
    if (data instanceof FormData) {
      return this.request<T>(endpoint, {
        method: 'POST',
        body: data,
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
      });
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Set a header for future requests
   */
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove a header from future requests
   */
  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  /**
   * Get current headers
   */
  getHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }
}

// Singleton instance
export const apiService = new ApiService();
