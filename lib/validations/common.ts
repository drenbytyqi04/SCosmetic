import { z } from 'zod';
import { normaliseEmail, sanitizeLine, sanitizeText } from '@/lib/utils/sanitize';

/**
 * Shared primitives.
 *
 * Every schema in this folder sanitises before it validates, so a value that
 * passes has already been normalised — route handlers and server actions can
 * trust the parsed output and nothing else.
 */

export const emailSchema = z
  .string()
  .transform(normaliseEmail)
  .pipe(z.email({ message: 'Enter a valid email address.' }).max(254));

export const nameSchema = z
  .string()
  .transform((value) => sanitizeLine(value, 80))
  .pipe(
    z
      .string()
      .min(2, { message: 'Please enter at least 2 characters.' })
      .max(80, { message: 'Please use 80 characters or fewer.' }),
  );

export const lineSchema = (label: string, { min = 1, max = 120 } = {}) =>
  z
    .string()
    .transform((value) => sanitizeLine(value, max))
    .pipe(
      z
        .string()
        .min(min, { message: `${label} is required.` })
        .max(max, { message: `${label} must be ${max} characters or fewer.` }),
    );

export const optionalLineSchema = (max = 120) =>
  z
    .string()
    .transform((value) => sanitizeLine(value, max))
    .pipe(z.string().max(max))
    .optional()
    .transform((value) => (value ? value : undefined));

export const messageSchema = z
  .string()
  .transform((value) => sanitizeText(value, 2000))
  .pipe(
    z
      .string()
      .min(20, { message: 'Please give us at least 20 characters so we can help properly.' })
      .max(2000, { message: 'Please keep your message under 2000 characters.' }),
  );

/**
 * Phone numbers vary too much to validate strictly; we check shape only so a
 * legitimate international format is never rejected.
 */
export const phoneSchema = z
  .string()
  .optional()
  .transform((value) => sanitizeLine(value ?? '', 24))
  .refine((value) => value === '' || /^[+0-9 ()-]{6,24}$/.test(value), {
    message: 'Enter a valid phone number.',
  })
  // An empty field means "not provided", not an empty string in the database.
  .transform((value) => (value === '' ? undefined : value));

/** Cents, as an integer. Used by admin forms after converting from decimals. */
export const centsSchema = z
  .number()
  .int({ message: 'Use a whole number of cents.' })
  .min(0)
  .max(10_000_000);

/** Accepts "12.50" or 12.5 from a form and yields cents. */
export const priceInputSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const parsed = typeof value === 'string' ? Number.parseFloat(value.replace(',', '.')) : value;
    if (!Number.isFinite(parsed) || parsed < 0) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid price.' });
      return z.NEVER;
    }
    return Math.round(parsed * 100);
  })
  .pipe(centsSchema);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use lowercase letters, numbers and hyphens only.',
  });

/** A single-field honeypot: real users never fill it in, bots usually do. */
export const honeypotSchema = z
  .string()
  .max(0, { message: 'Submission rejected.' })
  .optional()
  .or(z.literal(''));

export type FieldErrors = Record<string, string[] | undefined>;

/** Flattens Zod issues into the shape our form components render. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_form';
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}
