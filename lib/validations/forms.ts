import { z } from 'zod';
import { categorySlugSchema } from '@/lib/validations/product-query';
import { shippingCountries } from '@/lib/validations/checkout';
import { contactTopics } from '@/lib/validations/contact';

/**
 * Client-side form schemas.
 *
 * These deliberately mirror — rather than reuse — the server schemas. Server
 * schemas sanitise and coerce, which makes their input and output types diverge and
 * makes them awkward to drive a controlled form with. These are plain shapes with
 * the same rules, used purely for inline UX feedback.
 *
 * The server schema is always the authority. If the two ever disagree, the request
 * is rejected server-side — a client that skips these checks gains nothing.
 */

const email = z
  .string()
  .min(1, 'Email address is required.')
  .email('Enter a valid email address.')
  .max(254);

export const newsletterFormSchema = z.object({
  email,
  consent: z.boolean().refine((value) => value, {
    message: 'Please confirm you would like to hear from us.',
  }),
  company: z.string().max(0).optional(),
});
export type NewsletterFormValues = z.infer<typeof newsletterFormSchema>;

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Please enter your name.').max(80),
  email,
  subject: z.enum(contactTopics, { message: 'Choose a subject.' }),
  message: z
    .string()
    .min(20, 'Please give us at least 20 characters so we can help properly.')
    .max(2000, 'Please keep your message under 2000 characters.'),
  company: z.string().max(0).optional(),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const checkoutFormSchema = z.object({
  email,
  phone: z
    .string()
    .max(24)
    .refine((value) => value === '' || /^[+0-9 ()-]{6,24}$/.test(value), {
      message: 'Enter a valid phone number.',
    }),
  shippingAddress: z.object({
    fullName: z.string().min(2, 'Please enter the recipient’s name.').max(80),
    line1: z.string().min(4, 'Address is required.').max(120),
    line2: z.string().max(120),
    city: z.string().min(2, 'City is required.').max(80),
    postalCode: z
      .string()
      .min(4, 'Enter a valid postal code.')
      .max(12)
      .regex(/^[A-Za-z0-9 -]{4,12}$/, 'Enter a valid postal code.'),
    country: z.enum(shippingCountries),
  }),
  shippingMethod: z.enum(['standard', 'express']),
  notes: z.string().max(500, 'Please keep delivery notes under 500 characters.'),
  subscribe: z.boolean(),
  acceptTerms: z.boolean().refine((value) => value, {
    message: 'Please accept the terms to continue.',
  }),
  company: z.string().max(0).optional(),
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

/**
 * Admin product form. Prices are typed as decimal strings because that is what an
 * `<input>` gives you; the server converts to cents.
 */
export const productFormSchema = z
  .object({
    name: z.string().min(2, 'Product name is required.').max(120),
    slug: z
      .string()
      .min(2, 'Slug is required.')
      .max(90)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.'),
    brand: z.string().min(2, 'Brand is required.').max(80),
    category: categorySlugSchema,
    tagline: z.string().min(4, 'A short tagline helps the product card read well.').max(160),
    description: z.string().min(20, 'Please write at least 20 characters.').max(1200),
    details: z.string().max(4000),
    howToUse: z.string().max(600),
    price: z
      .string()
      .min(1, 'Price is required.')
      .regex(/^\d+([.,]\d{1,2})?$/, 'Enter a price such as 24.50.'),
    salePrice: z
      .string()
      .max(12)
      .refine((value) => value === '' || /^\d+([.,]\d{1,2})?$/.test(value), {
        message: 'Enter a price such as 19.90, or leave empty.',
      }),
    stock: z
      .string()
      .min(1, 'Stock is required.')
      .regex(/^\d{1,6}$/, 'Enter a whole number.'),
    size: z.string().max(40),
    images: z.string().min(1, 'At least one image path is required.').max(1000),
    ingredients: z.string().max(1000),
    benefits: z.string().max(600),
    featured: z.boolean(),
    bestseller: z.boolean(),
    newArrival: z.boolean(),
  })
  .refine(
    (values) => {
      if (!values.salePrice) return true;
      const price = Number.parseFloat(values.price.replace(',', '.'));
      const sale = Number.parseFloat(values.salePrice.replace(',', '.'));
      return sale < price;
    },
    { message: 'Sale price must be lower than the regular price.', path: ['salePrice'] },
  );
export type ProductFormValues = z.infer<typeof productFormSchema>;

export const adminLoginFormSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
});
export type AdminLoginFormValues = z.infer<typeof adminLoginFormSchema>;
