import { ProductGrid } from '@/components/products/product-grid';
import { SectionHeading } from '@/components/shared/section-heading';
import { getBestsellers, getFeaturedProducts, getNewArrivals } from '@/lib/products/queries';

/**
 * Merchandised product rails.
 *
 * Each rail is its own async Server Component so the homepage can stream them
 * independently — a slow query for one band never blocks the rest of the page.
 */

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(4);
  if (!products.length) return null;

  return (
    <section aria-labelledby="featured-heading" className="container-page py-16 lg:py-24">
      <SectionHeading
        eyebrow="The edit"
        title="What we would buy first"
        description="Four products that answer the questions we get asked most."
        action={{ label: 'Shop all', href: '/shop' }}
        className="mb-10"
      />
      <ProductGrid products={products} columns={4} />
    </section>
  );
}

export async function BestsellerRail() {
  const products = await getBestsellers(8);
  if (!products.length) return null;

  return (
    <section aria-labelledby="bestsellers-heading" className="bg-surface py-16 lg:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Reordered most"
          title="Bestsellers"
          description="The products that come back to the basket again and again."
          action={{ label: 'All bestsellers', href: '/shop?tag=bestseller' }}
          className="mb-10"
        />
        <ProductGrid products={products} columns={4} />
      </div>
    </section>
  );
}

export async function NewArrivalsRail() {
  const products = await getNewArrivals(4);
  if (!products.length) return null;

  return (
    <section aria-labelledby="new-heading" className="container-page py-16 lg:py-24">
      <SectionHeading
        eyebrow="Just landed"
        title="New in"
        description="Recent additions, still in their first season with us."
        action={{ label: 'See all new', href: '/shop?tag=newArrival' }}
        className="mb-10"
      />
      <ProductGrid products={products} columns={4} />
    </section>
  );
}
