import { z } from 'zod';
import { emailSchema, honeypotSchema } from '@/lib/validations/common';

export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.enum(['footer', 'homepage', 'checkout']).default('footer'),
  /** Hidden field; must stay empty. */
  company: honeypotSchema,
  /** Explicit opt-in — required so the list stays lawful under GDPR. */
  consent: z
    .union([z.boolean(), z.literal('on'), z.literal('true')])
    .transform((value) => value === true || value === 'on' || value === 'true')
    .refine((value) => value, { message: 'Please confirm you would like to hear from us.' }),
});

export type NewsletterInput = z.input<typeof newsletterSchema>;
export type NewsletterPayload = z.output<typeof newsletterSchema>;
