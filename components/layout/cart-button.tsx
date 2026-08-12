'use client';

import { ShoppingBag } from 'lucide-react';
import { selectItemCount, useCartStore } from '@/lib/cart/store';
import { cn } from '@/lib/utils/cn';

/**
 * Header bag button.
 *
 * The count renders only once the persisted cart has hydrated — showing 0 first and
 * then correcting it would be a visible hydration flicker on every page load.
 */
export function CartButton({ className }: { className?: string }) {
  const openDrawer = useCartStore((state) => state.openDrawer);
  const hydrated = useCartStore((state) => state.hydrated);
  const itemCount = useCartStore(selectItemCount);

  const count = hydrated ? itemCount : 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={count > 0 ? `Open bag, ${count} items` : 'Open bag, empty'}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10',
        className,
      )}
    >
      <ShoppingBag className="size-[18px]" aria-hidden="true" />

      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-espresso-900 px-1 text-[0.625rem] leading-[18px] font-medium tabular-nums text-cream-50"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
