'use client';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

/**
 * Error state used by every `error.tsx` boundary.
 *
 * Shows a recovery action first and the technical digest last — the digest is the
 * only detail Next.js exposes for a server error, and it is what support needs to
 * find the log entry. The underlying message is never rendered.
 */
export interface ErrorStateProps {
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
  homeHref?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this page. It is usually temporary — try again, and if it persists our team can help.',
  digest,
  onRetry,
  homeHref = '/',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-20 text-center',
        className,
      )}
    >
      <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>

      <h1 className="font-serif text-3xl font-light text-foreground">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {onRetry && (
          <Button onClick={onRetry}>
            <RotateCcw aria-hidden="true" />
            Try again
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={homeHref}>Back to shopping</Link>
        </Button>
      </div>

      {digest && (
        <p className="mt-8 font-mono text-[0.6875rem] text-muted-foreground/70">
          Reference: {digest}
        </p>
      )}
    </div>
  );
}
