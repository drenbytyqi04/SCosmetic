import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PackageSearch } from 'lucide-react';
import { Pagination } from '@/components/products/pagination';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductSort } from '@/components/products/product-sort';
import {
  ActiveFilters,
  MobileFilters,
  ProductFilters,
} from '@/components/products/product-filters';
import { FilterSidebarSkeleton } from '@/components/products/product-skeletons';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StructuredData } from '@/components/shared/structured-data';
import { getFacets, getProducts } from '@/lib/products/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, collectionSchema } from '@/lib/seo/structured-data';
import {
  hasActiveFilters,
  parseProductQuery,
  serialiseProductQuery,
  type RawSearchParams,
} from '@/lib/validations/product-query';
import { pluralise } from '@/lib/utils/format';

/**
 * Shop — the main catalogue view.
 *
 * Filtering, sorting and pagination all happen on the server from the URL, so the
 * page ships almost no JavaScript beyond the filter controls themselves. Every state
 * is a real, shareable URL.
 */

interface ShopPageProps {
  searchParams: Promise<RawSearchParams>;
}

/** Copy varies by entry point: a search, a tag rail, or the full catalogue. */
function describeView(params: RawSearchParams): { title: string; description: string } {
  const query = typeof params.q === 'string' ? params.q : undefined;
  const tag = typeof params.tag === 'string' ? params.tag : undefined;

  if (query) {
    return {
      title: `Search: “${query}”`,
      description: 'Matches across product names, brands, shades and ingredient lists.',
    };
  }
  if (tag === 'bestseller') {
    return {
      title: 'Bestsellers',
      description: 'The products our clients reorder most, ranked by rating.',
    };
  }
  if (tag === 'newArrival') {
    return {
      title: 'New in',
      description: 'Recent additions to the catalogue, newest first.',
    };
  }
  if (tag === 'featured') {
    return { title: 'The edit', description: 'Our current picks across every category.' };
  }
  if (params.sale === '1') {
    return { title: 'On sale', description: 'Everything currently reduced, while stock lasts.' };
  }

  return {
    title: 'All products',
    description:
      'The complete catalogue — skincare, complexion, lips, eyes, fragrance, tools and body.',
  };
}

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const view = describeView(params);
  const query = parseProductQuery(params);

  return buildMetadata({
    title: view.title,
    description: view.description,
    path: `/shop${serialiseProductQuery(query)}`,
    // Filtered and paginated permutations are near-duplicates; only the clean
    // /shop view should compete in the index.
    noIndex: hasActiveFilters(query) || (query.page ?? 1) > 1,
  });
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const view = describeView(params);
  const query = parseProductQuery(params);

  const [result, facets] = await Promise.all([getProducts(query), getFacets()]);
  const filtersActive = hasActiveFilters(query);

  const buildPageHref = (page: number) =>
    `/shop${serialiseProductQuery({ ...query, page })}`;

  const activeFilterCount =
    (query.categories?.length ?? 0) +
    (query.brands?.length ?? 0) +
    (query.tags?.length ?? 0) +
    (typeof query.minPrice === 'number' || typeof query.maxPrice === 'number' ? 1 : 0) +
    (query.onSale ? 1 : 0) +
    (query.inStock ? 1 : 0);

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title={view.title}
        description={view.description}
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
        ]}
      />

      <div className="container-page py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
          {/* Desktop filter rail */}
          <aside aria-labelledby="filters-heading" className="hidden lg:block">
            <h2 id="filters-heading" className="mb-4 text-xs font-medium tracking-[0.14em] uppercase">
              Refine
            </h2>
            <Suspense fallback={<FilterSidebarSkeleton />}>
              <ProductFilters facets={facets} />
            </Suspense>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase" aria-live="polite">
                  {pluralise(result.total, 'product')}
                  {result.totalPages > 1 && ` · page ${result.page} of ${result.totalPages}`}
                </p>

                <div className="flex items-center gap-2">
                  <Suspense fallback={null}>
                    <MobileFilters facets={facets} activeCount={activeFilterCount} />
                  </Suspense>
                  <Suspense fallback={null}>
                    <ProductSort />
                  </Suspense>
                </div>
              </div>

              {filtersActive && (
                <Suspense fallback={null}>
                  <ActiveFilters facets={facets} />
                </Suspense>
              )}
            </div>

            <ProductGrid
              products={result.items}
              priorityCount={2}
              columns={4}
              emptyState={
                <EmptyState
                  icon={PackageSearch}
                  title={
                    query.q ? `Nothing matches “${query.q}”` : 'No products match those filters'
                  }
                  description={
                    query.q
                      ? 'Try a broader term — a brand, a category, or an ingredient like “ceramide”.'
                      : 'Try removing a filter or widening the price range.'
                  }
                  action={{ label: 'Clear all filters', href: '/shop' }}
                  secondaryAction={{ label: 'Browse categories', href: '/categories' }}
                />
              }
            />

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={buildPageHref}
              className="mt-14"
            />
          </div>
        </div>
      </div>

      <StructuredData
        data={[
          collectionSchema({
            name: view.title,
            description: view.description,
            path: '/shop',
            products: result.items,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
          ]),
        ]}
      />
    </>
  );
}
