/**
 * Fixed-window rate limiter for public write endpoints.
 *
 * In-process and therefore per-instance — enough to stop a single client hammering
 * the newsletter or contact form, not a substitute for an edge/Redis limiter at
 * real traffic. Swap the `hits` map for Upstash/Redis when you deploy at scale;
 * the call signature stays the same.
 */

interface Window {
  count: number;
  resetAt: number;
}

const globalForLimiter = globalThis as unknown as { __rateLimitHits?: Map<string, Window> };
const hits: Map<string, Window> = (globalForLimiter.__rateLimitHits ??= new Map());

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Seconds until the window resets — surfaced as Retry-After. */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  { limit = 5, windowSeconds = 60 } = {},
): RateLimitResult {
  const now = Date.now();
  const existing = hits.get(key);

  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    // Opportunistic cleanup so the map cannot grow without bound.
    if (hits.size > 5000) {
      for (const [entryKey, window] of hits) {
        if (window.resetAt <= now) hits.delete(entryKey);
      }
    }
    return { success: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return existing.count > limit
    ? { success: false, remaining: 0, retryAfter }
    : { success: true, remaining: limit - existing.count, retryAfter };
}

/**
 * Best-effort client identifier. `x-forwarded-for` is spoofable in general, but on
 * a platform that sets it (Vercel, most reverse proxies) the left-most entry is the
 * real client. Falls back to a shared bucket rather than failing open per-request.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous';
  return `${scope}:${ip}`;
}
