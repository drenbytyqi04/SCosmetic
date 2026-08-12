import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Pagination } from '@/components/products/pagination';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductSort } from '@/components/products/product-sort';
import {
  ActiveFilters,
  MobileFilters,
  ProductFilters,
} from '@/components/products/product-filters';
import {
  FilterSidebarSkeleton,
  ProductGridSkeleton,
} from '@/components/products/product-skeletons';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { StructuredData } from '@/components/shared/structured-data';
import { getCategories, getCategoryBySlug, getFacets, getProducts } from '@/lib/products/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, categorySchema } from '@/lib/seo/structured-data';
import {
  hasActiveFilters,
  parseProductQuery,
  serialiseProductQuery,
  type RawSearchParams,
} from '@/lib/validations/product-query';
import { categoryBlurDataUrl } from '@/lib/utils/image';
import { pluralise } from '@/lib/utils/format';
import type { Category, CategorySlug, ProductQuery } from '@/types';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category not found', robots: { index: false, follow: true } };
  }

  const query = parseProductQuery(rawParams, { categories: [category.slug] });

  return buildMetadata({
    title: `${category.name} — ${category.tagline}`,
    description: category.description,
    path: `/category/${category.slug}`,
    image: category.image,
    imageAlt: `${category.name} at COSMETICS.KS`,
    noIndex: hasActiveFilters({ ...query, categories: undefined }) || (query.page ?? 1) > 1,
  });
}

/**
 * Category listing.
 *
 * Same engine as /shop, with the category locked into the query. The category filter
 * group is hidden here because switching category is a navigation, not a filter.
 *
 * No `loading.tsx` in this segment on purpose — see the note on the product page. The
 * category lookup has to resolve before the response is committed so an unknown slug
 * returns a real 404; the product grid streams in behind Suspense.
 */
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const query = parseProductQuery(rawParams, { categories: [category.slug] });
  const facets = await getFacets([category.slug as CategorySlug]);

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: category.name, path: `/category/${category.slug}` },
  ];

  const buildPageHref = (page: number) =>
    `/category/${category.slug}${serialiseProductQuery({ ...query, categories: undefined, page })}`;

  const activeFilterCount =
    (query.brands?.length ?? 0) +
    (typeof query.minPrice === 'number' || typeof query.maxPrice === 'number' ? 1 : 0) +
    (query.onSale ? 1 : 0) +
    (query.inStock ? 1 : 0);

  return (
    <>
      {/* Category hero */}
      <header className="relative overflow-hidden border-b border-border bg-cream-200">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="100vw"
          priority
          placeholder="blur"
          blurDataURL={categoryBlurDataUrl(category.slug)}
          className="object-cover opacity-30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-cream-100 via-cream-100/85 to-cream-100/30"
        />

        <div className="relative container-page py-10 sm:py-14">
          <Breadcrumbs trail={trail} className="mb-5" />
          <span className="eyebrow">{category.tagline}</span>
          <h1 className="mt-2 font-serif text-3xl font-light text-foreground sm:text-4xl lg:text-display-sm">
            {category.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {category.description}
          </p>
        </div>
      </header>

      <div className="container-page py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
          <aside aria-labelledby="category-filters-heading" className="hidden lg:block">
            <h2
              id="category-filters-heading"
              className="mb-4 text-xs font-medium tracking-[0.14em] uppercase"
            >
              Refine
            </h2>
            <Suspense fallback={<FilterSidebarSkeleton />}>
              <ProductFilters facets={facets} lockedCategory />
            </Suspense>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
              <Suspense fallback={null}>
                <MobileFilters facets={facets} lockedCategory activeCount={activeFilterCount} />
              </Suspense>
              <Suspense fallback={null}>
                <ProductSort />
              </Suspense>
            </div>

            {activeFilterCount > 0 && (
              <Suspense fallback={null}>
                <ActiveFilters facets={facets} />
              </Suspense>
            )}

            <Suspense
              key={serialiseProductQuery(query)}
              fallback={<ProductGridSkeleton count={8} columns={4} label="Loading products" />}
            >
              <CategoryResults
                category={category}
                query={query}
                buildPageHref={buildPageHref}
                trail={trail}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * The filtered result set for a category.
 *
 * Split out of the page so the category lookup (and therefore the 404 decision) is
 * resolved before this streams in. The count, grid, pagination and structured data all
 * derive from the same query, so they belong together.
 */
async function CategoryResults({
  category,
  query,
  buildPageHref,
  trail,
}: {
  category: Category;
  query: ProductQuery;
  buildPageHref: (page: number) => string;
  trail: Array<{ name: string; path: string }>;
}) {
  const result = await getProducts(query);

  return (
    <>
      <p
        className="mb-6 text-xs tracking-[0.08em] text-muted-foreground uppercase"
        aria-live="polite"
      >
        {pluralise(result.total, 'product')}
        {result.totalPages > 1 && ` · page ${result.page} of ${result.totalPages}`}
      </p>

      <ProductGrid products={result.items} priorityCount={2} columns={4} />

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        buildHref={buildPageHref}
        className="mt-14"
      />

      <StructuredData data={[categorySchema(category, result.items), breadcrumbSchema(trail)]} />
    </>
  );
}
