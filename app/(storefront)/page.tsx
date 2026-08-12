import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CategoryShowcase } from '@/components/home/category-showcase';
import { EditorialSection } from '@/components/home/editorial-section';
import {
  BestsellerRail,
  FeaturedProducts,
  NewArrivalsRail,
} from '@/components/home/featured-products';
import { HeroSection } from '@/components/home/hero-section';
import { InstagramGallery } from '@/components/home/instagram-gallery';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { ValueProps } from '@/components/home/value-props';
import { SectionHeading } from '@/components/shared/section-heading';
import { ProductGridSkeleton } from '@/components/products/product-skeletons';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/config/site';

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: '/',
});

/**
 * Homepage.
 *
 * Fully server-rendered. The product rails are wrapped in Suspense so the hero and
 * category grid paint immediately and each rail streams in as its data resolves,
 * rather than the whole page waiting on the slowest query.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValueProps />

      <Suspense
        fallback={
          <div className="container-page py-16 lg:py-24">
            <ProductGridSkeleton count={4} label="Loading the edit" />
          </div>
        }
      >
        <FeaturedProducts />
      </Suspense>

      <CategoryShowcase />

      <EditorialSection
        eyebrow="Our approach"
        title="We read the ingredient list so you do not have to"
        paragraphs={[
          'Every product here has been through the same check: what is the active, at what percentage, and is there anything in the formula that undermines it. If a claim is not supported by the ingredient list, we do not stock the product.',
          'That is why the catalogue is short. Around thirty products, revisited each season — enough for a complete routine, not enough to get lost in.',
        ]}
        image="/images/editorial/ritual.png"
        imageAlt="A serum bottle and cream jar arranged on a linen surface in morning light"
        tone="#EEE5D9"
        href="/about"
        linkLabel="Read our story"
      />

      <Suspense
        fallback={
          <div className="bg-surface py-16 lg:py-24">
            <div className="container-page">
              <ProductGridSkeleton count={8} label="Loading bestsellers" />
            </div>
          </div>
        }
      >
        <BestsellerRail />
      </Suspense>

      <EditorialSection
        eyebrow="Fragrance"
        title="Composed to sit close to the skin"
        paragraphs={[
          'Our two eaux de parfum are made in small batches at 18% concentration and aged eight weeks before bottling. Both are built to project softly — this is fragrance for the person standing next to you, not for the room.',
          'Amber Cashmere is warm and resinous. White Fig & Neroli is green and bright. They layer well together.',
        ]}
        image="/images/editorial/atelier.png"
        imageAlt="A glass fragrance flacon lit from the side against a warm neutral backdrop"
        tone="#EBE4D8"
        href="/category/fragrance"
        linkLabel="Explore fragrance"
        reverse
      />

      <Suspense
        fallback={
          <div className="container-page py-16 lg:py-24">
            <ProductGridSkeleton count={4} label="Loading new arrivals" />
          </div>
        }
      >
        <NewArrivalsRail />
      </Suspense>

      <InstagramGallery />

      <section aria-labelledby="newsletter-heading" className="border-t border-border bg-surface">
        <div className="container-page py-16 lg:py-24">
          <div className="mx-auto max-w-xl">
            <SectionHeading
              eyebrow="Stay in touch"
              title="New arrivals, restocks, and honest reviews"
              description="Twice a month at most. We write it ourselves."
              align="center"
              className="mb-8"
            />
            <NewsletterForm source="homepage" layout="inline" />
          </div>
        </div>
      </section>
    </>
  );
}
