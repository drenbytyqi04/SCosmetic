import { commerceConfig } from '@/lib/config/site';
import type { CartItem, Product } from '@/types';

/**
 * Turns a product (plus optional shade) into a cart line.
 *
 * Deliberately pure and free of any data-layer import: both the client store and
 * the server pricing endpoint call it, so it must be safe to bundle for the browser.
 */
export function buildCartItem(product: Product, quantity: number, shadeId?: string): CartItem {
  const shade = shadeId ? product.shades?.find((candidate) => candidate.id === shadeId) : undefined;
  const unitPrice = product.salePrice ?? product.price;

  const item: CartItem = {
    key: cartItemKey(product.id, shade?.id),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.images[0] ?? '/images/editorial/og.png',
    unitPrice,
    quantity: clampQuantity(quantity, product.stock),
    maxQuantity: Math.min(product.stock, commerceConfig.maxQuantityPerLine),
  };

  if (product.salePrice !== undefined) item.compareAtPrice = product.price;
  if (shade) {
    item.shadeId = shade.id;
    item.shadeName = shade.name;
  }

  return item;
}

/** Lines are unique per product + shade, so two shades of one lipstick sit apart. */
export function cartItemKey(productId: string, shadeId?: string): string {
  return shadeId ? `${productId}:${shadeId}` : productId;
}

/** Keeps quantity within 1…min(stock, per-line cap). */
export function clampQuantity(quantity: number, stock: number): number {
  const ceiling = Math.max(1, Math.min(stock, commerceConfig.maxQuantityPerLine));
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(1, Math.trunc(quantity)), ceiling);
}
