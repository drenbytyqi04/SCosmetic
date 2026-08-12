import * as React from 'react';
import { Breadcrumbs, type Crumb } from '@/components/shared/breadcrumbs';
import { cn } from '@/lib/utils/cn';

/**
 * Standard page masthead: breadcrumbs, h1, lede and an optional right-hand slot.
 * Keeps every non-home page opening with the same rhythm.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  trail,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  trail?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('border-b border-border bg-cream-200/60', className)}>
      <div className="container-page py-8 sm:py-12">
        {trail && <Breadcrumbs trail={trail} className="mb-5" />}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className="mt-2 font-serif text-3xl font-light text-foreground sm:text-4xl lg:text-display-sm">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>

          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
