import { TableSkeleton } from '@/components/products/product-skeletons';
import { Skeleton } from '@/components/ui/skeleton';

/** Shared admin loading state — a masthead, four tiles and a table. */
export default function AdminLoading() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-lg" />
        ))}
      </div>

      <TableSkeleton rows={6} columns={5} />
    </>
  );
}
