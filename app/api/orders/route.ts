import {
  apiError,
  apiSuccess,
  apiValidationError,
  readJson,
  withErrorHandling,
} from '@/lib/api/response';
import { clientKey, rateLimit } from '@/lib/api/rate-limit';
import { resolveCart } from '@/lib/cart/server';
import { getOrderRepository } from '@/lib/orders/repository';
import { getNewsletterRepository } from '@/lib/marketing/repository';
import { getPaymentProvider } from '@/lib/payments/provider';
import { checkoutSchema } from '@/lib/validations/checkout';
import type { OrderLine } from '@/types';

/**
 * POST /api/orders — create an order.
 *
 * The sequence is deliberate and each step is separable, so a real payment provider
 * slots in without the rest changing:
 *
 *   1. validate the submitted details
 *   2. re-price the cart from the catalogue (client prices are ignored entirely)
 *   3. create the order in a `pending` / `requires_payment` state AND reserve stock,
 *      as one atomic step — see OrderRepository.create
 *   4. create a payment intent through the provider
 *   5. hand back where the customer goes next
 *
 * The order is never marked paid here. That only happens on a confirmed payment
 * callback, which is why `markPaid` lives on the repository rather than being called
 * inline.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const limit = rateLimit(clientKey(request, 'orders'), { limit: 8, windowSeconds: 300 });
    if (!limit.success) {
      return apiError('rate_limited', 'Too many attempts. Please wait a moment and try again.', {
        headers: { 'Retry-After': String(limit.retryAfter) },
      });
    }

    const parsed = checkoutSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiValidationError(parsed.error);

    const payload = parsed.data;

    // 2. Authoritative pricing.
    const resolved = await resolveCart(payload.items, {
      couponCode: payload.couponCode,
      shippingMethod: payload.shippingMethod,
    });

    if (resolved.isEmpty) {
      return apiError('conflict', 'None of the items in your bag are available any more.');
    }

    // A stock or shade change is not silently absorbed — the customer is told and
    // asked to confirm, rather than being charged for a different order than they saw.
    if (resolved.adjustments.length) {
      return apiSuccess({
        reference: null,
        redirectUrl: null,
        adjustments: resolved.adjustments,
      });
    }

    const lines: OrderLine[] = resolved.items.map((item) => ({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      image: item.image,
      ...(item.shadeName ? { shadeName: item.shadeName } : {}),
    }));

    // 3. Persist the order and reserve stock together.
    const orders = getOrderRepository();
    const order = await orders.create({
      email: payload.email,
      shippingAddress: payload.shippingAddress,
      shippingMethod: payload.shippingMethod,
      lines,
      totals: resolved.totals,
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(resolved.appliedCoupon ? { couponCode: resolved.appliedCoupon.code } : {}),
      ...(payload.notes ? { notes: payload.notes } : {}),
    });

    /*
     * Null means stock ran out between step 2 and the commit — another customer took the
     * last unit in the meantime. No order exists and nothing was reserved, so this is the
     * same "review your bag" outcome as an adjustment, not an error.
     */
    if (!order) {
      return apiSuccess({
        reference: null,
        redirectUrl: null,
        adjustments: [
          'Something in your bag sold out while you were checking out. Please review it and try again.',
        ],
      });
    }

    // 4. Payment intent. The manual provider records intent to pay; a Stripe adapter
    //    would return a client secret here instead.
    const provider = getPaymentProvider();
    const intent = await provider.createIntent(order);
    if (intent.id) await orders.attachPaymentIntent(order.id, intent.id);

    // Optional marketing opt-in, kept separate from the order itself.
    if (payload.subscribe) {
      await getNewsletterRepository().subscribe({ email: payload.email, source: 'checkout' });
    }

    return apiSuccess({
      reference: order.reference,
      redirectUrl: intent.redirectUrl ?? `/checkout/success?ref=${order.reference}`,
      adjustments: [],
      // Present only when a live provider needs the browser to complete payment.
      ...(intent.clientSecret ? { clientSecret: intent.clientSecret } : {}),
    });
  }, 'orders:create');
}
