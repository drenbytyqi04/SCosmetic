'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/error-state';

/** Admin error boundary — keeps a failure inside the admin shell. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin-error]', error);
  }, [error]);

  return (
    <ErrorState
      title="This screen failed to load"
      description="The data layer returned an error. Try again, and if it persists check the server logs for the reference below."
      digest={error.digest}
      onRetry={reset}
      homeHref="/admin"
    />
  );
}
