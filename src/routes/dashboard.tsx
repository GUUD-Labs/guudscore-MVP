import { Outlet, createFileRoute } from '@tanstack/react-router';

import { DashboardPages } from '@/components/dashboard-pages';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardStats } from '@/components/dashboard-stats';
import { requireAuth } from '@/lib/auth-guards';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
});

function DashboardLayout() {
  return (
    <div className="w-full space-y-6">
      <DashboardStats />
      
      {/* Mobile horizontal menu */}
      <div className="lg:hidden">
        <DashboardPages />
      </div>

      {/* Desktop layout with sidebar */}
      <div className="flex gap-6">
        <DashboardSidebar />
        
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
