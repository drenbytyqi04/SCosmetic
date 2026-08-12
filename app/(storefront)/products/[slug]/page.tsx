import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetails } from '@/components/products/product-details';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductGridSkeleton } from '@/components/products/product-skeletons';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { SectionHeading } from '@/components/shared/section-heading';
import { StructuredData } from '@/components/shared/structured-data';
import {
  getAllProductSlugs,
  getCategoryBySlug,
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/products/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, productSchema } from '@/lib/seo/structured-data';
import { truncate } from '@/lib/utils/format';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-renders every product at build time. The catalogue is small and changes
 * rarely, so static generation is the right default; `revalidate` below lets a price
 * or stock edit propagate without a redeploy.
 */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const revalidate = 3600;

/**
 * SEO is derived entirely from the product record — title, description, images and
 * price all come from the same data the page renders, so they cannot drift apart.
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product not found', robots: { index: false, follow: true } };
  }

  /*
   * Price and availability are published as Product JSON-LD (see `productSchema`)
   * rather than as `product:*` meta tags. Next's `other` field emits `name="…"`, but
   * the Open Graph product namespace is defined on `property="…"` — so those tags
   * would be malformed, and they would duplicate what the structured data already
   * states correctly.
   */
  return buildMetadata({
    title: `${product.name} — ${product.brand}`,
    description: truncate(`${product.tagline}. ${product.description}`, 160),
    path: `/products/${product.slug}`,
    image: product.images[0] ?? '/images/editorial/og.png',
    imageAlt: `${product.name} by ${product.brand}`,
    type: 'article',
  });
}

/**
 * Deliberately no `loading.tsx` in this segment.
 *
 * A segment-level loading file makes Next stream a shell before the page body runs,
 * which commits a 200 status — so `notFound()` for an unknown slug would render the
 * not-found page under a 200 and become a soft 404. The product lookup therefore
 * resolves before anything is sent, and the slower related-products rail streams in
 * behind its own Suspense boundary instead.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const category = await getCategoryBySlug(product.category);

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
    { name: product.name, path: `/products/${product.slug}` },
  ];

  return (
    <>
      <div className="container-page py-6 lg:py-10">
        <Breadcrumbs trail={trail} className="mb-8" />
        <ProductDetails product={product} />
      </div>

      <Suspense
        fallback={
          <div className="border-t border-border bg-surface">
            <div className="container-page py-16 lg:py-20">
              <ProductGridSkeleton count={4} columns={4} label="Loading related products" />
            </div>
          </div>
        }
      >
        <RelatedProducts slug={slug} category={category} />
      </Suspense>

      <StructuredData data={[productSchema(product), breadcrumbSchema(trail)]} />
    </>
  );
}

/** Related rail, split out so it streams in after the product itself is committed. */
async function RelatedProducts({
  slug,
  category,
}: {
  slug: string;
  category: Awaited<ReturnType<typeof getCategoryBySlug>>;
}) {
  const related = await getRelatedProducts(slug, 4);
  if (!related.length) return null;

  return (
    <section aria-labelledby="related-heading" className="border-t border-border bg-surface">
      <div className="container-page py-16 lg:py-20">
        <SectionHeading
          eyebrow="Pairs well with"
          title="You might also like"
          action={
            category
              ? { label: `All ${category.name.toLowerCase()}`, href: `/category/${category.slug}` }
              : undefined
          }
          className="mb-10"
        />
        <ProductGrid products={related} columns={4} />
      </div>
    </section>
  );
}
