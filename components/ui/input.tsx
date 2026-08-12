import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Input({
  className,
  type = 'text',
  'aria-invalid': ariaInvalid,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      type={type}
      aria-invalid={ariaInvalid}
      className={cn(
        'flex h-11 w-full rounded-sm border border-input bg-surface px-3.5 py-2 text-sm text-foreground shadow-none transition-colors',
        'placeholder:text-muted-foreground/70',
        'focus-visible:border-espresso-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
        'aria-invalid:border-destructive aria-invalid:outline-destructive',
        // 16px on mobile prevents iOS Safari from zooming the viewport on focus.
        'text-base sm:text-sm',
        className,
      )}
      {...props}
    />
  );
}
