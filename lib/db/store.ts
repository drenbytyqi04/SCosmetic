import 'server-only';

import { products as seedProducts } from '@/lib/products/data/products';
import { categories as seedCategories } from '@/lib/products/data/categories';
import {
  demoCoupons,
  demoCustomers,
  demoMessages,
  demoOrders,
  demoSubscribers,
} from '@/lib/db/demo-data';
import type {
  Category,
  ContactMessage,
  Coupon,
  Customer,
  NewsletterSubscriber,
  Order,
  Product,
} from '@/types';

/**
 * In-memory data store — the stand-in for the database.
 *
 * Repositories are the only consumers. When Postgres/Prisma is wired up, each
 * repository swaps its `store.*` reads for queries and this file is deleted; no
 * page or component changes.
 *
 * Caveat, stated plainly: writes live in the process. They survive navigation in
 * a single dev server or a single warm serverless instance, and they do not
 * survive a restart or spread across instances. That is exactly why the admin
 * mutations go through a repository interface.
 */

interface Store {
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  subscribers: NewsletterSubscriber[];
  messages: ContactMessage[];
  coupons: Coupon[];
}

/**
 * Held on `globalThis` so hot reloads in development do not discard admin edits
 * every time a module graph is rebuilt.
 */
const globalForStore = globalThis as unknown as { __cosmeticsStore?: Store };

function createStore(): Store {
  return {
    products: seedProducts.map((product) => ({ ...product })),
    categories: seedCategories.map((category) => ({ ...category })),
    // Cloned so a mutation in one process cannot alter the shared seed arrays.
    orders: structuredClone(demoOrders),
    customers: structuredClone(demoCustomers),
    subscribers: structuredClone(demoSubscribers),
    messages: structuredClone(demoMessages),
    coupons: structuredClone(demoCoupons),
  };
}

export const store: Store = (globalForStore.__cosmeticsStore ??= createStore());

/*
 * Identifier helpers live in `lib/db/ids.ts` so the Postgres repositories can use them
 * without importing the seed catalogue. Re-exported here for the existing call sites.
 */
export { createId, createOrderReference } from '@/lib/db/ids';
