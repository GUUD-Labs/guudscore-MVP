import type { User } from '@/types';

// Auth state for router context
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Router context type
export interface RouterContext {
  auth: AuthState;
}

// Default auth state
export const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};
