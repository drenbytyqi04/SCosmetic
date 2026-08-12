'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ActionResult } from '@/lib/admin/actions';

/**
 * Generic table-row action.
 *
 * Wraps the pending state, the toast and the refresh that every one-shot admin
 * mutation needs, so individual rows do not each reimplement them.
 */
export function RowActionButton({
  action,
  label,
  pendingLabel = 'Working…',
  successMessage,
  variant = 'ghost',
  size = 'sm',
  confirm,
  children,
}: {
  action: () => Promise<ActionResult<unknown>>;
  /** Accessible name; used when `children` is an icon only. */
  label: string;
  pendingLabel?: string;
  successMessage: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  /** When set, the action only runs after the browser confirm is accepted. */
  confirm?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (confirm && !window.confirm(confirm)) return;

    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        toast.error('That did not work', { description: result.error });
        return;
      }

      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      aria-label={label}
    >
      {isPending ? (
        <>
          <Spinner label={pendingLabel} />
          {pendingLabel}
        </>
      ) : (
        (children ?? label)
      )}
    </Button>
  );
}
