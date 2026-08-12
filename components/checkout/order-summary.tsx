'use client';

import Link from 'next/link';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/lib/cart/store';
import { pluralise } from '@/lib/utils/format';

/**
 * Read-only order summary shown alongside the checkout form.
 *
 * Quantities are not editable here — changing the order mid-checkout is a common way
 * to end up paying for something you did not mean to. The link back to the bag is the
 * deliberate route.
 */
export function OrderSummary() {
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);

  if (!hydrated) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4">
        <h2 className="font-serif text-lg font-light text-foreground">
          Your order
          <span className="ml-2 text-sm text-muted-foreground">
            ({pluralise(items.length, 'line')})
          </span>
        </h2>
        <Link
          href="/cart"
          className="text-xs tracking-[0.08em] text-muted-foreground uppercase underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Edit
        </Link>
      </div>

      <div className="max-h-80 overflow-y-auto px-5">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <CartItem key={item.key} item={item} variant="compact" readOnly />
          ))}
        </ul>
      </div>

      <div className="border-t border-border px-5 py-5">
        <CartSummary showCheckoutButton={false} />
      </div>
    </div>
  );
}
