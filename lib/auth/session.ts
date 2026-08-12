import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { safeEqual, verifyPassword } from '@/lib/auth/password';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type AdminSession,
} from '@/lib/auth/token';

/**
 * Admin session management.
 *
 * `server-only` is deliberate: importing this from a Client Component is a build
 * error rather than a runtime credential leak.
 */

/** Development fallback credentials, used only when no hash is configured. */
const DEV_EMAIL = 'admin@cosmetics-ks.com';
const DEV_PASSWORD = 'cosmetics-dev-2026';

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_credentials' | 'not_configured' };

/**
 * True when the deployment has real admin credentials configured. The login page
 * reads this to explain itself rather than silently rejecting every attempt.
 */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH);
}

export function isUsingDevCredentials(): boolean {
  return !isAdminConfigured() && process.env.NODE_ENV !== 'production';
}

/**
 * Verifies credentials against the configured admin account.
 *
 * In production, a deployment without ADMIN_EMAIL + ADMIN_PASSWORD_HASH rejects
 * every login. That is intentional: an unconfigured admin area must be closed, not
 * open with a default password.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<LoginResult> {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;

  if (configuredEmail && configuredHash) {
    const emailMatches = safeEqual(email.trim().toLowerCase(), configuredEmail.trim().toLowerCase());
    const passwordMatches = await verifyPassword(password, configuredHash);
    // Both checks always run so a wrong email and a wrong password cost the same.
    return emailMatches && passwordMatches ? { ok: true } : { ok: false, reason: 'invalid_credentials' };
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[auth] Admin login attempted but ADMIN_EMAIL/ADMIN_PASSWORD_HASH are not configured.',
    );
    return { ok: false, reason: 'not_configured' };
  }

  const emailMatches = safeEqual(email.trim().toLowerCase(), DEV_EMAIL);
  const passwordMatches = safeEqual(password, DEV_PASSWORD);
  return emailMatches && passwordMatches ? { ok: true } : { ok: false, reason: 'invalid_credentials' };
}

export async function createAdminSession(email: string): Promise<void> {
  const token = await signSessionToken({ email: email.trim().toLowerCase(), role: 'admin' });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** The current admin session, or null when signed out. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * Gate for admin pages and server actions.
 *
 * Middleware already blocks unauthenticated navigation, but every server action
 * re-checks here — middleware protects routes, not the actions a page can invoke.
 */
export async function requireAdmin(returnTo = '/admin'): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect(`/admin/login?from=${encodeURIComponent(returnTo)}`);
  }
  return session;
}
