import { z } from 'zod';
import { commerceConfig } from '@/lib/config/site';
import type { ProductQuery } from '@/types';

/**
 * Parses the shop URL into a `ProductQuery`.
 *
 * The URL is the single source of truth for filter state — shareable, back-button
 * friendly, and readable by Server Components without any client hydration. Every
 * value is coerced and clamped here, because search params are user input.
 */

export const categorySlugSchema = z.enum([
  'lips',
  'complexion',
  'skincare',
  'eyes',
  'fragrance',
  'tools',
  'body',
]);

export const productSortSchema = z.enum([
  'featured',
  'newest',
  'price-asc',
  'price-desc',
  'rating',
  'name-asc',
]);

export const productTagSchema = z.enum(['featured', 'bestseller', 'newArrival']);

/** Comma- or repeat-separated list, e.g. `?category=lips,eyes` or `?category=lips&category=eyes`. */
function toList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const parts = Array.isArray(value) ? value : [value];
  return parts
    .flatMap((part) => part.split(','))
    .map((part) => part.trim())
    .filter(Boolean);
}

function first(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const priceParam = z.coerce.number().finite().min(0).max(100_000);
const pageParam = z.coerce.number().int().min(1).max(500);

export function parseProductQuery(
  params: RawSearchParams,
  defaults: Partial<ProductQuery> = {},
): ProductQuery {
  const q = first(params.q)?.slice(0, 100).trim();
  const categories = toList(params.category)
    .map((value) => categorySlugSchema.safeParse(value))
    .flatMap((result) => (result.success ? [result.data] : []));
  const brands = toList(params.brand).map((brand) => brand.slice(0, 60));
  const tags = toList(params.tag)
    .map((value) => productTagSchema.safeParse(value))
    .flatMap((result) => (result.success ? [result.data] : []));

  const minEuros = priceParam.safeParse(first(params.min));
  const maxEuros = priceParam.safeParse(first(params.max));
  const sort = productSortSchema.safeParse(first(params.sort) ?? '');
  const page = pageParam.safeParse(first(params.page) ?? '1');

  const query: ProductQuery = {
    ...defaults,
    sort: sort.success ? sort.data : (defaults.sort ?? 'featured'),
    page: page.success ? page.data : 1,
    perPage: defaults.perPage ?? commerceConfig.productsPerPage,
  };

  if (q) query.q = q;
  if (categories.length) query.categories = defaults.categories ?? categories;
  if (brands.length) query.brands = brands;
  if (tags.length) query.tags = tags;
  // Price params arrive in euros for readable URLs; the domain works in cents.
  if (minEuros.success) query.minPrice = Math.round(minEuros.data * 100);
  if (maxEuros.success) query.maxPrice = Math.round(maxEuros.data * 100);
  if (first(params.sale) === '1') query.onSale = true;
  if (first(params.stock) === '1') query.inStock = true;

  return query;
}

/** Serialises a query back to a URL string, omitting defaults for clean links. */
export function serialiseProductQuery(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.categories?.length) params.set('category', query.categories.join(','));
  if (query.brands?.length) params.set('brand', query.brands.join(','));
  if (query.tags?.length) params.set('tag', query.tags.join(','));
  if (typeof query.minPrice === 'number') params.set('min', String(query.minPrice / 100));
  if (typeof query.maxPrice === 'number') params.set('max', String(query.maxPrice / 100));
  if (query.onSale) params.set('sale', '1');
  if (query.inStock) params.set('stock', '1');
  if (query.sort && query.sort !== 'featured') params.set('sort', query.sort);
  if (query.page && query.page > 1) params.set('page', String(query.page));
  const search = params.toString();
  return search ? `?${search}` : '';
}

/** True when the visitor has narrowed the catalogue in any way. */
export function hasActiveFilters(query: ProductQuery): boolean {
  return Boolean(
    query.q ||
      query.categories?.length ||
      query.brands?.length ||
      query.tags?.length ||
      typeof query.minPrice === 'number' ||
      typeof query.maxPrice === 'number' ||
      query.onSale ||
      query.inStock,
  );
}
