import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Skeleton block.
 *
 * `aria-hidden` because a screen reader gains nothing from a shape; the
 * surrounding region carries `aria-busy` and a status message instead.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('shimmer rounded-sm bg-sand-100', className)}
      {...props}
    />
  );
}
