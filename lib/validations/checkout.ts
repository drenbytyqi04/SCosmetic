import { z } from 'zod';
import { cartLineSchema, shippingMethodSchema } from '@/lib/validations/cart';
import {
  emailSchema,
  honeypotSchema,
  lineSchema,
  nameSchema,
  optionalLineSchema,
  phoneSchema,
} from '@/lib/validations/common';
import { sanitizeText } from '@/lib/utils/sanitize';

/** Countries the store currently ships to. */
export const shippingCountries = [
  'Kosovo',
  'Albania',
  'North Macedonia',
  'Montenegro',
  'Serbia',
] as const;

export const addressSchema = z.object({
  fullName: nameSchema,
  line1: lineSchema('Address', { min: 4, max: 120 }),
  line2: optionalLineSchema(120),
  city: lineSchema('City', { min: 2, max: 80 }),
  postalCode: z
    .string()
    .transform((value) => value.trim().toUpperCase().slice(0, 12))
    // The regex already enforces the 4–12 length, so there is no separate min()
    // check — two rules with the same message produce a duplicated error.
    .pipe(z.string().regex(/^[A-Z0-9 -]{4,12}$/, { message: 'Enter a valid postal code.' })),
  country: z.enum(shippingCountries),
});

export const checkoutSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  shippingAddress: addressSchema,
  shippingMethod: shippingMethodSchema,
  items: z.array(cartLineSchema).min(1, { message: 'Your bag is empty.' }).max(50),
  couponCode: z.string().trim().max(24).optional(),
  notes: z
    .string()
    .transform((value) => sanitizeText(value, 500))
    .pipe(z.string().max(500))
    .optional()
    .transform((value) => (value ? value : undefined)),
  subscribe: z.coerce.boolean().default(false),
  /** Explicit acceptance of terms is a legal requirement, not a nice-to-have. */
  acceptTerms: z
    .union([z.boolean(), z.literal('on'), z.literal('true')])
    .transform((value) => value === true || value === 'on' || value === 'true')
    .refine((value) => value, { message: 'Please accept the terms to continue.' }),
  /** Hidden field; must stay empty. */
  company: honeypotSchema,
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutPayload = z.output<typeof checkoutSchema>;
