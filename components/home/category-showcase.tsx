import { CategoryCard } from '@/components/products/category-card';
import { SectionHeading } from '@/components/shared/section-heading';
import { getCategories, getCategoryCounts } from '@/lib/products/queries';

/**
 * Category grid.
 *
 * A Server Component that reads the catalogue directly — no client fetching, no
 * loading state needed, and the counts are always accurate.
 */
export async function CategoryShowcase() {
  const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()]);
  const [lead, ...rest] = categories;

  if (!lead) return null;

  return (
    <section aria-labelledby="categories-heading" className="container-page py-16 lg:py-24">
      <SectionHeading
        eyebrow="Shop by category"
        title="Find your ritual"
        description="Seven edits, each built around what the formula actually does."
        action={{ label: 'All categories', href: '/categories' }}
        className="mb-10"
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* The lead tile runs full height on desktop; the remainder stack beside it. */}
        <CategoryCard
          category={lead}
          productCount={counts[lead.slug]}
          size="lg"
          priority
          className="lg:row-span-2 lg:aspect-auto lg:min-h-[34rem]"
        />

        {rest.slice(0, 4).map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            productCount={counts[category.slug]}
          />
        ))}
      </div>
    </section>
  );
}
