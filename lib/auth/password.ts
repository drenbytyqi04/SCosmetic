import 'server-only';

import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Password hashing for admin credentials.
 *
 * Uses scrypt from Node's standard library, so there is no native dependency to
 * build. Node-runtime only — never import this from middleware or a Client
 * Component.
 *
 * Stored format: `scrypt:N:r:p:saltHex:hashHex`
 *
 * Colons, not dollar signs: `.env` loaders (including Next's) run variable
 * expansion over values, and a `$16384` segment would be expanded away to nothing.
 */

/**
 * `promisify` resolves to the shortest `scrypt` overload, which omits the options
 * argument we need, so the promisified function is typed explicitly here.
 */
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const PARAMS = { N: 16384, r: 8, p: 1, keyLength: 64 } as const;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, PARAMS.keyLength, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: 64 * 1024 * 1024,
  });

  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join(':');
}

/** Constant-time verification. Returns false for any malformed stored value. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);

  if (!saltHex || !hashHex || !Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  try {
    const expected = Buffer.from(hashHex, 'hex');
    const derived = await scrypt(
      password.normalize('NFKC'),
      Buffer.from(saltHex, 'hex'),
      expected.length,
      { N, r, p, maxmem: 64 * 1024 * 1024 },
    );

    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Compares two strings without leaking length or content through timing. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Still run a comparison of equal length so the failure path costs the same.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
