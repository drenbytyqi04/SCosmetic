'use client';

import { useFormStatus } from 'react-dom';
import { LogOut } from 'lucide-react';
import { logoutAction } from '@/lib/admin/actions';
import { Spinner } from '@/components/ui/spinner';

/**
 * Sign out.
 *
 * A real form posting to a server action, so it works without JavaScript and cannot
 * be triggered by a cross-site GET.
 */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-xs tracking-[0.08em] text-muted-foreground uppercase transition-colors hover:bg-cream-200 hover:text-foreground disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {pending ? <Spinner label="Signing out" /> : <LogOut className="size-4" aria-hidden="true" />}
      Sign out
    </button>
  );
}
