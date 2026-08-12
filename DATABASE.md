# Database

The application runs on Postgres. The Prisma implementation is **built and verified** —
you set two environment variables, run one migration and one seed, and every read and
write goes to the database.

Without `DATA_SOURCE=prisma` it falls back to an in-memory seed catalogue, which is
useful for a local look around but loses every write on restart.

## Set it up

### 1. Get a Postgres database

Any Postgres works. Supabase, Neon and Vercel Postgres all give you two connection
strings, and you want both:

| Variable       | Which string          | Used by                        |
| -------------- | --------------------- | ------------------------------ |
| `DATABASE_URL` | **pooled**            | the app, at runtime            |
| `DIRECT_URL`   | **direct / unpooled** | the Prisma CLI, for migrations |

The distinction matters: pooled endpoints (Supabase's pgBouncer, Neon's pooled host)
cannot run DDL, so migrations must use the direct string. On a plain local Postgres the
two are the same and you can leave `DIRECT_URL` empty.

```bash
# .env.local
DATA_SOURCE="prisma"
DATABASE_URL="postgresql://…?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://…"
```

### 2. Migrate and seed

```bash
npm run db:deploy     # applies prisma/migrations — what a deployment runs
npm run db:seed       # 7 categories, 26 products, 37 shades, 5 coupons
```

`db:seed` is idempotent: every write is an upsert on a natural key (`slug`, `code`), so
re-running updates rather than duplicating. Safe on every deploy.

Sample orders, customers, subscribers and contact messages are **off by default** — a
real store should not open with invented orders in its dashboard. Add them when you want
a populated admin to look at:

```bash
SEED_DEMO_DATA=1 npm run db:seed
```

### 3. Verify

```bash
npm run verify        # typecheck, lint, production build
npm run db:studio     # browse the data
```

## Deploying on Vercel

1. Add `DATA_SOURCE`, `DATABASE_URL` and `DIRECT_URL` under **Settings → Environment
   Variables** (plus the admin variables from `.env.example`).
2. Redeploy. Environment variables are read at build and run time, so adding them does
   not affect the existing deployment.
3. Run the migration once against production. Either locally with production's
   `DIRECT_URL` exported, or by adding `prisma migrate deploy` to the Vercel build
   command.

`prisma generate` runs automatically — it is wired into both `postinstall` and `build`,
because the generated client is not committed. It does not need a database connection, so
a deployment with no Postgres at all still builds.

## Architecture

Nothing in `app/` or `components/` knows which data source is active:

```
app/(storefront)/shop/page.tsx
        │
        ├─ lib/products/queries.ts          cached reads (React `cache`)
        │       │
        │       └─ getProductRepository()   ← reads DATA_SOURCE
        │               ├─ prismaProductRepository   (Postgres)
        │               └─ memoryProductRepository   (seed store)
        │
        └─ types/index.ts                   domain types, shared by both
```

| Factory                     | Postgres implementation              |
| --------------------------- | ------------------------------------ |
| `getProductRepository()`    | `lib/products/prisma-repository.ts`  |
| `getCategoryRepository()`   | `lib/products/prisma-repository.ts`  |
| `getOrderRepository()`      | `lib/orders/prisma-repository.ts`    |
| `getNewsletterRepository()` | `lib/marketing/prisma-repository.ts` |
| `getContactRepository()`    | `lib/marketing/prisma-repository.ts` |
| `getCustomerRepository()`   | `lib/marketing/prisma-repository.ts` |
| `getCouponRepository()`     | `lib/cart/prisma-coupons.ts`         |

Both implementations are exercised by the same checks, and the search matching and
ranking are literally shared (`lib/products/search.ts`) so results cannot drift between
them.

The Prisma client (`lib/db/prisma.ts`) is created on **first query**, not at import. That
is what lets the repository modules be imported unconditionally: a deployment on the seed
store never opens a pool or demands a `DATABASE_URL`.

## Decisions worth knowing before you change the schema

**Money is `Int`, in cents.** Matching `type Cents = number` in the domain types. Never
`Float`.

