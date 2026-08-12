import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Editorial section heading: small-caps eyebrow, serif title, optional lede and a
 * trailing link. Used for every major band on the site so vertical rhythm and
 * heading hierarchy stay consistent.
 */
export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  /** Heading level — pick the one that fits the page outline, not the size you want. */
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  action?: { label: string; href: string };
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Heading = 'h2',
  align = 'left',
  action,
  className,
}: SectionHeadingProps) {
  const centred = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        centred ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-2.5', centred ? 'max-w-2xl items-center' : 'max-w-xl')}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <Heading
          className={cn(
            'font-serif font-light text-foreground',
            Heading === 'h1'
              ? 'text-display-sm sm:text-display lg:text-display-lg'
              : 'text-3xl sm:text-4xl',
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-2 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:text-champagne-500"
        >
          {action.label}
          <ArrowRight
            className="size-4 transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}
