import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

/**
 * Empty state. Always says what happened and offers the most useful next step —
 * a blank panel with "nothing here" is a dead end.
 */
export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface/60 px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-cream-200 text-champagne-500">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="font-serif text-2xl font-light text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>

      {(action || secondaryAction) && (
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          {action && (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {secondaryAction && (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      )}

      {children && <div className="mt-7 w-full">{children}</div>}
    </div>
  );
}
