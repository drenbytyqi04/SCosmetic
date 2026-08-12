import 'server-only';

import { createId, store } from '@/lib/db/store';
import { categories as seedCategories } from '@/lib/products/data/categories';
import { commerceConfig } from '@/lib/config/site';
import { matchesSearch, rankSearchResults } from '@/lib/products/search';
import {
  prismaCategoryRepository,
  prismaProductRepository,
} from '@/lib/products/prisma-repository';
import type {
  Category,
  CategorySlug,
  Paginated,
  Product,
  ProductFacets,
  ProductQuery,
} from '@/types';

/**
 * The catalogue data-access contract.
 *
 * Pages and route handlers depend on this interface, never on the underlying
 * store. A Prisma implementation only has to satisfy the same signatures.
 */
export interface ProductRepository {
  list(query?: ProductQuery): Promise<Paginated<Product>>;
  findBySlug(slug: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findManyByIds(ids: string[]): Promise<Product[]>;
  search(term: string, limit?: number): Promise<Product[]>;
  facets(scope?: Pick<ProductQuery, 'categories'>): Promise<ProductFacets>;
  related(slug: string, limit?: number): Promise<Product[]>;
  allSlugs(): Promise<string[]>;
  brands(): Promise<string[]>;
  create(input: NewProduct): Promise<Product>;
  update(id: string, input: ProductUpdate): Promise<Product | null>;
  remove(id: string): Promise<boolean>;
  adjustStock(id: string, delta: number): Promise<Product | null>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  findBySlug(slug: string): Promise<Category | null>;
  counts(): Promise<Record<CategorySlug, number>>;
}

export type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type ProductUpdate = Partial<NewProduct>;

/** Effective price: sale price when present, otherwise list price. */
export function effectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}

/* ------------------------------------------------------------------ *
 * Query helpers — pure functions so they are trivially testable and
 * can be ported to SQL predicates one at a time.
 * ------------------------------------------------------------------ */

function applyFilters(items: Product[], query: ProductQuery): Product[] {
  const { q, categories, brands, minPrice, maxPrice, onSale, inStock, tags } = query;

  return items.filter((product) => {
    if (q && q.trim() && !matchesSearch(product, q)) return false;
    if (categories?.length && !categories.includes(product.category)) return false;
    if (brands?.length && !brands.includes(product.brand)) return false;

    const price = effectivePrice(product);
    if (typeof minPrice === 'number' && price < minPrice) return false;
    if (typeof maxPrice === 'number' && price > maxPrice) return false;

    if (onSale && product.salePrice === undefined) return false;
    if (inStock && product.stock <= 0) return false;
    if (tags?.length && !tags.some((tag) => product[tag])) return false;

    return true;
  });
}

function applySort(items: Product[], query: ProductQuery): Product[] {
  const sorted = [...items];
  const sort = query.sort ?? 'featured';

  switch (sort) {
    case 'price-asc':
      sorted.sort(
        (a, b) => effectivePrice(a) - effectivePrice(b) || a.name.localeCompare(b.name),
      );
      break;
    case 'price-desc':
      sorted.sort(
        (a, b) => effectivePrice(b) - effectivePrice(a) || a.name.localeCompare(b.name),
      );
      break;
    case 'newest':
      sorted.sort(
        (a, b) =>
          Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.name.localeCompare(b.name),
      );
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name));
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'featured':
    default:
      if (query.q?.trim()) {
        return rankSearchResults(sorted, query.q);
      } else {
        // Merchandised default: featured first, then bestsellers, then rating.
        const weight = (product: Product) =>
          (product.featured ? 4 : 0) +
          (product.bestseller ? 2 : 0) +
          (product.newArrival ? 1 : 0);
        sorted.sort(
          (a, b) =>
            weight(b) - weight(a) ||
            (b.rating ?? 0) - (a.rating ?? 0) ||
            a.name.localeCompare(b.name),
        );
      }
      break;
  }

  // Out-of-stock items always sink to the bottom of any ordering.
  return sorted.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
}

function paginate<T>(items: T[], page: number, perPage: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
  };
}

/* ------------------------------------------------------------------ *
 * In-memory implementation
 * ------------------------------------------------------------------ */

const clone = <T>(value: T): T => structuredClone(value);

