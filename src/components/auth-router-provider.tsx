import { RouterProvider, createRouter } from '@tanstack/react-router';

import { useAuthContext } from '@/contexts/auth-context';
import { routeTree } from '@/routeTree.gen';

export function AuthRouterProvider() {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  // Create router with auth context
  const router = createRouter({
    routeTree,
    context: {
      auth: {
        user,
        isAuthenticated,
        isLoading,
      },
    },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
  });

  return <RouterProvider router={router} />;
}
