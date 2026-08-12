import {
  apiSuccess,
  apiValidationError,
  readJson,
  withErrorHandling,
} from '@/lib/api/response';
import { resolveCart } from '@/lib/cart/server';
import { cartPayloadSchema } from '@/lib/validations/cart';

/**
 * POST /api/cart
 *
 * Re-prices a cart against the live catalogue. The client sends ids and quantities;
 * the response is the authoritative set of lines, totals and any adjustments (a shade
 * that went away, a quantity capped by stock).
 *
 * Useful on its own for a "your bag has changed" check before checkout.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const parsed = cartPayloadSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiValidationError(parsed.error);

    const resolved = await resolveCart(parsed.data.items, {
      couponCode: parsed.data.couponCode,
      shippingMethod: parsed.data.shippingMethod,
    });

    return apiSuccess({
      items: resolved.items,
      totals: resolved.totals,
      appliedCoupon: resolved.appliedCoupon ?? null,
      adjustments: resolved.adjustments,
      isEmpty: resolved.isEmpty,
    });
  }, 'cart:price');
}
