'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { selectItemCount, useCartStore } from '@/lib/cart/store';
import { pluralise } from '@/lib/utils/format';

/**
 * Slide-over bag, mounted once in the root layout.
 *
 * Open state lives in the cart store so anything — a product card, the header, a
 * toast action — can open it without prop drilling or a context provider.
 */
export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isDrawerOpen);
  const setOpen = useCartStore((state) => state.setDrawerOpen);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore(selectItemCount);
  const pathname = usePathname();

  // A route change means the customer has moved on; leaving the panel open over the
  // new page would be disorienting.
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Your bag</SheetTitle>
          <SheetDescription>
            {itemCount > 0 ? pluralise(itemCount, 'item') : 'Nothing here yet'}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <SheetBody className="flex flex-col items-center justify-center text-center">
            <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-cream-200 text-champagne-500">
              <ShoppingBag className="size-6" aria-hidden="true" />
            </span>
            <h3 className="font-serif text-xl font-light text-foreground">Your bag is empty</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Start with the pieces our clients reorder most, or browse the full catalogue.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild onClick={closeDrawer}>
                <Link href="/shop?tag=bestseller">Shop bestsellers</Link>
              </Button>
              <Button asChild variant="outline" onClick={closeDrawer}>
                <Link href="/shop">Browse everything</Link>
              </Button>
            </div>
          </SheetBody>
        ) : (
          <>
            <SheetBody className="py-0">
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <CartItem key={item.key} item={item} variant="compact" />
                ))}
              </ul>
            </SheetBody>

            <SheetFooter>
              <CartSummary showCoupon={false} />
              <Button asChild variant="ghost" size="sm" block className="mt-3">
                <Link href="/cart">View full bag</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
