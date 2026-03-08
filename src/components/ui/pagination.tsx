import type { ComponentProps } from 'react';

import Icons from '@/components/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-2', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ComponentProps<typeof Button>, 'size'> &
  ComponentProps<'a'>;

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? 'default' : 'ghost',
          size,
        }),
        'font-pixel text-primary border-2 text-sm',
        isActive && 'bg-primary/20 text-primary border-primary/30 shadow-lg',
        !isActive &&
          'hover:bg-glass-background/60 hover:border-glass-border/60',
        className
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn(
        'font-pixel glass gap-2 px-3 py-2 text-sm',
        'hover:bg-glass-background/80 hover:border-glass-border/80',
        className
      )}
      {...props}
    >
      <Icons.chevronLeft className="size-3" />
      <span className="text-primary hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn(
        'font-pixel glass gap-2 px-3 py-2 text-sm',
        'hover:bg-glass-background/80 hover:border-glass-border/80',
        className
      )}
      {...props}
    >
      <span className="text-primary hidden sm:block">Next</span>
      <Icons.chevronRight className="size-3" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        'font-pixel text-muted flex size-9 items-center justify-center',
        className
      )}
      {...props}
    >
      <Icons.dots className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
