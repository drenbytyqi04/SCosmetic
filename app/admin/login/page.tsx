import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { LoginForm } from '@/components/admin/login-form';
import { getAdminConfigGap, isUsingDevCredentials } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Admin sign-in',
  robots: { index: false, follow: false },
};

/**
 * Admin sign-in page.
 *
 * When no credentials are configured the page says so plainly rather than silently
 * rejecting every attempt — and in production it says so *without* offering a way in,
 * because an unconfigured admin area must be closed.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  // Only same-origin admin paths are accepted, so this cannot become an open redirect.
  const safeFrom = from && from.startsWith('/admin') ? from : '/admin';

  const configGap = getAdminConfigGap();
  const devMode = isUsingDevCredentials();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-cream-100 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-6 font-serif text-base leading-none tracking-[0.2em] text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            COSMETICS<span className="text-champagne-500">.KS</span>
          </Link>

          <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-cream-200 text-champagne-500">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <h1 className="font-serif text-3xl font-light text-foreground">Store admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage products, inventory and orders.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
          <LoginForm from={safeFrom} />
        </div>

        {devMode && (
          <div className="mt-6 rounded-sm border border-champagne-300 bg-cream-200 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Development mode</p>
            <p>
              No admin credentials are configured, so a local-only default is active:{' '}
              <code className="font-mono text-foreground">admin@cosmetics-ks.com</code> /{' '}
              <code className="font-mono text-foreground">cosmetics-dev-2026</code>.
            </p>
            <p className="mt-2">
              This fallback is disabled entirely in production. Generate real credentials with{' '}
              <code className="font-mono text-foreground">
                node scripts/hash-password.mjs &apos;your-password&apos;
              </code>
              .
            </p>
          </div>
        )}

        {configGap && !devMode && (
          <div className="mt-6 rounded-sm border border-destructive/25 bg-destructive-soft p-4 text-xs leading-relaxed text-destructive">
            {configGap === 'credentials' ? (
              <>
                <p className="mb-1 font-medium">Admin access is not configured</p>
                <p>
                  Set <code className="font-mono">ADMIN_EMAIL</code>,{' '}
                  <code className="font-mono">ADMIN_PASSWORD_HASH</code> and{' '}
                  <code className="font-mono">AUTH_SECRET</code> in this environment, then
                  redeploy. Until then no sign-in will succeed.
                </p>
              </>
            ) : (
              <>
                <p className="mb-1 font-medium">Session secret is missing</p>
                <p>
                  Credentials are configured, but{' '}
                  <code className="font-mono">AUTH_SECRET</code> is absent or shorter than 32
                  characters, so no session can be issued. Set it in this environment, then
                  redeploy.
                </p>
              </>
            )}
            <p className="mt-2 opacity-80">
              Generate both with{' '}
              <code className="font-mono">
                node scripts/hash-password.mjs &apos;your-password&apos;
              </code>
              .
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Back to the storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
