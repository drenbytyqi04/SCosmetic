import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';

/**
 * Loading placeholders that mirror the real components' geometry, so the page does
 * not reflow when data arrives.
 */

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <Skeleton className="aspect-4/5 w-full rounded-lg" />
      <div className="flex flex-col gap-2 pt-4">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-1 h-3.5 w-16" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  columns = 4,
  label = 'Loading products',
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  label?: string;
}) {
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  } as const;

  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className={cn('grid gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12', columnClasses[columns])}>
        {Array.from({ length: count }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="container-page py-8 lg:py-14">
      <span className="sr-only">Loading product</span>
      <Skeleton className="mb-8 h-3 w-64" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-4/5 w-full rounded-lg" />
          <div className="flex gap-3">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="size-20 rounded-sm" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-13 w-full rounded-sm" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

export function FilterSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {Array.from({ length: 4 }, (_, group) => (
        <div key={group} className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 4 }, (_, row) => (
            <Skeleton key={row} className="h-3.5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="overflow-hidden rounded-lg border border-border bg-surface"
    >
      <span className="sr-only">Loading data</span>
      <div className="border-b border-border bg-cream-200 px-4 py-3">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: columns }, (_, column) => (
              <Skeleton
                key={column}
                className={cn('h-3.5', column === 0 ? 'w-1/3' : 'flex-1')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
