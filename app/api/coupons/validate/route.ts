import {
  apiError,
  apiSuccess,
  apiValidationError,
  readJson,
  withErrorHandling,
} from '@/lib/api/response';
import { clientKey, rateLimit } from '@/lib/api/rate-limit';
import { getCouponRepository, normaliseCouponCode } from '@/lib/cart/coupons';
import { isCouponUsable } from '@/lib/cart/pricing';
import { resolveCart } from '@/lib/cart/server';
import { couponValidateSchema } from '@/lib/validations/cart';
import { formatPriceCompact } from '@/lib/utils/format';

/**
 * POST /api/coupons/validate
 *
 * Checks a code against the caller's actual cart and returns the discount it would
 * grant. Rate limited, because an unlimited endpoint that says yes or no to a code is
 * a code-guessing oracle.
 *
 * Failure messages are specific about *why* a valid code did not apply (minimum spend,
 * expiry) but never hint that an unknown code is close to a real one.
 */
export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const limit = rateLimit(clientKey(request, 'coupon'), { limit: 10, windowSeconds: 60 });
    if (!limit.success) {
      return apiError('rate_limited', 'Too many attempts. Please wait a moment and try again.', {
        headers: { 'Retry-After': String(limit.retryAfter) },
      });
    }

    const parsed = couponValidateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiValidationError(parsed.error);

    const code = normaliseCouponCode(parsed.data.code);
    const coupon = await getCouponRepository().findByCode(code);

    if (!coupon || !coupon.active) {
      return apiError('not_found', `${code} is not a valid discount code.`);
    }

    if (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now()) {
      return apiError('conflict', `${code} has expired.`);
    }

    // Price the real cart so the minimum-spend check uses server-side numbers.
    const resolved = await resolveCart(parsed.data.items, {
      shippingMethod: parsed.data.shippingMethod,
    });

    if (resolved.isEmpty) {
      return apiError('bad_request', 'Add something to your bag before applying a code.');
    }

    if (!isCouponUsable(coupon, resolved.totals.subtotal)) {
      const minimum = coupon.minSubtotal ? formatPriceCompact(coupon.minSubtotal) : null;
      return apiError(
        'conflict',
        minimum
          ? `${code} applies to orders over ${minimum}.`
          : `${code} cannot be applied to this order.`,
      );
    }

    const priced = await resolveCart(parsed.data.items, {
      couponCode: code,
      shippingMethod: parsed.data.shippingMethod,
    });

    if (!priced.appliedCoupon) {
      return apiError('conflict', `${code} cannot be applied to this order.`);
    }

    return apiSuccess({ coupon: priced.appliedCoupon, totals: priced.totals });
  }, 'coupons:validate');
}
