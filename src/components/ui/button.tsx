import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';

import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'glass hover:bg-glass-background/80 hover:border-glass-border/80',
        destructive:
          'glass bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/30 hover:border-destructive/50',
        success:
          'glass bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/30 hover:border-green-500/50',
        info: 'glass bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/50',
        warning:
          'glass bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30 hover:border-yellow-500/50',
        outline:
          'glass hover:bg-glass-background/60 hover:border-glass-border/60',
        secondary:
          'glass bg-secondary/20 text-secondary-foreground border-secondary/30 hover:bg-secondary/30',
        ghost: 'hover:bg-glass-background/40 border-transparent',
        link: 'text-primary underline-offset-4 hover:underline bg-transparent border-transparent',
        premium:
          'relative overflow-hidden glass bg-[linear-gradient(-45deg,var(--primary)_0%,var(--accent)_25%,var(--quaternary)_50%,var(--tertiary)_75%,var(--primary)_100%)] bg-[length:200%_200%] animate-[premium-shine_3s_ease-in-out_infinite] text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.16)] hover:shadow-[0_0_20px_oklch(var(--primary))] transition-all after:absolute after:inset-0 after:rounded-md after:p-[2px] after:bg-[conic-gradient(from_var(--rotate,0deg),var(--primary)_0%,var(--accent)_25%,var(--quaternary)_50%,var(--tertiary)_75%,var(--primary)_100%)] after:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] after:[mask-composite:exclude] after:animate-[premium-border-rotate_3s_linear_infinite] after:pointer-events-none after:z-[-1]',
      },
      size: {
        default: 'px-5 py-3 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
