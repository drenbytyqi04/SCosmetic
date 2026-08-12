import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { getCategories } from '@/lib/products/queries';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

/**
 * 404. Offers a genuine way forward rather than a dead end — the category list is
 * the most useful thing to hand someone who followed a stale link.
 */
export default async function NotFound() {
  const categories = await getCategories();

  return (
    <div className="container-page py-16 lg:py-24">
      <EmptyState
        icon={Compass}
        title="We could not find that page"
        description="The link may be out of date, or the product may have been retired. Everything currently in stock is one click away."
        action={{ label: 'Shop all products', href: '/shop' }}
        secondaryAction={{ label: 'Back to home', href: '/' }}
      >
        <div className="mx-auto max-w-lg">
          <p className="eyebrow mb-4 block">Or start with a category</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="inline-flex rounded-full border border-border-strong bg-surface px-4 py-2 text-xs tracking-[0.08em] text-foreground uppercase transition-colors hover:bg-surface-muted"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </EmptyState>
    </div>
  );
}
