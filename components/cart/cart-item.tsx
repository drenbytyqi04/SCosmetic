'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { QuantityStepper } from '@/components/products/quantity-stepper';
import { useCartStore } from '@/lib/cart/store';
import { formatPrice } from '@/lib/utils/format';
import { imageSizes } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';
import type { CartItem as CartItemType } from '@/types';

/**
 * One cart line.
 *
 * Reads the mutators from the store rather than taking callbacks, so the same row
 * works in the drawer, on the cart page and in the checkout summary without any
 * prop plumbing.
 */
export function CartItem({
  item,
  variant = 'default',
  readOnly = false,
}: {
  item: CartItemType;
  variant?: 'default' | 'compact';
  readOnly?: boolean;
}) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const lineTotal = item.unitPrice * item.quantity;
  const compact = variant === 'compact';

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/products/${item.slug}`}
        className="relative shrink-0 overflow-hidden rounded-sm bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className={cn('block', compact ? 'size-16' : 'size-20 sm:size-24')}>
          <Image
            src={item.image}
            alt=""
            fill
            sizes={imageSizes.cartLine}
            className="object-cover"
          />
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[0.625rem] font-medium tracking-[0.14em] text-champagne-500 uppercase">
          {item.brand}
        </p>

        <h3 className={cn('font-serif font-normal text-foreground', compact ? 'text-sm' : 'text-base')}>
          <Link
            href={`/products/${item.slug}`}
            className="transition-colors hover:text-espresso-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {item.name}
          </Link>
        </h3>

        {item.shadeName && (
          <p className="text-xs text-muted-foreground">Shade: {item.shadeName}</p>
        )}

        {readOnly ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {item.quantity} × {formatPrice(item.unitPrice)}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={item.quantity}
              max={item.maxQuantity}
              size="sm"
              label={`Quantity for ${item.name}`}
              onChange={(quantity) => setQuantity(item.key, quantity)}
            />

            <button
              type="button"
              onClick={() => removeItem(item.key)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
              <span className="sr-only"> {item.name} from your bag</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-sm font-medium tabular-nums text-foreground">{formatPrice(lineTotal)}</p>
        {item.compareAtPrice && item.compareAtPrice > item.unitPrice && (
          <s className="text-xs tabular-nums text-muted-foreground/70">
            <span className="sr-only">Original price: </span>
            {formatPrice(item.compareAtPrice * item.quantity)}
          </s>
        )}
      </div>
    </li>
  );
}
