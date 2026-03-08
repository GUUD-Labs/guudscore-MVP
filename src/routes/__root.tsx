import { TanstackDevtools } from '@tanstack/react-devtools';
import {
    Outlet,
    createRootRouteWithContext,
    useMatches,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import { Footer } from '@/components/shared/footer';
import { Header } from '@/components/shared/header';
import { NotFound } from '@/components/shared/not-found';
import type { RouterContext } from '@/lib/router-context';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
});

function RootComponent() {
  const matches = useMatches();
  const isProfilePage = matches.some(
    match => match.routeId === '/profile/$username'
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main
        className={`flex flex-1 flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6 md:p-8 lg:p-10 ${isProfilePage ? 'mx-auto w-full max-w-screen-2xl' : ''}`}
      >
        <Outlet />
      </main>
      <Footer />
      {import.meta.env.DEV && (
        <TanstackDevtools
          config={{
            position: 'bottom-left',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      )}
    </div>
  );
}
