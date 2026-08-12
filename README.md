# COSMETICS.KS

A production-shaped e-commerce storefront for a prestige beauty retailer in Prishtina,
built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4.

Not a prototype: server-rendered catalogue with URL-driven filtering, a persisted cart,
server-side pricing, an authenticated admin area, and a data layer behind interfaces so
the in-memory seed store can be swapped for Postgres without touching the UI.

## Quick start

```bash
npm install
cp .env.example .env.local     # optional for local development; required for admin
npm run dev                    # http://localhost:3000
```

Verify everything the way CI would:

```bash
npm run verify                 # typecheck → lint → production build
```

Individual steps: `npm run typecheck`, `npm run lint`, `npm run build`, `npm start`.

## What is built

**Storefront**

| Route | Rendering | Notes |
| --- | --- | --- |
| `/` | Static | Hero, category grid, three merchandised rails streamed with Suspense |
| `/shop` | Dynamic | Search, category/brand/price/availability filters, sort, pagination |
| `/products/[slug]` | SSG + ISR | Pre-rendered per product, revalidates hourly |
| `/category/[slug]` | SSG shell + streamed grid | Category-scoped filtering |
| `/categories` | Static | Category index with live product counts |
| `/cart`, `/checkout`, `/checkout/success` | Dynamic | Bag, checkout, order confirmation |
| `/wishlist` | Dynamic | Device-local saves, resolved against the live catalogue |
| `/about`, `/contact` | Static | Contact form, FAQ with FAQ structured data |

**Admin** (`/admin`, session-gated)

Dashboard with revenue/order/stock KPIs, product CRUD, relative inventory adjustment,
orders with status transitions, customers, contact inbox, newsletter subscribers.

**API** (`/api/*`)

`products`, `products/[slug]`, `categories`, `search`, `cart`, `coupons/validate`,
`orders`, `newsletter`, `contact` — all Zod-validated, all returning one JSON envelope.

## Architecture

```
app/
  (storefront)/          Route group: shop chrome (header, footer, cart drawer)
    page.tsx  shop/  products/[slug]/  category/[slug]/  categories/
    cart/  checkout/  wishlist/  about/  contact/
    error.tsx  not-found.tsx
  admin/
    (dashboard)/         Route group: auth gate + admin shell
    login/               Outside the gate, so it cannot redirect to itself
  api/                   Route handlers
  layout.tsx             Minimal document shell (fonts, toaster)
  globals.css            Design tokens
components/
  ui/                    Primitives (button, input, sheet, select, table, field…)
  layout/  products/  cart/  checkout/  home/  contact/  admin/  shared/
lib/
  config/                Brand + commerce configuration
  products/              Repository interface, in-memory impl, cached queries, seed data
  cart/                  Pricing, line items, coupons, client store, server resolution
  orders/  marketing/    Repositories for orders, customers, subscribers, messages
  auth/                  Session tokens (Edge-safe), scrypt hashing, session helpers
  payments/              Provider interface + offline provider
  validations/           Zod schemas: server (authoritative) and client (UX)
  seo/                   Metadata builders, JSON-LD generators
  api/                   Response envelope, rate limiter
  utils/                 cn, formatting, sanitisation, image helpers
  db/store.ts            The seed store — the only thing Postgres replaces
types/index.ts           Domain types shared by every layer
prisma/schema.prisma     Target schema, written against those same types
```

### Data layer

Nothing in `app/` or `components/` reads seed data directly. Pages call cached query
functions, which call repositories, which are obtained from factories:

```
page.tsx → lib/products/queries.ts → getProductRepository() → memory | prisma
```

`DATA_SOURCE=prisma` is the seam. Until the Prisma repositories exist, setting it throws
with a pointer to the work — failing loudly beats a production deployment quietly
serving seed data while believing it is talking to Postgres. See
[DATABASE.md](./DATABASE.md).

### Money

All amounts are integer cents (`type Cents = number`) end to end — no floats, no
rounding drift. `formatPrice` renders aligned two-decimal amounts for anything a
customer could check against a receipt; `formatPriceCompact` drops trailing zeros for
promotional prose.

### Pricing and trust

`lib/cart/pricing.ts` is the single pricing function, shared by the client store and
the server. The browser sends product ids, shades and quantities — never prices.
`lib/cart/server.ts` rebuilds every line from the catalogue, caps quantities to real
stock, drops retired shades and re-applies coupons. A tampered client changes nothing
about what it is charged.

Stock and shade changes between page load and submit are surfaced to the customer
rather than absorbed silently: `/api/orders` returns the adjustments and creates no
order.

### State

Cart and wishlist use Zustand with `persist`, so a refresh — or a return trip from
Instagram — keeps the bag. Two things to know if you extend them:

- Selectors must return stable references. Zustand compares results with `Object.is`,
  so a selector that builds a fresh object loops forever. Derived values live in hooks
  (`useCartTotals`, `useCartSavings`, `useCartLineInputs`) that subscribe to raw slices
  and compute with `useMemo`.
- Persisted state rehydrates *during* `create()`, before the store binding exists.
  `onRehydrateStorage` therefore goes through the state it is handed
  (`state?.markHydrated()`), never through the exported hook.

