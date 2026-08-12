import 'server-only';

import { Prisma } from '@/lib/db/generated/client';
import { getPrisma } from '@/lib/db/prisma';
import { commerceConfig } from '@/lib/config/site';
import type {
  CategoryRepository,
  NewProduct,
  ProductRepository,
  ProductUpdate,
} from '@/lib/products/repository';
import { rankSearchResults, searchTokens } from '@/lib/products/search';
import type { Category, CategorySlug, Product, ProductQuery } from '@/types';

/**
 * Postgres implementation of the catalogue repositories.
 *
 * Returns the same domain types as the in-memory implementation, so pages and route
 * handlers cannot tell the two apart. Behaviour is matched deliberately, including the
 * two orderings that need help from the schema: the sale-aware effective price and
 * sold-out products sinking to the bottom.
 */

/** Everything a `Product` needs, in one round trip. */
const productInclude = {
  shades: { orderBy: { position: 'asc' } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

/** Maps a database row onto the domain type, dropping nulls rather than passing them on. */
function toProduct(row: ProductRow): Product {
  const product: Product = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.categorySlug,
    tagline: row.tagline,
    description: row.description,
    details: row.details,
    price: row.price,
    images: row.images,
    stock: row.stock,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  // The domain type uses optional properties, not nullable ones, so an absent value is
  // omitted rather than set to null.
  if (row.salePrice !== null) product.salePrice = row.salePrice;
  if (row.howToUse !== null) product.howToUse = row.howToUse;
  if (row.size !== null) product.size = row.size;
  if (row.rating !== null) product.rating = row.rating;
  if (row.reviewCount !== null) product.reviewCount = row.reviewCount;
  if (row.ingredients.length) product.ingredients = row.ingredients;
  if (row.benefits.length) product.benefits = row.benefits;
  if (row.featured) product.featured = true;
  if (row.bestseller) product.bestseller = true;
  if (row.newArrival) product.newArrival = true;
  if (row.shades.length) {
    product.shades = row.shades.map((shade) => ({
      id: shade.key,
      name: shade.name,
      hex: shade.hex,
    }));
  }

  return product;
}

/**
 * Write payload shared by create and update.
 *
 * Deliberately does not set `effectivePrice` or `inStock`. A BEFORE INSERT/UPDATE trigger
 * (see the `product_derived_columns_trigger` migration) derives both from
 * `price`/`salePrice`/`stock`, so no writer — this repository, the seed, or a manual
 * UPDATE — can leave them stale.
 */
function toWriteData(input: NewProduct | ProductUpdate) {
  const data: Prisma.ProductUncheckedUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.brand !== undefined) data.brand = input.brand;
  if (input.category !== undefined) data.categorySlug = input.category;
  if (input.tagline !== undefined) data.tagline = input.tagline;
  if (input.description !== undefined) data.description = input.description;
  if (input.details !== undefined) data.details = input.details;
  if (input.howToUse !== undefined) data.howToUse = input.howToUse ?? null;
  if (input.images !== undefined) data.images = input.images;
  if (input.ingredients !== undefined) data.ingredients = input.ingredients ?? [];
  if (input.benefits !== undefined) data.benefits = input.benefits ?? [];
  if (input.rating !== undefined) data.rating = input.rating ?? null;
  if (input.reviewCount !== undefined) data.reviewCount = input.reviewCount ?? 0;
  if (input.size !== undefined) data.size = input.size ?? null;
  if (input.featured !== undefined) data.featured = input.featured ?? false;
  if (input.bestseller !== undefined) data.bestseller = input.bestseller ?? false;
  if (input.newArrival !== undefined) data.newArrival = input.newArrival ?? false;

  if (input.price !== undefined) data.price = input.price;
  if ('salePrice' in input) data.salePrice = input.salePrice ?? null;
  if (input.stock !== undefined) data.stock = input.stock;

  return data;
}

/* ------------------------------------------------------------------ *
 * Query building
 * ------------------------------------------------------------------ */

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  const and: Prisma.ProductWhereInput[] = [];

  if (query.categories?.length) where.categorySlug = { in: query.categories };
  if (query.brands?.length) where.brand = { in: query.brands };
  if (query.onSale) where.salePrice = { not: null };
  if (query.inStock) where.inStock = true;

  if (typeof query.minPrice === 'number' || typeof query.maxPrice === 'number') {
    where.effectivePrice = {
      ...(typeof query.minPrice === 'number' ? { gte: query.minPrice } : {}),
      ...(typeof query.maxPrice === 'number' ? { lte: query.maxPrice } : {}),
    };
  }

  // Merchandising flags are an OR: `?tag=featured,bestseller` means either.
  if (query.tags?.length) {
    and.push({ OR: query.tags.map((tag) => ({ [tag]: true })) });
  }

  // Every search token must appear in at least one searchable field.
  for (const token of searchTokens(query.q)) {
    const clauses: Prisma.ProductWhereInput[] = [
      { name: { contains: token, mode: 'insensitive' } },
      { brand: { contains: token, mode: 'insensitive' } },
      { tagline: { contains: token, mode: 'insensitive' } },
      { description: { contains: token, mode: 'insensitive' } },
      { shades: { some: { name: { contains: token, mode: 'insensitive' } } } },
      { ingredients: { has: token } },
    ];

    /*
     * `categorySlug` is an enum column, and Postgres rejects a comparison against a
     * value outside the enum — so the clause is only added when the token actually names
     * a category. Without this guard, searching for any ordinary word throws instead of
     * returning results.
     */
    const asCategory = asCategorySlug(token);
    if (asCategory) clauses.push({ categorySlug: asCategory });

    and.push({ OR: clauses });
  }

  if (and.length) where.AND = and;
  return where;
}

