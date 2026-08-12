import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { AdminMobileNav, AdminSidebarNav } from '@/components/admin/admin-nav';
import { LogoutButton } from '@/components/admin/logout-button';
import { requireAdmin, isUsingDevCredentials } from '@/lib/auth/session';
import { siteConfig } from '@/lib/config/site';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin · COSMETICS.KS' },
  robots: { index: false, follow: false },
};

/**
 * Admin shell.
 *
 * A route group, so `/admin/login` sits outside it — otherwise the auth gate here
 * would redirect the login page to itself.
 *
 * `requireAdmin()` runs on every render of every admin page. Middleware has already
 * checked the cookie, but this is the check that the page's own data access depends on.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const usingDevCredentials = isUsingDevCredentials();

  return (
    <div className="min-h-svh bg-cream-100">
      {usingDevCredentials && (
        <div role="status" className="bg-destructive px-4 py-2 text-center text-xs text-destructive-foreground">
          Development credentials are in use. Set{' '}
          <code className="font-mono">ADMIN_EMAIL</code> and{' '}
          <code className="font-mono">ADMIN_PASSWORD_HASH</code> before deploying — see
          .env.example.
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[15rem_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden border-r border-border bg-cream-200/50 lg:sticky lg:top-0 lg:block lg:h-svh lg:overflow-y-auto">
          <div className="flex h-full flex-col p-5">
            <Link
              href="/admin"
              className="mb-8 block rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="font-serif text-base leading-none tracking-[0.2em] text-foreground">
                COSMETICS<span className="text-champagne-500">.KS</span>
              </span>
              <span className="mt-1 block text-[0.625rem] tracking-[0.18em] text-muted-foreground uppercase">
                Store admin
              </span>
            </Link>

            <AdminSidebarNav />

            <div className="mt-auto flex flex-col gap-3 border-t border-border pt-5">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                View storefront
              </Link>
              <p className="truncate text-xs text-muted-foreground" title={session.email}>
                {session.email}
              </p>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-cream-100/95 px-4 py-2 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2">
              <AdminMobileNav />
              <span className="font-serif text-sm tracking-[0.18em] text-foreground">
                {siteConfig.name}
              </span>
            </div>
            <LogoutButton />
          </header>

          <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
