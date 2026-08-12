import { PackageSearch } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils/cn';
import type { Product } from '@/types';

/**
 * Responsive product grid.
 *
 * Two columns from 320px up — a single column wastes the viewport on the phones most
 * of this traffic arrives on — widening to four on desktop.
 */
export interface ProductGridProps {
  products: Product[];
  /** How many leading images to mark as priority (above the fold). */
  priorityCount?: number;
  columns?: 2 | 3 | 4;
  compact?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
};

export function ProductGrid({
  products,
  priorityCount = 0,
  columns = 4,
  compact = false,
  emptyState,
  className,
}: ProductGridProps) {
  if (!products.length) {
    return (
      emptyState ?? (
        <EmptyState
          icon={PackageSearch}
          title="No products match that combination"
          description="Try removing a filter or widening the price range — the full catalogue is only a click away."
          action={{ label: 'View all products', href: '/shop' }}
        />
      )
    );
  }

  return (
    <ul
      className={cn(
        'grid gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12',
        COLUMN_CLASSES[columns],
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          <ProductCard
            product={product}
            priority={index < priorityCount}
            compact={compact}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}
