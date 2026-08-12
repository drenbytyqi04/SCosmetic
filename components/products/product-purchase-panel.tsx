'use client';

import { useState } from 'react';
import { Truck, Undo2 } from 'lucide-react';
import { AddToCartButton } from '@/components/products/add-to-cart-button';
import { QuantityStepper } from '@/components/products/quantity-stepper';
import { ShadePicker } from '@/components/products/shade-picker';
import { StockIndicator } from '@/components/products/stock-indicator';
import { WishlistButton } from '@/components/products/wishlist-button';
import { Separator } from '@/components/ui/separator';
import { commerceConfig } from '@/lib/config/site';
import { formatPriceCompact } from '@/lib/utils/format';
import type { Product } from '@/types';

/**
 * The interactive part of a product page: shade, quantity, add to bag, wishlist.
 *
 * Scoped deliberately narrowly — the surrounding copy, price and structured data all
 * stay in the Server Component, so this is the only JavaScript the page needs.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const shades = product.shades ?? [];
  // Single-shade products need no choice; pre-select so the button is live immediately.
  const [shadeId, setShadeId] = useState<string | undefined>(
    shades.length === 1 ? shades[0]?.id : undefined,
  );
  const [quantity, setQuantity] = useState(1);

  const maxQuantity = Math.max(1, Math.min(product.stock, commerceConfig.maxQuantityPerLine));
  const needsShade = shades.length > 1 && !shadeId;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="flex flex-col gap-6">
      {shades.length > 1 && (
        <ShadePicker shades={shades} value={shadeId} onChange={setShadeId} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            Quantity
          </span>
          <QuantityStepper
            value={quantity}
            max={maxQuantity}
            onChange={setQuantity}
            disabled={isOutOfStock}
          />
        </div>

        <div className="flex-1">
          {needsShade ? (
            <button
              type="button"
              disabled
              aria-describedby="shade-required-hint"
              className="h-13 w-full rounded-sm bg-primary/40 text-sm font-medium tracking-[0.1em] text-primary-foreground uppercase"
            >
              Select a shade
            </button>
          ) : (
            <AddToCartButton
              product={product}
              quantity={quantity}
              shadeId={shadeId}
              openDrawer
              size="lg"
              block
            />
          )}
        </div>
      </div>

      {needsShade && (
        <p id="shade-required-hint" className="-mt-3 text-xs text-muted-foreground">
          Choose a shade to add this to your bag.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <StockIndicator stock={product.stock} />
        <WishlistButton productId={product.id} productName={product.name} variant="inline" />
      </div>

      <Separator />

      <ul className="flex flex-col gap-3 text-xs text-muted-foreground">
        <li className="flex items-start gap-2.5">
          <Truck className="mt-px size-4 shrink-0 text-champagne-500" aria-hidden="true" />
          <span>
            Free standard delivery on orders over{' '}
            {formatPriceCompact(commerceConfig.freeShippingThreshold)} ·{' '}
            {commerceConfig.shippingRates.standard.eta} across Kosovo
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Undo2 className="mt-px size-4 shrink-0 text-champagne-500" aria-hidden="true" />
          <span>
            14-day returns on unopened products. Opened cosmetics cannot be returned for
            hygiene reasons.
          </span>
        </li>
      </ul>
    </div>
  );
}
