import 'server-only';

import { cache } from 'react';
import { getCategoryRepository, getProductRepository } from '@/lib/products/repository';
import type { Category, CategorySlug, Paginated, Product, ProductFacets, ProductQuery } from '@/types';

/**
 * Server-side read API used by pages and route handlers.
 *
 * `cache()` deduplicates identical reads within a single request — a category page
 * that needs the category, its products and its facets hits the store once per
 * distinct call rather than once per component.
 */

export const getProducts = cache(
  async (query: ProductQuery = {}): Promise<Paginated<Product>> =>
    getProductRepository().list(query),
);

export const getProductBySlug = cache(
  async (slug: string): Promise<Product | null> => getProductRepository().findBySlug(slug),
);

export const getProductById = cache(
  async (id: string): Promise<Product | null> => getProductRepository().findById(id),
);

export const getProductsByIds = cache(
  async (ids: string[]): Promise<Product[]> =>
    ids.length ? getProductRepository().findManyByIds(ids) : [],
);

export const searchProducts = cache(
  async (term: string, limit = 8): Promise<Product[]> =>
    getProductRepository().search(term, limit),
);

export const getFacets = cache(
  async (categories?: CategorySlug[]): Promise<ProductFacets> =>
    getProductRepository().facets(categories?.length ? { categories } : undefined),
);

export const getRelatedProducts = cache(
  async (slug: string, limit = 4): Promise<Product[]> =>
    getProductRepository().related(slug, limit),
);

export const getAllProductSlugs = cache(
  async (): Promise<string[]> => getProductRepository().allSlugs(),
);

export const getBrands = cache(async (): Promise<string[]> => getProductRepository().brands());

export const getCategories = cache(
  async (): Promise<Category[]> => getCategoryRepository().list(),
);

export const getCategoryBySlug = cache(
  async (slug: string): Promise<Category | null> => getCategoryRepository().findBySlug(slug),
);

export const getCategoryCounts = cache(
  async (): Promise<Record<CategorySlug, number>> => getCategoryRepository().counts(),
);

/* --------------------------- Merchandising slices -------------------------- */

export const getFeaturedProducts = cache(async (limit = 4): Promise<Product[]> => {
  const { items } = await getProducts({ tags: ['featured'], perPage: limit, sort: 'featured' });
  return items;
});

export const getBestsellers = cache(async (limit = 8): Promise<Product[]> => {
  const { items } = await getProducts({ tags: ['bestseller'], perPage: limit, sort: 'rating' });
  return items;
});

export const getNewArrivals = cache(async (limit = 4): Promise<Product[]> => {
  const { items } = await getProducts({ tags: ['newArrival'], perPage: limit, sort: 'newest' });
  return items;
});

export const getSaleProducts = cache(async (limit = 4): Promise<Product[]> => {
  const { items } = await getProducts({ onSale: true, perPage: limit, sort: 'featured' });
  return items;
});
