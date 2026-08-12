'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductGridSkeleton } from '@/components/products/product-skeletons';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { FormStatus } from '@/components/ui/field';
import { useWishlistStore } from '@/lib/wishlist/store';
import { pluralise } from '@/lib/utils/format';
import type { ApiResult } from '@/lib/api/response';
import type { Product } from '@/types';

/**
 * Wishlist page body.
 *
 * The saved ids live in localStorage, so the page has to be client-rendered — but the
 * products themselves are resolved from the server by id. That way a saved product
 * always shows its current price and stock rather than a stale snapshot.
 */
export function WishlistView() {
  const hydrated = useWishlistStore((state) => state.hydrated);
  const ids = useWishlistStore((state) => state.ids);
  const clear = useWishlistStore((state) => state.clear);

  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');

  // An empty wishlist is derived, not fetched — no effect and no state change needed
  // to know there is nothing to show.
  const isEmpty = hydrated && ids.length === 0;

  useEffect(() => {
    if (!hydrated || !ids.length) return;

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as ApiResult<{ products: Product[] }>;

        if (!body.ok) {
          setStatus('error');
          return;
        }
        // Preserve the order they were saved in rather than catalogue order.
        const byId = new Map(body.data.products.map((product) => [product.id, product]));
        setProducts(ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])));
        setStatus('idle');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setStatus('error');
      }
    })();

    return () => controller.abort();
  }, [hydrated, ids]);

  if (isEmpty) {
    return (
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        description="Tap the heart on any product to keep it here. Your wishlist stays on this device."
        action={{ label: 'Browse the catalogue', href: '/shop' }}
        secondaryAction={{ label: 'See bestsellers', href: '/shop?tag=bestseller' }}
      />
    );
  }

  if (!hydrated || status === 'loading') {
    return <ProductGridSkeleton count={4} columns={4} label="Loading your wishlist" />;
  }

  if (status === 'error') {
    return (
      <FormStatus tone="error" title="We could not load your saved products">
        Something went wrong on our side. Refresh the page and they should reappear — your
        wishlist is stored on this device, so nothing has been lost.
      </FormStatus>
    );
  }

  if (!products.length) {
    return (
      <EmptyState
        icon={Heart}
        title="Your saved products are no longer available"
        description="Everything on your list has been retired since you saved it. The current catalogue is a click away."
        action={{ label: 'Browse the catalogue', href: '/shop' }}
        secondaryAction={{ label: 'See bestsellers', href: '/shop?tag=bestseller' }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
          {pluralise(products.length, 'saved product')}
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear wishlist
        </Button>
      </div>

      <ProductGrid products={products} columns={4} priorityCount={2} />
    </div>
  );
}
