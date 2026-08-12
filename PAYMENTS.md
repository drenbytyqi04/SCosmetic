# Payments

**Card payments are not enabled in this application.** There is no Stripe integration,
no card form, and no code path that marks an order paid without a confirmed payment.

What exists is the structure to add one, and an honest offline flow in the meantime.

## Current behaviour

`lib/payments/provider.ts` exposes a `PaymentProvider` interface with one
implementation: `manualProvider`. An order is created as `pending` /
`requires_payment`, the customer is sent to `/checkout/success`, and payment is arranged
out of band — bank transfer or cash on delivery, both normal in this market.

The checkout UI reads `getPaymentMode()` and says exactly this. It does not claim a card
will be charged.

`isPaymentProviderConfigured()` is the single source of truth for whether payments are
live, and it is false until **both** keys are present:

```
STRIPE_SECRET_KEY                    server-only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY   safe to expose
```

Setting them without implementing the adapter makes `getPaymentProvider()` throw. That
is deliberate: silently recording unpaid orders as if they had been charged is the worst
possible failure here.

## The five steps

Kept separate on purpose, so a provider slots in without the checkout UI or the order
code changing:

| Step | Where it lives now |
| --- | --- |
| 1. Checkout UI | `components/checkout/checkout-form.tsx` |
| 2. Order creation | `app/api/orders/route.ts` → `getOrderRepository().create()` |
| 3. Payment creation | `provider.createIntent(order)` |
| 4. Payment confirmation | a webhook you add → `orders.markPaid()` |
| 5. Order status | `orders.updateStatus()`, surfaced in `/admin/orders` |

Step 4 is the one that does not exist yet, and it is the only one that may mark an order
paid.

## Adding Stripe

### 1. Install and configure

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

```bash
STRIPE_SECRET_KEY="sk_test_…"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_…"
STRIPE_WEBHOOK_SECRET="whsec_…"
```

Only the publishable key may be `NEXT_PUBLIC_`. If you ever find yourself wanting to
prefix the secret key, the work belongs on the server instead.

### 2. Implement the adapter

```ts
// lib/payments/stripe.ts
import 'server-only';
import Stripe from 'stripe';
import type { PaymentProvider } from '@/lib/payments/provider';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const stripeProvider: PaymentProvider = {
  id: 'stripe',
  label: 'Card payment',
  isLive: true,

  async createIntent(order) {
    const intent = await stripe.paymentIntents.create({
      // Always the server's total. Never a number from the request body.
      amount: order.totals.total,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id, reference: order.reference },
      receipt_email: order.email,
    });

    return {
      id: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      amount: order.totals.total,
      currency: 'eur',
      status: 'requires_payment',
    };
  },

  async confirmIntent(intentId) {
    const intent = await stripe.paymentIntents.retrieve(intentId);
    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status === 'succeeded' ? 'succeeded' : 'processing',
    };
  },
};
```

Then return it from the factory:

```ts
export function getPaymentProvider(): PaymentProvider {
  if (isPaymentProviderConfigured()) return stripeProvider;
  return manualProvider;
}
```

`amount` comes from `order.totals.total`, which `lib/cart/server.ts` computed from the
catalogue. The client never sends a price, and nothing here should start accepting one.

### 3. Add the webhook

The webhook is the **only** place an order becomes paid.

```ts
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';
import { getOrderRepository } from '@/lib/orders/repository';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  // Verify against the raw body — a parsed body will not match the signature.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    // Unverified: could be anyone. Never trust its contents.
    return new Response('Invalid signature', { status: 400 });
  }

  const orders = getOrderRepository();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const orderId = intent.metadata.orderId;
      if (orderId) await orders.markPaid(orderId, intent.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const orderId = event.data.object.metadata.orderId;
      if (orderId) await orders.updateStatus(orderId, 'cancelled');
      break;
    }
  }

  // 200 tells Stripe to stop retrying. Only send it once the work is durable.
  return new Response(null, { status: 200 });
}
```

Non-negotiables:

- **Verify the signature.** An unverified webhook body is attacker-controlled input that
  says "this order is paid".
- **Read the raw body.** `request.text()`, not `request.json()`.
- **Be idempotent.** Stripe retries. `markPaid()` must be safe to call twice; guard on
  the current status if you add side effects such as sending email.
- **Do not trust the client's success redirect.** The customer landing on
  `/checkout/success` means their browser got there, not that money moved.
- **Return 200 only after the state change is committed.**

### 4. Collect payment in the browser

Return the `clientSecret` from `/api/orders` (the handler already forwards it when a
provider supplies one), mount Stripe Elements, and confirm. Keep the current behaviour
where a stock adjustment aborts before any order or intent is created.

### 5. Also worth doing

- **Refunds.** Add `refund(order)` to the interface and wire it to the `refunded` status
  in `/admin/orders`, so a refund in the admin actually moves money.
- **Reconciliation.** An order stuck in `pending` with a `paymentIntentId` should be
  re-checked with `confirmIntent()` — webhooks can be missed.
- **Stock release.** Stock is decremented at order creation. Decide how long an unpaid
  order holds it, and release it on `payment_failed` or on expiry.

## Checklist before taking real money

- [ ] Adapter implemented and returned from `getPaymentProvider()`
- [ ] Webhook verifies signatures against the raw body
- [ ] `markPaid()` is idempotent
- [ ] Amount always taken from the server's computed total
- [ ] Secret key absent from every `NEXT_PUBLIC_*` variable and from the bundle
- [ ] Tested with Stripe test cards, including a declined card and a 3-D Secure card
- [ ] Refund path exercised end to end
- [ ] Stock release on failed and expired payments decided and implemented
- [ ] Checkout copy updated — it currently, correctly, says payment is not collected
