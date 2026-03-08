import { Navigate, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Navigate to="/dashboard/my-dashboard" />;
}
