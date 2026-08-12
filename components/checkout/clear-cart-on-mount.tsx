'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/lib/cart/store';

/**
 * Empties the bag once an order exists.
 *
 * The checkout form already clears on a successful submit; this covers the other
 * routes to this page — a refresh, a back-forward navigation, or the confirmation link
 * from an email — so a completed order can never be re-submitted from a stale bag.
 */
export function ClearCartOnMount() {
  const clear = useCartStore((state) => state.clear);
  const hasItems = useCartStore((state) => state.items.length > 0);

  useEffect(() => {
    if (hasItems) clear();
  }, [hasItems, clear]);

  return null;
}
