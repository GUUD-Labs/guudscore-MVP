import { Link } from '@tanstack/react-router';

import FuzzyText from '@/components/fuzzy-text';
import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export const NotFound = () => {
  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center py-20">
      <Empty className="border-muted/20 mx-auto max-w-lg border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.search className="size-5" />
          </EmptyMedia>
          <div className="space-y-4">
            <FuzzyText
              baseIntensity={0.2}
              hoverIntensity={0.5}
              enableHover={true}
            >
              404
            </FuzzyText>
            <EmptyTitle>Page Not Found</EmptyTitle>
          </div>
          <EmptyDescription>
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </EmptyDescription>
        </EmptyHeader>
        <Button className="font-pixel flex-1" asChild>
          <Link to="/" className="w-full">
            <Icons.chevronLeft className="text-primary mr-2 size-3" />
            Go Home
          </Link>
        </Button>
      </Empty>
    </div>
  );
};