Counts render as zero until `hydrated` flips, so server markup and first client paint
agree.

## Security

- **Server validation on everything.** Zod schemas sanitise (control characters,
  whitespace, length, case) before validating. Route handlers and server actions trust
  the parsed output and nothing else.
- **Client schemas are for UX only.** `lib/validations/forms.ts` mirrors the server
  rules for inline feedback; the server schema is always the authority.
- **Admin auth.** HS256 JWT in an httpOnly, SameSite=Lax, Secure cookie. Middleware
  gates `/admin/*`; every admin server action *also* calls `requireAdmin()`, because a
  server action is an endpoint in its own right. Passwords are scrypt (Node stdlib, no
  native dependency), compared in constant time, with a generic failure message.
- **Production refuses to guess.** Without `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` no
  sign-in succeeds. The local development fallback is disabled when
  `NODE_ENV=production`, and the admin shell shows a warning banner while it is active.
- **Rate limiting** on coupon validation, order creation, newsletter, contact and admin
  login. In-process and per-instance — swap for Redis at real traffic; the call
  signature is unchanged.
- **Honeypots** on the public forms.
- **No enumeration.** Re-subscribing an existing address returns the same message as a
  new sign-up. Login never reveals which half was wrong.
- **Security headers** in `next.config.ts`; `X-Robots-Tag: noindex` and `no-store` on
  every admin response.
- **No secrets in the client.** Only `NEXT_PUBLIC_*` reaches the browser; the payment
  mode is resolved server-side and passed down as a boolean and a label.

## SEO

`generateMetadata()` derives product and category metadata from the same records the
page renders, so they cannot drift. Open Graph and Twitter cards everywhere, canonical
URLs, and `noindex` on filtered/paginated permutations so they do not compete with the
clean view. JSON-LD for Organization, WebSite (with SearchAction), Product (with real
ratings and stock), BreadcrumbList, CollectionPage and FAQPage. Generated `sitemap.xml`
carries each product's real `updatedAt`; `robots.txt` excludes admin, API and
transactional routes.

One structural note worth keeping: `/products/[slug]` and `/category/[slug]`
deliberately have **no** `loading.tsx`. A segment-level loading file makes Next stream
a shell first, which commits a `200` — so `notFound()` would render the not-found page
under a 200 and become a soft 404. The lookup resolves before anything is sent, and the
slower parts stream behind their own Suspense boundaries instead.

## Accessibility

Semantic landmarks and a real heading hierarchy; skip link; one visible focus treatment
site-wide; labelled forms with `aria-describedby`/`aria-invalid` wired through a
render-prop `Field` so it cannot be forgotten; `role="alert"` on errors and
`aria-live` on result counts; combobox pattern for search with full keyboard support;
shade swatches as a radiogroup with the selection named in text, never colour alone;
`prefers-reduced-motion` respected; zoom not capped.

## Performance

Server Components by default — the only client islands are the cart, wishlist, search,
filters, forms and the gallery. `next/image` throughout with per-context `sizes` and
blur placeholders, AVIF/WebP, and an art-directed hero (portrait crop on phones, wide
crop above `sm`). Fonts self-hosted by `next/font` with `display: swap`. Products are
statically generated and revalidated hourly; admin mutations call `revalidatePath` on
every affected surface.

## Payments

Checkout, order creation, payment creation, payment confirmation and order status are
five separate steps behind `PaymentProvider` (`lib/payments/provider.ts`).

**Payments are not live.** The only implementation is an offline provider: the order is
recorded as `pending` / `requires_payment` and settled by bank transfer or on delivery,
both normal in this market. The UI says exactly that. Orders are never marked paid
without a confirmed payment. See [PAYMENTS.md](./PAYMENTS.md).

## Images

`public/images/**` is procedurally generated placeholder artwork — abstract still lifes
drawn with `scripts/generate-placeholders.mjs` and encoded as PNG using Node's built-in
zlib. No image library, no network, nothing binary added by hand. Regenerate with
`node scripts/generate-placeholders.mjs`; when real photography arrives, replace the
files and delete the script. The footer discloses that the imagery is placeholder.

Brand names in the seed catalogue are fictional house labels — nothing here impersonates
a real cosmetics brand.

## Environment

See [.env.example](./.env.example) for every variable and what happens when it is
unset. The two that matter most:

```bash
# Generate admin credentials and a session secret
node scripts/hash-password.mjs 'your-strong-password'
```

The hash is colon-delimited (`scrypt:N:r:p:salt:hash`) rather than `$`-delimited on
purpose: `.env` loaders run variable expansion over values, and a `$16384` segment
would be silently expanded away.

## Known limitations

Stated plainly rather than left to be discovered:

- **Writes are in-process.** The seed store lives in memory, so admin edits survive
  navigation within one server instance but not a restart, and do not propagate across
  instances. This is exactly what the repository interfaces exist to fix.
- **No customer accounts.** Wishlist is device-local; "customers" are derived from
  order history.
- **No email is sent.** Contact messages and newsletter sign-ups are stored for the
  admin inbox; newsletter double opt-in needs a provider wired up.
- **Card payments are not enabled.** See above.
- **Rate limiting is per-instance.**
