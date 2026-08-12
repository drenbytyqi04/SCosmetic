'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { LogIn } from 'lucide-react';
import { Field, FormStatus } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { loginAction, type LoginState } from '@/lib/admin/actions';

/**
 * Admin sign-in.
 *
 * A progressively-enhanced form: it posts to a server action, so it works before
 * hydration and the password never touches client-side JavaScript we control. The
 * `from` path is carried in a hidden field and validated server-side.
 */
export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <FormStatus tone="error" title="Sign-in failed">
          {state.error}
        </FormStatus>
      )}

      <input type="hidden" name="from" value={from} />

      <Field label="Email address" error={state.fieldErrors?.email?.[0]} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            // Repopulated from the action state; the password is never echoed back.
            defaultValue={state.email ?? ''}
            required
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <Field label="Password" error={state.fieldErrors?.password?.[0]} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? (
        <>
          <Spinner label="Signing in" />
          Signing in…
        </>
      ) : (
        <>
          <LogIn aria-hidden="true" />
          Sign in
        </>
      )}
    </Button>
  );
}
