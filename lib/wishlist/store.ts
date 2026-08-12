'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Wishlist state.
 *
 * Only product ids are stored — the wishlist page resolves them against the
 * catalogue on the server, so a saved product that changes price or goes out of
 * stock always renders its current state rather than a stale snapshot.
 */

export interface WishlistState {
  ids: string[];
  hydrated: boolean;
  toggle: (productId: string) => boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  /** Called by the persist middleware once stored state has been read. */
  markHydrated: () => void;
}

const STORAGE_KEY = 'cosmetics-ks.wishlist.v1';
const MAX_ITEMS = 100;

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,

      toggle: (productId) => {
        const isSaved = get().ids.includes(productId);
        if (isSaved) get().remove(productId);
        else get().add(productId);
        return !isSaved;
      },

      add: (productId) =>
        set((state) =>
          state.ids.includes(productId)
            ? state
            : { ids: [productId, ...state.ids].slice(0, MAX_ITEMS) },
        ),

      remove: (productId) =>
        set((state) => ({ ids: state.ids.filter((id) => id !== productId) })),

      clear: () => set({ ids: [] }),

      has: (productId) => get().ids.includes(productId),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({ ids: state.ids }),
      // See the note in lib/cart/store.ts: this runs during `create()`, so the
      // store binding is not available yet.
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export const selectWishlistIds = (state: WishlistState) => state.ids;
export const selectWishlistCount = (state: WishlistState) => state.ids.length;
export const selectWishlistHydrated = (state: WishlistState) => state.hydrated;
