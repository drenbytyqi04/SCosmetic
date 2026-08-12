'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { selectItemCount, useCartStore } from '@/lib/cart/store';
import { pluralise } from '@/lib/utils/format';

/**
 * Full bag page.
 *
 * The cart lives in localStorage, so the first render on the client has to wait for
 * hydration. Rather than flashing an empty state and then filling in, it shows a
 * skeleton until the persisted state is known.
 */
export function CartView() {
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore(selectItemCount);
  const clear = useCartStore((state) => state.clear);

  if (!hydrated) {
    return (
      <div role="status" aria-busy="true" className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
        <span className="sr-only">Loading your bag</span>
        <div className="flex flex-col divide-y divide-border">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex gap-4 py-5">
              <Skeleton className="size-24 rounded-sm" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Nothing here yet. Start with the products our clients reorder most, or browse the full catalogue."
        action={{ label: 'Shop bestsellers', href: '/shop?tag=bestseller' }}
        secondaryAction={{ label: 'Browse everything', href: '/shop' }}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
          <h2 className="font-serif text-xl font-light text-foreground">
            {pluralise(itemCount, 'item')}
          </h2>
          <button
            type="button"
            onClick={clear}
            className="text-xs tracking-[0.08em] text-muted-foreground uppercase underline underline-offset-4 transition-colors hover:text-destructive"
          >
            Empty bag
          </button>
        </div>

        <ul className="divide-y divide-border">
          {items.map((item) => (
            <CartItem key={item.key} item={item} />
          ))}
        </ul>

        <Button asChild variant="ghost" size="sm" className="mt-6">
          <Link href="/shop">
            <ArrowLeft aria-hidden="true" />
            Continue shopping
          </Link>
        </Button>
      </div>

      <aside aria-labelledby="summary-heading" className="lg:sticky lg:top-28 lg:self-start">
        <h2 id="summary-heading" className="mb-5 font-serif text-xl font-light text-foreground">
          Order summary
        </h2>
        <div className="rounded-lg border border-border bg-surface p-5">
          <CartSummary />
        </div>
      </aside>
    </div>
  );
}
