import type { ComponentProps } from 'react';

import Icons from '@/components/icons';
import { cn } from '@/lib/utils';

interface InputProps extends ComponentProps<'input'> {
  wrapperClassName?: string;
}

function Input({ className, type, wrapperClassName, ...props }: InputProps) {
  if (type === 'file') {
    return (
      <div className={cn('relative w-full', wrapperClassName)}>
        <input
          type="file"
          data-slot="input"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          {...props}
        />
        <div
          className={cn(
            'glass flex h-11 w-full items-center justify-start gap-2 rounded-md border px-3 py-2 text-sm transition-[color,box-shadow]',
            'hover:bg-glass-background/60 hover:border-glass-border/60',
            'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-[3px]',
            className
          )}
        >
          <Icons.upload className="text-primary size-4 shrink-0" />
          <span className="text-sm">File Upload</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full items-center gap-4', wrapperClassName)}>
      <input
        type={type}
        data-slot="input"
        className={cn(
          'glass placeholder:text-muted selection:bg-primary selection:text-primary-foreground h-14 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          className
        )}
        {...props}
      />
    </div>
  );
}

export { Input };
