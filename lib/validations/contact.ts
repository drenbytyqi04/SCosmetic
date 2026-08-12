import { z } from 'zod';
import {
  emailSchema,
  honeypotSchema,
  lineSchema,
  messageSchema,
  nameSchema,
} from '@/lib/validations/common';

export const contactTopics = [
  'Order enquiry',
  'Shade matching',
  'Product advice',
  'Returns',
  'Wholesale',
  'Something else',
] as const;

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: lineSchema('Subject', { min: 3, max: 120 }),
  message: messageSchema,
  /** Hidden field; must stay empty. */
  company: honeypotSchema,
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactPayload = z.output<typeof contactSchema>;
