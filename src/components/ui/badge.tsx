import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';

import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden font-pixel',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/20 text-primary [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary/20 text-secondary [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive/20 text-destructive [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        legendary:
          'border-transparent bg-[var(--rarity-legendary)]/20 text-[var(--rarity-legendary)] [a&]:hover:bg-[var(--rarity-legendary)]/90 [a&]:hover:text-black shadow-[0_0_10px_var(--rarity-legendary)]/30',
        epic: 'border-transparent bg-[var(--rarity-epic)]/20 text-[var(--rarity-epic)] [a&]:hover:bg-[var(--rarity-epic)]/90 [a&]:hover:text-white shadow-[0_0_8px_var(--rarity-epic)]/25',
        rare: 'border-transparent bg-[var(--rarity-rare)]/20 text-[var(--rarity-rare)] [a&]:hover:bg-[var(--rarity-rare)]/90 [a&]:hover:text-white shadow-[0_0_6px_var(--rarity-rare)]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