/**
 * Ordering.
 *
 * `inStock: 'desc'` always leads, so sold-out products sink to the bottom of every
 * ordering — matching the in-memory implementation.
 *
 * The default "featured" ordering is a lexicographic sort on the three merchandising
 * flags. That is exactly equivalent to the weighted score the in-memory version uses
 * (featured 4, bestseller 2, newArrival 1), because those weights make the score the
 * binary number formed by the three booleans.
 */
function buildOrderBy(query: ProductQuery): Prisma.ProductOrderByWithRelationInput[] {
  const inStockFirst: Prisma.ProductOrderByWithRelationInput = { inStock: 'desc' };

  switch (query.sort) {
    case 'price-asc':
      return [inStockFirst, { effectivePrice: 'asc' }, { name: 'asc' }];
    case 'price-desc':
      return [inStockFirst, { effectivePrice: 'desc' }, { name: 'asc' }];
    case 'newest':
      return [inStockFirst, { createdAt: 'desc' }, { name: 'asc' }];
    case 'rating':
      return [inStockFirst, { rating: 'desc' }, { name: 'asc' }];
    case 'name-asc':
      return [inStockFirst, { name: 'asc' }];
    case 'featured':
    default:
      return [
        inStockFirst,
        { featured: 'desc' },
        { bestseller: 'desc' },
        { newArrival: 'desc' },
        { rating: 'desc' },
        { name: 'asc' },
      ];
  }
}

/* ------------------------------------------------------------------ *
 * Implementation
 * ------------------------------------------------------------------ */

