import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const Card = ({
  title,
  children,
  contentClassName,
  wrapperClassName,
  headingClassName,
}: {
  title: string;
  children: ReactNode;
  contentClassName?: string;
  wrapperClassName?: string;
  headingClassName?: string;
}) => {
  return (
    <div
      className={cn(
        'glass flex flex-col gap-2 sm:gap-3 rounded-md p-4 sm:p-5 md:p-6',
        wrapperClassName
      )}
    >
      <h5 className={cn('text-muted text-sm sm:text-base font-medium', headingClassName)}>
        {title}
      </h5>

      <div className={cn(contentClassName)}>{children}</div>
    </div>
  );
};
