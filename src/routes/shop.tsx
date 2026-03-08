import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

import { Heading } from '@/components/heading';
import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { useAuthContext } from '@/contexts/auth-context';

export const Route = createFileRoute('/shop')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isAuthenticated } = useAuthContext();

  return (
    <div className="w-full space-y-6">
      <Heading
        title="Shop"
        badge="GuudCard"
        description="Customize and mint your personalized GuudCard NFT"
      />

      {!isAuthenticated ? (
        <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
          <Empty className="border-muted/20 mx-auto max-w-md border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icons.lock />
              </EmptyMedia>
              <EmptyTitle>Authentication Required</EmptyTitle>
              <EmptyDescription>
                You need to be logged in to access the shop and customize your
                cards.
              </EmptyDescription>
            </EmptyHeader>
            <Button className="font-pixel w-full text-xs sm:text-sm" asChild>
              <Link to="/login" className="w-full">
                <Icons.login className="mr-2 size-3 sm:size-4" />
                Sign In to Access Shop
              </Link>
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="glass rounded-md p-4 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </div>
      )}
    </div>
  );
}
