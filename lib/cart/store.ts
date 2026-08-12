'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildCartItem, cartItemKey, clampQuantity } from '@/lib/cart/items';
import { calculateSavings, emptyTotals, priceCart } from '@/lib/cart/pricing';
import type { AppliedCoupon, CartItem, CartTotals, Product, ShippingMethod } from '@/types';

/**
 * Client cart state.
 *
 * Persisted to localStorage so a refresh — or a return trip from Instagram — keeps
 * the bag intact. The totals held here are a preview for the UI; checkout re-prices
 * everything server-side before an order exists.
 */

export interface CartState {
  items: CartItem[];
  /** Server-verified coupon result, set after /api/coupons/validate succeeds. */
  appliedCoupon: AppliedCoupon | null;
  shippingMethod: ShippingMethod;
  isDrawerOpen: boolean;
  /** False until localStorage has been read, so SSR and first paint agree. */
  hydrated: boolean;

  addItem: (product: Product, quantity?: number, shadeId?: string) => CartItem;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  clear: () => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  /**
   * Flips `hydrated` once persisted state has been read. Called by the persist
   * middleware, not by components.
   */
  markHydrated: () => void;
}

const STORAGE_KEY = 'cosmetics-ks.cart.v1';

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      shippingMethod: 'standard',
      isDrawerOpen: false,
      hydrated: false,

      addItem: (product, quantity = 1, shadeId) => {
        const incoming = buildCartItem(product, quantity, shadeId);
        const key = cartItemKey(product.id, shadeId);
        const existing = get().items.find((item) => item.key === key);

        const next: CartItem = existing
          ? {
              ...existing,
              // Refresh price and stock from the product we were just handed.
              unitPrice: incoming.unitPrice,
              compareAtPrice: incoming.compareAtPrice,
              maxQuantity: incoming.maxQuantity,
              quantity: clampQuantity(existing.quantity + quantity, product.stock),
            }
          : incoming;

        set((state) => ({
          items: existing
            ? state.items.map((item) => (item.key === key ? next : item))
            : [...state.items, next],
        }));

        return next;
      },

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((item) => item.key !== key) })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => item.key !== key)
              : state.items.map((item) =>
                  item.key === key
                    ? { ...item, quantity: clampQuantity(quantity, item.maxQuantity) }
                    : item,
                ),
        })),

      increment: (key) => {
        const item = get().items.find((candidate) => candidate.key === key);
        if (item) get().setQuantity(key, item.quantity + 1);
      },

      decrement: (key) => {
        const item = get().items.find((candidate) => candidate.key === key);
        if (item) get().setQuantity(key, item.quantity - 1);
      },

      clear: () => set({ items: [], appliedCoupon: null }),

      setCoupon: (appliedCoupon) => set({ appliedCoupon }),

      setShippingMethod: (shippingMethod) => set({ shippingMethod }),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      // Drawer state and the hydration flag are session concerns, not stored ones.
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
        shippingMethod: state.shippingMethod,
      }),
      /*
       * Rehydration from localStorage is synchronous, so this fires *during*
       * `create()` — before the `useCartStore` binding exists. Going through the
       * state handed to the callback avoids that temporal dead zone; referencing
       * `useCartStore` here would throw and silently leave `hydrated` false, which
       * in turn leaves every hydration-gated count stuck at zero.
       */
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

/* --------------------------------- selectors -------------------------------- */

/*
 * Selectors must return a stable reference for the value they select. Zustand
 * compares the previous and next selector results with `Object.is`, so a selector
 * that builds a fresh object or array on every call reports a change on every
 * render and spins into an infinite update loop.
 *
 * That is why derived values live in the hooks below — subscribed to the raw state
 * slices, then computed with `useMemo` — rather than inside a selector.
 */

export const selectItems = (state: CartState) => state.items;
export const selectHydrated = (state: CartState) => state.hydrated;
export const selectItemCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

/** Derived totals for the current cart, using the shared pricing rules. */
export function useCartTotals(): CartTotals {
  const items = useCartStore(selectItems);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const shippingMethod = useCartStore((state) => state.shippingMethod);

  return useMemo(() => {
    if (!items.length) return emptyTotals;
    return priceCart({ items, applied: appliedCoupon, shippingMethod }).totals;
  }, [items, appliedCoupon, shippingMethod]);
}

/** Total saving versus list price across the bag. */
export function useCartSavings(): number {
  const items = useCartStore(selectItems);
  return useMemo(() => calculateSavings(items), [items]);
}

/** Cart lines reduced to the minimum the server needs. */
export function useCartLineInputs(): Array<{
  productId: string;
  shadeId?: string;
  quantity: number;
}> {
  const items = useCartStore(selectItems);

  return useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        ...(item.shadeId ? { shadeId: item.shadeId } : {}),
        quantity: item.quantity,
      })),
    [items],
  );
}
