import { jwtVerify, SignJWT } from 'jose';

/**
 * Admin session tokens.
 *
 * Kept free of `next/headers` and `node:crypto` so this module can be imported from
 * middleware (Edge runtime) as well as from Server Components and actions.
 */

export const SESSION_COOKIE = 'cosmetics_ks_admin';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

const ISSUER = 'cosmetics-ks';
const AUDIENCE = 'cosmetics-ks-admin';

export interface AdminSession {
  email: string;
  role: 'admin';
}

/**
 * The signing secret. Required in production — a build that reaches production
 * without it should fail loudly rather than fall back to a value in the source tree.
 */
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'AUTH_SECRET is missing or too short. Set a random value of at least 32 characters ' +
          '(see .env.example) before deploying.',
      );
    }
    // Development only: a deterministic secret keeps sessions valid across restarts.
    return new TextEncoder().encode('development-only-insecure-secret-do-not-ship-32');
  }

  return new TextEncoder().encode(secret);
}

/**
 * Whether a session can actually be signed.
 *
 * Checked *before* attempting a sign-in so a deployment that set credentials but
 * forgot AUTH_SECRET reports the real cause, instead of throwing out of the login
 * action and rendering an opaque "a server error occurred". Deployment state, not a
 * secret — the login page already discloses when admin access is unconfigured.
 */
export function isSessionSecretConfigured(): boolean {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return true;
  // Development falls back to a fixed secret, so signing still works there.
  return process.env.NODE_ENV !== 'production';
}

export async function signSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Returns the session for a valid token, or null for anything else. */
export async function verifySessionToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });

    if (typeof payload.email !== 'string' || payload.role !== 'admin') return null;
    return { email: payload.email, role: 'admin' };
  } catch {
    // Expired, tampered with, or signed by a different secret — all the same to us.
    return null;
  }
}
