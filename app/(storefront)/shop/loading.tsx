import { FilterSidebarSkeleton, ProductGridSkeleton } from '@/components/products/product-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

/** Shop skeleton, matching the real grid so nothing jumps when data lands. */
export default function ShopLoading() {
  return (
    <>
      <div className="border-b border-border bg-cream-200/60">
        <div className="container-page py-8 sm:py-12">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-5 h-9 w-64" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        </div>
      </div>

      <div className="container-page py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <Skeleton className="mb-4 h-3 w-16" />
            <FilterSidebarSkeleton />
          </aside>

          <div className="min-w-0">
            <div className="mb-6 flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-44" />
            </div>
            <ProductGridSkeleton count={12} columns={4} />
          </div>
        </div>
      </div>
    </>
  );
}
