import { Navigate, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/profile/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/profile/settings/basic" />;
}
