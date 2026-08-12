import {
  apiError,
  apiSuccess,
  apiValidationError,
  readJson,
  withErrorHandling,
} from '@/lib/api/response';
import { clientKey, rateLimit } from '@/lib/api/rate-limit';
import { getNewsletterRepository } from '@/lib/marketing/repository';
import { newsletterSchema } from '@/lib/validations/newsletter';

/**
 * POST /api/newsletter
 *
 * Note the response for an address that is already subscribed: the same success
 * message as a new sign-up. Saying "you are already on the list" would turn this into
 * a way to test whether an address is a customer.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const limit = rateLimit(clientKey(request, 'newsletter'), { limit: 5, windowSeconds: 300 });
    if (!limit.success) {
      return apiError('rate_limited', 'Too many attempts. Please wait a moment and try again.', {
        headers: { 'Retry-After': String(limit.retryAfter) },
      });
    }

    const parsed = newsletterSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiValidationError(parsed.error);

    await getNewsletterRepository().subscribe({
      email: parsed.data.email,
      source: parsed.data.source,
    });

    return apiSuccess({ message: 'You are on the list.' });
  }, 'newsletter:subscribe');
}
