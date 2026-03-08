import { redirect } from '@tanstack/react-router';

import type { RouterContext } from '@/lib/router-context';

// Protected route guard
export function requireAuth(context: RouterContext) {
  if (!context.auth.isAuthenticated && !context.auth.isLoading) {
    throw redirect({
      to: '/login',
    });
  }
}

// Guest only route guard (redirect authenticated users)
export function requireGuest(context: RouterContext) {
  if (context.auth.isAuthenticated && !context.auth.isLoading) {
    throw redirect({
      to: '/',
    });
  }
}

// Optional auth (no redirect, just provide auth state)
export function optionalAuth(context: RouterContext) {
  return {
    auth: context.auth,
  };
}