export const prismaProductRepository: ProductRepository = {
  async list(query = {}) {
    const perPage = query.perPage ?? commerceConfig.productsPerPage;
    const where = buildWhere(query);

    /*
     * A search request is ranked by *where* the term matched (exact name beats a
     * mention in the description), which SQL cannot express through `orderBy`. Matching
     * rows are fetched and ranked in the application instead.
     *
     * That is safe because a search result set is small by nature. Swap this branch for
     * Postgres full-text search (`to_tsvector`) or `pg_trgm` when the catalogue is large
     * enough for it to matter; the ranking helper is shared with the in-memory
     * implementation, so behaviour stays identical either way.
     */
    if (query.q?.trim() && (query.sort ?? 'featured') === 'featured') {
      const rows = await getPrisma().product.findMany({
        where,
        include: productInclude,
        take: 500,
      });
      const ranked = rankSearchResults(rows.map(toProduct), query.q);
      const total = ranked.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const page = Math.min(Math.max(1, query.page ?? 1), totalPages);
      const start = (page - 1) * perPage;

      return { items: ranked.slice(start, start + perPage), total, page, perPage, totalPages };
    }

    const total = await getPrisma().product.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(Math.max(1, query.page ?? 1), totalPages);

    const rows = await getPrisma().product.findMany({
      where,
      include: productInclude,
      orderBy: buildOrderBy(query),
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { items: rows.map(toProduct), total, page, perPage, totalPages };
  },

  async findBySlug(slug) {
    const row = await getPrisma().product.findUnique({ where: { slug }, include: productInclude });
    return row ? toProduct(row) : null;
  },

  async findById(id) {
    const row = await getPrisma().product.findUnique({ where: { id }, include: productInclude });
    return row ? toProduct(row) : null;
  },

  async findManyByIds(ids) {
    if (!ids.length) return [];
    const rows = await getPrisma().product.findMany({
      where: { id: { in: ids } },
      include: productInclude,
    });
    return rows.map(toProduct);
  },

  async search(term, limit = 8) {
    if (!term.trim()) return [];
    const rows = await getPrisma().product.findMany({
      where: buildWhere({ q: term }),
      include: productInclude,
      take: 100,
    });
    return rankSearchResults(rows.map(toProduct), term).slice(0, limit);
  },

  async facets(scope) {
    const where: Prisma.ProductWhereInput = scope?.categories?.length
      ? { categorySlug: { in: scope.categories } }
      : {};

    // Three aggregates rather than loading the catalogue to count it in JavaScript.
    const [brandGroups, categoryGroups, priceRange, categoryRows] = await Promise.all([
      getPrisma().product.groupBy({ by: ['brand'], where, _count: { _all: true } }),
      getPrisma().product.groupBy({ by: ['categorySlug'], where, _count: { _all: true } }),
      getPrisma().product.aggregate({ where, _min: { effectivePrice: true }, _max: { effectivePrice: true } }),
      getPrisma().category.findMany({ orderBy: { position: 'asc' }, select: { slug: true, name: true } }),
    ]);

    const countBySlug = new Map(categoryGroups.map((g) => [g.categorySlug, g._count._all]));
    const min = priceRange._min.effectivePrice ?? 0;
    const max = priceRange._max.effectivePrice ?? 0;

    return {
      brands: brandGroups
        .map((group) => ({ value: group.brand, count: group._count._all }))
        .sort((a, b) => a.value.localeCompare(b.value)),
      categories: categoryRows
        .filter((category) => countBySlug.has(category.slug))
        .map((category) => ({
          value: category.slug,
          label: category.name,
          count: countBySlug.get(category.slug) ?? 0,
        })),
      priceRange: {
        min: min > 0 ? Math.floor(min / 100) * 100 : 0,
        max: max > 0 ? Math.ceil(max / 100) * 100 : 10000,
      },
    };
  },

  async related(slug, limit = 4) {
    const product = await getPrisma().product.findUnique({
      where: { slug },
      select: { id: true, categorySlug: true, brand: true },
    });
    if (!product) return [];

    const order: Prisma.ProductOrderByWithRelationInput[] = [
      { inStock: 'desc' },
      { rating: 'desc' },
    ];

    // Same category first; top up from the same brand in other categories.
    const sameCategory = await getPrisma().product.findMany({
      where: { id: { not: product.id }, categorySlug: product.categorySlug },
      include: productInclude,
      orderBy: order,
      take: limit,
    });

    if (sameCategory.length >= limit) return sameCategory.slice(0, limit).map(toProduct);

    const sameBrand = await getPrisma().product.findMany({
      where: {
        id: { notIn: [product.id, ...sameCategory.map((row) => row.id)] },
        brand: product.brand,
        categorySlug: { not: product.categorySlug },
      },
      include: productInclude,
      orderBy: order,
      take: limit - sameCategory.length,
    });

    return [...sameCategory, ...sameBrand].map(toProduct);
  },

  async allSlugs() {
    const rows = await getPrisma().product.findMany({ select: { slug: true } });
    return rows.map((row) => row.slug);
  },

  async brands() {
    const rows = await getPrisma().product.findMany({
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    });
    return rows.map((row) => row.brand);
  },

  async create(input) {
    const row = await getPrisma().product.create({
      data: {
        ...(toWriteData(input) as Prisma.ProductUncheckedCreateInput),
        // Shades live in their own table; the domain type nests them.
        shades: input.shades?.length
          ? {
              create: input.shades.map((shade, index) => ({
                key: shade.id,
                name: shade.name,
                hex: shade.hex,
                position: index,
              })),
            }
          : undefined,
      },
      include: productInclude,
    });
    return toProduct(row);
  },

  async update(id, input) {
    try {
      const row = await getPrisma().$transaction(async (tx) => {
        await tx.product.update({ where: { id }, data: toWriteData(input) });

        // Shades are replaced rather than merged: the submitted set is authoritative,
        // so a removed shade must disappear.
        if (input.shades !== undefined) {
          await tx.shade.deleteMany({ where: { productId: id } });
          if (input.shades?.length) {
            await tx.shade.createMany({
              data: input.shades.map((shade, index) => ({
                productId: id,
                key: shade.id,
                name: shade.name,
                hex: shade.hex,
                position: index,
              })),
            });
          }
        }

        return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
      });

      return toProduct(row);
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  },

  async remove(id) {
    try {
      await getPrisma().product.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) return false;
      throw error;
    }
  },

  async adjustStock(id, delta) {
    /*
     * One statement, so two concurrent adjustments cannot lose each other's write the way
     * a read-then-write would. `inStock` is left to the trigger.
     */
    const rows = await getPrisma().$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE "Product"
      SET stock = GREATEST(0, stock + ${delta}),
          "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING id
    `);

    if (!rows.length) return null;
    return this.findById(id);
  },
};

export const prismaCategoryRepository: CategoryRepository = {
  async list() {
    const rows = await getPrisma().category.findMany({ orderBy: { position: 'asc' } });
    return rows.map(toCategory);
  },

  async findBySlug(slug) {
    const parsed = asCategorySlug(slug);
    if (!parsed) return null;
    const row = await getPrisma().category.findUnique({ where: { slug: parsed } });
    return row ? toCategory(row) : null;
  },

  async counts() {
    const [categories, groups] = await Promise.all([
      getPrisma().category.findMany({ select: { slug: true } }),
      getPrisma().product.groupBy({ by: ['categorySlug'], _count: { _all: true } }),
    ]);

    const counted = new Map(groups.map((group) => [group.categorySlug, group._count._all]));
    return Object.fromEntries(
      categories.map((category) => [category.slug, counted.get(category.slug) ?? 0]),
    ) as Record<CategorySlug, number>;
  },
};

function toCategory(row: {
  id: string;
  slug: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  image: string;
  position: number;
}): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    image: row.image,
    position: row.position,
  };
}

const CATEGORY_SLUGS: CategorySlug[] = [
  'lips',
  'complexion',
  'skincare',
  'eyes',
  'fragrance',
  'tools',
  'body',
];

/** Guards an arbitrary string before it reaches an enum-typed column. */
function asCategorySlug(value: string): CategorySlug | null {
  return (CATEGORY_SLUGS as string[]).includes(value) ? (value as CategorySlug) : null;
}

/** P2025 is Prisma's "record not found" — a null result here, not an exception. */
function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2025'
  );
}
