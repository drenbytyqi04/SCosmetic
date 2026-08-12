# Connecting a database

The application is built to run against Postgres. Today it serves a seed catalogue from
memory, but nothing in `app/` or `components/` knows that — every read goes through a
repository interface, so switching is a change to a handful of modules in `lib/`.

## The seam

```
app/(storefront)/shop/page.tsx
        │
        ├─ lib/products/queries.ts        cached read API (React `cache`)
        │       │
        │       └─ getProductRepository()  factory — reads DATA_SOURCE
        │               │
        │               ├─ memoryProductRepository   ← today
        │               └─ prismaProductRepository    ← you write this
        │
        └─ types/index.ts                 shared domain types
```

Three factories to satisfy:

| Factory | File | Interfaces |
| --- | --- | --- |
| `getProductRepository()` | `lib/products/repository.ts` | `ProductRepository` |
| `getCategoryRepository()` | `lib/products/repository.ts` | `CategoryRepository` |
| `getOrderRepository()` | `lib/orders/repository.ts` | `OrderRepository` |
| `getNewsletterRepository()` | `lib/marketing/repository.ts` | `NewsletterRepository` |
| `getContactRepository()` | `lib/marketing/repository.ts` | `ContactRepository` |
| `getCustomerRepository()` | `lib/marketing/repository.ts` | `CustomerRepository` |
| `getCouponRepository()` | `lib/cart/coupons.ts` | `CouponRepository` |

Each is a plain async interface. There are no Prisma types in the signatures, so the
implementation is free to shape its queries however it likes as long as it returns the
domain types.

## Steps

### 1. Install Prisma

```bash
npm install prisma --save-dev
npm install @prisma/client
```

### 2. Point it at a database

Set both URLs in `.env.local` (Supabase and Neon both give you these two). The pooled
connection cannot run migrations, which is what `DIRECT_URL` is for:

```bash
DATABASE_URL="postgresql://…?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://…"
```

### 3. Migrate

`prisma/schema.prisma` is already written against the types in `types/index.ts`.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Worth knowing about the schema before you extend it:

- **Money is `Int`, in cents.** Matching `type Cents = number`. Never `Float`.
- **Order lines denormalise the product.** `slug`, `name`, `shadeName`, `unitPrice` and
  `image` are copied onto `OrderLine`, and the address is copied onto `Order`. An order
  is a historical record: it must still read correctly after a product is renamed,
  repriced or deleted, and it must not change when a customer edits their address later.
  `OrderLine.productId` is `onDelete: SetNull` for the same reason.
- **Order totals are stored, not recomputed.** Prices and VAT rates change; what was
  charged does not.
- **Shades have a stable `key`.** Cart line items are `productId:shadeKey`, so the key
  has to survive a rename of the shade's display name.
- **Indexes** cover the queries the storefront actually runs: category listings, the
  three merchandising flags, price sort and `createdAt`.

### 4. Add a client singleton

```ts
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

The singleton matters in development: without it, hot reload opens a new connection pool
on every rebuild until Postgres refuses new connections.

### 5. Implement one repository at a time

Start with `ProductRepository` — it is the largest and the one every page depends on.

```ts
// lib/products/prisma-repository.ts
import 'server-only';
import { prisma } from '@/lib/db/prisma';
import type { ProductRepository } from '@/lib/products/repository';

export const prismaProductRepository: ProductRepository = {
  async findBySlug(slug) {
    const row = await prisma.product.findUnique({
      where: { slug },
      include: { shades: { orderBy: { position: 'asc' } } },
    });
    return row ? toProduct(row) : null;
  },
  // …
};
```

Then return it from the factory:

```ts
export function getProductRepository(): ProductRepository {
  if (process.env.DATA_SOURCE === 'prisma') return prismaProductRepository;
  return memoryProductRepository;
}
```

The factories currently **throw** when `DATA_SOURCE=prisma` and no implementation
exists. Keep that behaviour until each one is genuinely done: a loud failure is far
better than a production deployment quietly serving seed data while believing it is
talking to Postgres.

Notes on the trickier methods:

- **`list()`** — port the pure helpers in `lib/products/repository.ts` (`applyFilters`,
  `applySort`, `paginate`) to `where` / `orderBy` / `skip` / `take`. Two behaviours are
  easy to lose: the effective price is `COALESCE(salePrice, price)`, and out-of-stock
  products sink to the bottom of *every* ordering.
- **`search()`** — the in-memory version requires every whitespace-separated token to
  appear somewhere, then ranks by where it matched. Postgres full-text search
  (`to_tsvector`) or `pg_trgm` will both do better; keep the ranking so exact name
  matches stay first.
- **`facets()`** — one `groupBy` for brands, one for categories, one `aggregate` for the
  price range. Do not fetch every product to count them.
- **`adjustStock()`** — must be a single atomic statement, not read-then-write:
  `UPDATE … SET stock = GREATEST(0, stock - $1)`. Two concurrent orders for the last
  unit is exactly the case this exists to survive.

### 6. Orders need a transaction

Order creation currently runs sequentially. Against a real database it should be one
transaction covering the order row, its lines and the stock decrement, so a failure
half-way cannot leave stock reserved for an order that does not exist:

```ts
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { /* … */ lines: { create: lines } } });
  for (const line of lines) {
    await tx.product.update({
      where: { id: line.productId },
      data: { stock: { decrement: line.quantity } },
    });
  }
  return order;
});
```

Add a `stock >= quantity` guard (or a check constraint) so an oversell fails the
transaction rather than driving stock negative.

### 7. Seed

`lib/products/data/products.ts` and `categories.ts` are the seed content. A
`prisma/seed.ts` that imports and inserts them keeps one source of truth:

```ts
import { products } from '../lib/products/data/products';
import { categories } from '../lib/products/data/categories';
```

### 8. Flip the switch

```bash
DATA_SOURCE="prisma"
```

Then delete `lib/db/store.ts`, and the `memory*` repositories with it.

## Supabase instead of Prisma

The same interfaces work with `@supabase/supabase-js`. Two things to get right:

- The **service-role key is server-only**. It must never appear in a `NEXT_PUBLIC_*`
  variable. Repositories are already `server-only`, which keeps it that way.
- If you use the anon key with Row Level Security, write the policies before the
  application depends on them. Catalogue tables are public-read; orders, customers,
  subscribers and messages are not.

## Checklist

- [ ] `prisma migrate dev` clean against an empty database
- [ ] Every repository method implemented, including `facets` and `adjustStock`
- [ ] Order creation wrapped in a transaction with an oversell guard
- [ ] Client singleton in place
- [ ] Seed script runs idempotently
- [ ] `DATA_SOURCE=prisma`
- [ ] `npm run verify` passes
- [ ] Filtering, sorting, pagination and search spot-checked against real rows
- [ ] `lib/db/store.ts` and the memory repositories deleted
