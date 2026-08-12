import {
  apiError,
  apiSuccess,
  apiValidationError,
  readJson,
  withErrorHandling,
} from '@/lib/api/response';
import { clientKey, rateLimit } from '@/lib/api/rate-limit';
import { getContactRepository } from '@/lib/marketing/repository';
import { contactSchema } from '@/lib/validations/contact';

/**
 * POST /api/contact
 *
 * Stores the message for the admin inbox. When an email provider is configured this is
 * where the notification send belongs — the values are already sanitised by the schema,
 * so they are safe to place into an email body.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const limit = rateLimit(clientKey(request, 'contact'), { limit: 5, windowSeconds: 600 });
    if (!limit.success) {
      return apiError('rate_limited', 'Too many messages. Please wait a few minutes.', {
        headers: { 'Retry-After': String(limit.retryAfter) },
      });
    }

    const parsed = contactSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiValidationError(parsed.error);

    await getContactRepository().create({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });

    return apiSuccess({ message: 'Thank you — we will reply within one working day.' });
  }, 'contact:create');
}
