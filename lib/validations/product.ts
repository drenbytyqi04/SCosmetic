import { z } from 'zod';
import { categorySlugSchema } from '@/lib/validations/product-query';
import { priceInputSchema, slugSchema } from '@/lib/validations/common';
import { sanitizeLine, sanitizeText } from '@/lib/utils/sanitize';
import type { NewProduct } from '@/lib/products/repository';

/**
 * Server-side product write schema, used by the admin server actions.
 *
 * Accepts the textarea-and-input shapes the form produces and returns a fully typed
 * `NewProduct`. Image paths are constrained to the local `/images/` tree: an admin
 * should not be able to point a product at an arbitrary URL, and next/image would
 * reject an unlisted remote host anyway.
 */

const IMAGE_PATH = /^\/images\/[a-z0-9][a-z0-9/._-]{2,120}\.(png|jpg|jpeg|webp|avif)$/i;

const listFromLines = (max: number, limit: number) =>
  z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(/\r?\n/)
        .map((line) => sanitizeText(line, max))
        .filter(Boolean)
        .slice(0, limit),
    );

const listFromCommas = (max: number, limit: number) =>
  z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(/[,\n]/)
        .map((entry) => sanitizeLine(entry, max))
        .filter(Boolean)
        .slice(0, limit),
    );

export const productWriteSchema = z
  .object({
    name: z
      .string()
      .transform((value) => sanitizeLine(value, 120))
      .pipe(z.string().min(2, 'Product name is required.').max(120)),
    slug: slugSchema,
    brand: z
      .string()
      .transform((value) => sanitizeLine(value, 80))
      .pipe(z.string().min(2, 'Brand is required.').max(80)),
    category: categorySlugSchema,
    tagline: z
      .string()
      .transform((value) => sanitizeLine(value, 160))
      .pipe(z.string().min(4, 'A tagline is required.').max(160)),
    description: z
      .string()
      .transform((value) => sanitizeText(value, 1200))
      .pipe(z.string().min(20, 'Please write at least 20 characters.').max(1200)),
    details: listFromLines(1000, 8),
    howToUse: z
      .string()
      .default('')
      .transform((value) => sanitizeText(value, 600))
      .transform((value) => (value ? value : undefined)),
    price: priceInputSchema,
    salePrice: z
      .union([z.string(), z.number()])
      .optional()
      .transform((value) => (value === undefined || value === '' ? undefined : value))
      .pipe(priceInputSchema.optional()),
    stock: z.coerce.number().int('Enter a whole number.').min(0).max(100_000),
    size: z
      .string()
      .default('')
      .transform((value) => sanitizeLine(value, 40))
      .transform((value) => (value ? value : undefined)),
    images: z
      .string()
      .transform((value) =>
        value
          .split(/[\n,]/)
          .map((entry) => entry.trim())
          .filter(Boolean)
          .slice(0, 8),
      )
      .pipe(
        z
          .array(z.string().regex(IMAGE_PATH, 'Use local paths such as /images/products/name-1.png'))
          .min(1, 'At least one image is required.'),
      ),
    ingredients: listFromCommas(120, 30),
    benefits: listFromCommas(80, 8),
    featured: z.coerce.boolean().default(false),
    bestseller: z.coerce.boolean().default(false),
    newArrival: z.coerce.boolean().default(false),
  })
  .refine((values) => values.salePrice === undefined || values.salePrice < values.price, {
    message: 'Sale price must be lower than the regular price.',
    path: ['salePrice'],
  });

export type ProductWritePayload = z.output<typeof productWriteSchema>;

/** Maps a validated payload onto the repository's create/update shape. */
export function toNewProduct(payload: ProductWritePayload): NewProduct {
  const product: NewProduct = {
    name: payload.name,
    slug: payload.slug,
    brand: payload.brand,
    category: payload.category,
    tagline: payload.tagline,
    description: payload.description,
    details: payload.details.length ? payload.details : [payload.description],
    price: payload.price,
    images: payload.images,
    stock: payload.stock,
    featured: payload.featured,
    bestseller: payload.bestseller,
    newArrival: payload.newArrival,
  };

  if (payload.salePrice !== undefined) product.salePrice = payload.salePrice;
  if (payload.howToUse) product.howToUse = payload.howToUse;
  if (payload.size) product.size = payload.size;
  if (payload.ingredients.length) product.ingredients = payload.ingredients;
  if (payload.benefits.length) product.benefits = payload.benefits;

  return product;
}

export const stockAdjustSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  delta: z.coerce.number().int().min(-10_000).max(10_000),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  status: z.enum(['pending', 'paid', 'fulfilled', 'cancelled', 'refunded']),
});
