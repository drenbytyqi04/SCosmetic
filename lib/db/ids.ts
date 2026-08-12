/**
 * Identifier generation, shared by both data sources.
 *
 * Kept separate from the in-memory store so the Postgres repositories can use it
 * without importing the seed catalogue along with it.
 */

/** Short, readable identifier for new records, e.g. `prd_4f2a91c8bd07`. */
export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

/**
 * Customer-facing order reference, e.g. `KS-8F31A2`.
 *
 * Six characters from a 32-symbol alphabet — about 10^9 combinations — drawn from a
 * CSPRNG so references cannot be guessed or walked. The alphabet omits I, O, 0 and 1 so
 * a reference read aloud or copied off a screen is unambiguous.
 */
export function createOrderReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const body = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `KS-${body}`;
}
