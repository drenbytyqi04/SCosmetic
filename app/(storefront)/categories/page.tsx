import type { Metadata } from 'next';
import { CategoryCard } from '@/components/products/category-card';
import { PageHeader } from '@/components/shared/page-header';
import { StructuredData } from '@/components/shared/structured-data';
import { getCategories, getCategoryCounts } from '@/lib/products/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/structured-data';

export const metadata: Metadata = buildMetadata({
  title: 'Categories',
  description:
    'Seven edits across skincare, complexion, lips, eyes, fragrance, tools and body — each built around what the formula actually does.',
  path: '/categories',
});

/** Category index. Static: the taxonomy changes far less often than stock does. */
export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()]);

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Browse"
        title="Categories"
        description="Seven edits, each built around what the formula actually does."
        trail={trail}
      />

      <div className="container-page py-10 lg:py-16">
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {categories.map((category, index) => (
            <li key={category.slug}>
              <CategoryCard
                category={category}
                productCount={counts[category.slug]}
                priority={index < 3}
                className="h-full"
              />
            </li>
          ))}
        </ul>
      </div>

      <StructuredData data={breadcrumbSchema(trail)} />
    </>
  );
}
