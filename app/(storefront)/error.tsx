'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';

/**
 * Route-level error boundary.
 *
 * Only `error.digest` is ever shown — the message can contain internals, and Next.js
 * already redacts it in production builds. The full error goes to the console (and
 * from there to whatever log drain the deployment uses).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[route-error]', error);
  }, [error]);

  return <ErrorState digest={error.digest} onRetry={reset} />;
}