export const memoryProductRepository: ProductRepository = {
  async list(query = {}) {
    const filtered = applyFilters(store.products, query);
    const sorted = applySort(filtered, query);
    const result = paginate(
      sorted,
      query.page ?? 1,
      query.perPage ?? commerceConfig.productsPerPage,
    );
    return { ...result, items: clone(result.items) };
  },

  async findBySlug(slug) {
    const found = store.products.find((product) => product.slug === slug);
    return found ? clone(found) : null;
  },

  async findById(id) {
    const found = store.products.find((product) => product.id === id);
    return found ? clone(found) : null;
  },

  async findManyByIds(ids) {
    const wanted = new Set(ids);
    return clone(store.products.filter((product) => wanted.has(product.id)));
  },

  async search(term, limit = 8) {
    if (!term.trim()) return [];
    const matches = rankSearchResults(
      store.products.filter((product) => matchesSearch(product, term)),
      term,
    ).slice(0, limit);
    return clone(matches);
  },

  async facets(scope) {
    const scoped = scope?.categories?.length
      ? store.products.filter((product) => scope.categories?.includes(product.category))
      : store.products;

    const brandCounts = new Map<string, number>();
    const categoryCounts = new Map<CategorySlug, number>();
    let min = Number.POSITIVE_INFINITY;
    let max = 0;

    for (const product of scoped) {
      brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
      categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
      const price = effectivePrice(product);
      min = Math.min(min, price);
      max = Math.max(max, price);
    }

    const categoryLabel = new Map(seedCategories.map((c) => [c.slug, c.name]));

    return {
      brands: [...brandCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value)),
      categories: seedCategories
        .filter((category) => categoryCounts.has(category.slug))
        .map((category) => ({
          value: category.slug,
          label: categoryLabel.get(category.slug) ?? category.slug,
          count: categoryCounts.get(category.slug) ?? 0,
        })),
      priceRange: {
        min: Number.isFinite(min) ? Math.floor(min / 100) * 100 : 0,
        max: max > 0 ? Math.ceil(max / 100) * 100 : 10000,
      },
    };
  },

  async related(slug, limit = 4) {
    const product = store.products.find((candidate) => candidate.slug === slug);
    if (!product) return [];

    const sameCategory = store.products.filter(
      (candidate) => candidate.id !== product.id && candidate.category === product.category,
    );
    const sameBrand = store.products.filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.brand === product.brand &&
        candidate.category !== product.category,
    );

    const pool = [...sameCategory, ...sameBrand].filter(
      (candidate, index, all) => all.findIndex((other) => other.id === candidate.id) === index,
    );

    return clone(
      pool
        .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, limit),
    );
  },

  async allSlugs() {
    return store.products.map((product) => product.slug);
  },

  async brands() {
    return [...new Set(store.products.map((product) => product.brand))].sort((a, b) =>
      a.localeCompare(b),
    );
  },

  async create(input) {
    const now = new Date().toISOString();
    const product: Product = { ...input, id: createId('prd'), createdAt: now, updatedAt: now };
    store.products.unshift(product);
    return clone(product);
  },

  async update(id, input) {
    const index = store.products.findIndex((product) => product.id === id);
    const existing = store.products[index];
    if (index === -1 || !existing) return null;

    const next: Product = { ...existing, ...input, updatedAt: new Date().toISOString() };
    // An explicitly cleared sale price must actually be removed, not merged over.
    if (input.salePrice === undefined && 'salePrice' in input) delete next.salePrice;
    store.products[index] = next;
    return clone(next);
  },

  async remove(id) {
    const index = store.products.findIndex((product) => product.id === id);
    if (index === -1) return false;
    store.products.splice(index, 1);
    return true;
  },

  async adjustStock(id, delta) {
    const product = store.products.find((candidate) => candidate.id === id);
    if (!product) return null;
    product.stock = Math.max(0, product.stock + delta);
    product.updatedAt = new Date().toISOString();
    return clone(product);
  },
};

export const memoryCategoryRepository: CategoryRepository = {
  async list() {
    return clone([...store.categories].sort((a, b) => a.position - b.position));
  },

  async findBySlug(slug) {
    const found = store.categories.find((category) => category.slug === slug);
    return found ? clone(found) : null;
  },

  async counts() {
    const counts = Object.fromEntries(
      store.categories.map((category) => [category.slug, 0]),
    ) as Record<CategorySlug, number>;

    for (const product of store.products) {
      if (product.category in counts) counts[product.category] += 1;
    }
    return counts;
  },
};

/**
 * Repository factories.
 *
 * `DATA_SOURCE=prisma` selects Postgres; anything else serves the in-memory seed
 * catalogue.
 *
 * Importing the Prisma module is safe even when it is not selected: the client in
 * `lib/db/prisma.ts` is created on first query, so an unused Postgres path never opens a
 * connection pool or demands a DATABASE_URL.
 */
export function isPrismaDataSource(): boolean {
  return process.env.DATA_SOURCE === 'prisma';
}

export function getProductRepository(): ProductRepository {
  return isPrismaDataSource() ? prismaProductRepository : memoryProductRepository;
}

export function getCategoryRepository(): CategoryRepository {
  return isPrismaDataSource() ? prismaCategoryRepository : memoryCategoryRepository;
}
