import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Textarea({ className, rows = 5, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        'flex w-full rounded-sm border border-input bg-surface px-3.5 py-2.5 text-base text-foreground transition-colors sm:text-sm',
        'placeholder:text-muted-foreground/70',
        'focus-visible:border-espresso-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70',
        'aria-invalid:border-destructive aria-invalid:outline-destructive',
        'resize-y',
        className,
      )}
      {...props}
    />
  );
}
