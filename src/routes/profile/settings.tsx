import { Outlet, createFileRoute } from '@tanstack/react-router';

import { SettingsPages } from '@/components/settings-pages';

export const Route = createFileRoute('/profile/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-10">
      <SettingsPages />

      <div>
        <Outlet />
      </div>
    </div>
  );
}
