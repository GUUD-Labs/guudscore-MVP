import * as SwitchPrimitive from '@radix-ui/react-switch';

import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary/20 data-[state=unchecked]:bg-secondary focus-visible:border-primary focus-visible:ring-primary/20 dark:data-[state=unchecked]:bg-secondary/80 border-muted data-[state=checked]:border-primary inline-flex h-6 w-12 shrink-0 items-center border shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        'rounded-none',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-muted/50 data-[state=checked]:bg-primary pointer-events-none block size-4 ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%+10px)] data-[state=unchecked]:translate-x-1',
          'rounded-none'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
