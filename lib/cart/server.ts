import 'server-only';

import { buildCartItem } from '@/lib/cart/items';
import { getCouponRepository, normaliseCouponCode } from '@/lib/cart/coupons';
import { priceCart } from '@/lib/cart/pricing';
import { getProductRepository } from '@/lib/products/repository';
import type { AppliedCoupon, CartItem, CartTotals, ShippingMethod } from '@/types';

/**
 * Server-side cart resolution.
 *
 * The browser sends product ids, shades and quantities — never prices. Everything
 * chargeable is rebuilt here from the catalogue, which is what stops a tampered
 * client from setting its own totals.
 */

export interface CartLineInput {
  productId: string;
  shadeId?: string;
  quantity: number;
}

export interface ResolvedCart {
  items: CartItem[];
  totals: CartTotals;
  appliedCoupon?: AppliedCoupon;
  /** Human-readable notes about lines that were adjusted or dropped. */
  adjustments: string[];
  /** True when nothing purchasable survived resolution. */
  isEmpty: boolean;
}

export async function resolveCart(
  lines: CartLineInput[],
  options: { couponCode?: string; shippingMethod?: ShippingMethod } = {},
): Promise<ResolvedCart> {
  const repository = getProductRepository();
  const adjustments: string[] = [];
  const items: CartItem[] = [];

  // Merge duplicate lines before pricing so a repeated key cannot bypass the cap.
  const merged = new Map<string, CartLineInput>();
  for (const line of lines) {
    const key = `${line.productId}:${line.shadeId ?? ''}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += line.quantity;
    else merged.set(key, { ...line });
  }

  for (const line of merged.values()) {
    const product = await repository.findById(line.productId);

    if (!product) {
      adjustments.push('An item is no longer available and was removed from your bag.');
      continue;
    }
    if (product.stock <= 0) {
      adjustments.push(`${product.name} is out of stock and was removed from your bag.`);
      continue;
    }
    // A shade that no longer exists must not silently become "no shade".
    if (line.shadeId && !product.shades?.some((shade) => shade.id === line.shadeId)) {
      adjustments.push(`The selected shade of ${product.name} is no longer available.`);
      continue;
    }

    const item = buildCartItem(product, line.quantity, line.shadeId);
    if (item.quantity < line.quantity) {
      adjustments.push(
        `Only ${item.quantity} × ${product.name} ${item.quantity === 1 ? 'is' : 'are'} available.`,
      );
    }
    items.push(item);
  }

  const code = options.couponCode ? normaliseCouponCode(options.couponCode) : '';
  const coupon = code ? await getCouponRepository().findByCode(code) : null;

  const { totals, appliedCoupon } = priceCart({
    items,
    coupon,
    shippingMethod: options.shippingMethod ?? 'standard',
  });

  if (code && !appliedCoupon) {
    adjustments.push(`Code ${code} could not be applied to this order.`);
  }

  return { items, totals, appliedCoupon, adjustments, isEmpty: items.length === 0 };
}
