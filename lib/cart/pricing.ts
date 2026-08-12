import { commerceConfig } from '@/lib/config/site';
import type {
  AppliedCoupon,
  CartItem,
  CartTotals,
  Cents,
  Coupon,
  ShippingMethod,
} from '@/types';

/**
 * Cart arithmetic.
 *
 * Pure and shared: the client store uses it for instant feedback, and the order
 * endpoint uses it to recompute totals from scratch. The client's numbers are
 * only ever a preview — the server's are what get charged.
 */

export interface PriceCartInput {
  items: CartItem[];
  /** Raw coupon from the catalogue; validated here before it can discount anything. */
  coupon?: Coupon | null;
  /** An already server-verified coupon. Takes precedence over `coupon`. */
  applied?: AppliedCoupon | null;
  shippingMethod?: ShippingMethod;
}

export interface PricedCart {
  totals: CartTotals;
  appliedCoupon?: AppliedCoupon;
}

export function calculateSubtotal(items: CartItem[]): Cents {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function countItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Total saving versus list price, for the "you saved" line. */
export function calculateSavings(items: CartItem[]): Cents {
  return items.reduce((sum, item) => {
    if (!item.compareAtPrice || item.compareAtPrice <= item.unitPrice) return sum;
    return sum + (item.compareAtPrice - item.unitPrice) * item.quantity;
  }, 0);
}

export function isCouponUsable(coupon: Coupon, subtotal: Cents): boolean {
  if (!coupon.active) return false;
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now()) return false;
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return false;
  return true;
}

function couponDiscount(coupon: Coupon, subtotal: Cents): Cents {
  switch (coupon.type) {
    case 'percentage':
      return Math.round((subtotal * Math.min(coupon.value, 100)) / 100);
    case 'fixed':
      // Never discount below zero.
      return Math.min(coupon.value, subtotal);
    case 'free_shipping':
      return 0;
  }
}

function shippingCost(
  method: ShippingMethod,
  discountedSubtotal: Cents,
  freeShipping: boolean,
): Cents {
  if (discountedSubtotal <= 0) return 0;
  if (freeShipping && method === 'standard') return 0;
  if (method === 'standard' && discountedSubtotal >= commerceConfig.freeShippingThreshold) return 0;
  return commerceConfig.shippingRates[method].price;
}

/**
 * The single pricing function. Order of operations matters and is fixed here:
 * subtotal → coupon discount → shipping → VAT on the discounted subtotal.
 */
export function priceCart({
  items,
  coupon,
  applied,
  shippingMethod = 'standard',
}: PriceCartInput): PricedCart {
  const subtotal = calculateSubtotal(items);

  const usable = coupon && isCouponUsable(coupon, subtotal) ? coupon : null;
  const source: AppliedCoupon | null =
    applied ??
    (usable
      ? {
          code: usable.code,
          type: usable.type,
          description: usable.description,
          amount:
            usable.type === 'free_shipping'
              ? commerceConfig.shippingRates.standard.price
              : couponDiscount(usable, subtotal),
        }
      : null);

  const discount = source && source.type !== 'free_shipping' ? Math.min(source.amount, subtotal) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = shippingCost(
    shippingMethod,
    discountedSubtotal,
    source?.type === 'free_shipping',
  );
  const tax = Math.round(discountedSubtotal * commerceConfig.taxRate);

  const totals: CartTotals = {
    subtotal,
    discount,
    shipping,
    tax,
    total: discountedSubtotal + shipping + tax,
    itemCount: countItems(items),
    freeShippingRemaining:
      discountedSubtotal > 0
        ? Math.max(0, commerceConfig.freeShippingThreshold - discountedSubtotal)
        : commerceConfig.freeShippingThreshold,
  };

  return source ? { totals, appliedCoupon: source } : { totals };
}

/** Empty-cart totals, so the UI never has to special-case `undefined`. */
export const emptyTotals: CartTotals = {
  subtotal: 0,
  discount: 0,
  shipping: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
  freeShippingRemaining: commerceConfig.freeShippingThreshold,
};