**Orders denormalise the product.** `slug`, `name`, `shadeName`, `unitPrice` and `image`
are copied onto `OrderLine`, and the address onto `Order`. An order is a historical
record: it must still read correctly after a product is renamed, repriced or deleted, and
it must not change when a customer later edits their address. `OrderLine.productId` is
`onDelete: SetNull` for the same reason.

**Order totals are stored, not recomputed.** Prices and VAT rates change; what was
charged does not.

**Shades have a stable `key`.** Cart line items are `productId:shadeKey`, so the key must
survive a rename of the shade's display name.

**`effectivePrice` and `inStock` are derived columns maintained by a trigger.**

Two orderings the storefront depends on cannot be expressed through Prisma's `orderBy`:
the sale-aware price (`COALESCE(salePrice, price)`) and sold-out products sinking to the
bottom of every listing. Both are stored as indexed columns.

They are maintained by a `BEFORE INSERT OR UPDATE` trigger
(`prisma/migrations/*_product_derived_columns_trigger`), not by application code. That is
a deliberate correction: they started out maintained by the repository, and the seed
forgot to set them on its very first run — which silently degraded price sorting into a
name sort and marked all 26 products out of stock. In the database, no writer can bypass
it: repository, seed, data migration or a manual `UPDATE` in psql all get correct values.

**Never set those two columns from application code.** The trigger overwrites them
anyway, and code that appears to set them invites the reader to trust the wrong source.

**Stock reservation is atomic and lives inside order creation.**
`OrderRepository.create()` reserves stock, writes the order and its lines, and upserts the
customer in one transaction. The reservation is a guarded statement:

```sql
UPDATE "Product" SET stock = stock - $qty
WHERE id = $id AND stock >= $qty
```

If another transaction took the last unit first, zero rows are affected and the whole
transaction aborts — `create()` returns `null` and the checkout endpoint turns that into
"something in your bag sold out", rather than overselling. Verified by firing five
concurrent orders at a product with one unit left: one order created, the rest refused,
stock landed on exactly `0`.

**Customer totals are aggregates, not counters.** `orderCount` and `totalSpent` are
computed from the customer's orders, excluding cancelled and refunded ones, so they cannot
drift away from the orders themselves.

## Notes on specific queries

- **`list()`** — filters and sorts in SQL with `skip`/`take`. A _search_ request is the
  exception: it is ranked by where the term matched (an exact product name outranks a
  mention in a description), which SQL cannot express in `orderBy`, so matching rows are
  ranked in the application. Bounded by `take: 500` and by how few products match a
  search. Swap that branch for `to_tsvector` or `pg_trgm` when the catalogue is large
  enough to justify it — the ranking helper is shared, so behaviour stays identical.
- **`facets()`** — two `groupBy`s and one `aggregate`, not a full table scan counted in
  JavaScript.
- **`stats()`** — the 14-day revenue trend is a `date_trunc` + `GROUP BY` in Postgres
  rather than fetching every order and bucketing it.
- **Enum columns need guarding.** `categorySlug` is a Postgres enum, and comparing it
  against a value outside the enum throws. The search builder only adds that clause when
  the token actually names a category — without the guard, searching for any ordinary word
  failed the whole query. (Found by testing, not by reading.)

## Supabase instead of Prisma

The same interfaces work with `@supabase/supabase-js` if you prefer it. Two things to get
right:

- The **service-role key is server-only** and must never appear in a `NEXT_PUBLIC_*`
  variable. The repositories are already `server-only`, which keeps it that way.
- If you use the anon key with Row Level Security, write the policies before the
  application depends on them. Catalogue tables are public-read; orders, customers,
  subscribers and messages are not.

## Still to do

- **Stock release for abandoned orders.** Stock is reserved at order creation. Decide how
  long an unpaid order holds it and release it on payment failure or expiry — see
  PAYMENTS.md.
- **Newsletter double opt-in.** `confirmToken` exists in the schema; nothing sends the
  email yet.
- **`AdminUser` is unused.** Admin credentials come from environment variables. The table
  is there for when you want more than one administrator.
