'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { CouponForm } from '@/components/cart/coupon-form';
import { FreeShippingProgress } from '@/components/cart/free-shipping-progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartSavings, useCartStore, useCartTotals } from '@/lib/cart/store';
import { commerceConfig } from '@/lib/config/site';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Order totals.
 *
 * Reads derived totals from the store so the drawer, the cart page and checkout all
 * show the same arithmetic. VAT is shown as a line rather than folded into the item
 * prices, because that is how it is charged here.
 */
export function CartSummary({
  showCoupon = true,
  showCheckoutButton = true,
  className,
}: {
  showCoupon?: boolean;
  showCheckoutButton?: boolean;
  className?: string;
}) {
  const totals = useCartTotals();
  const savings = useCartSavings();
  const shippingMethod = useCartStore((state) => state.shippingMethod);
  const isEmpty = useCartStore((state) => state.items.length === 0);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {!isEmpty && (
        <FreeShippingProgress
          remaining={totals.freeShippingRemaining}
          subtotal={totals.subtotal - totals.discount}
        />
      )}

      {showCoupon && !isEmpty && <CouponForm />}

      <dl className="flex flex-col gap-2.5 text-sm">
        <Row label="Subtotal" value={formatPrice(totals.subtotal)} />

        {totals.discount > 0 && (
          <Row label="Discount" value={`−${formatPrice(totals.discount)}`} tone="positive" />
        )}

        <Row
          label={`Delivery · ${commerceConfig.shippingRates[shippingMethod].label}`}
          value={totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}
          tone={totals.shipping === 0 ? 'positive' : 'default'}
        />

        <Row
          label={`VAT (${Math.round(commerceConfig.taxRate * 100)}%)`}
          value={formatPrice(totals.tax)}
        />

        <Separator className="my-1.5" />

        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-serif text-lg font-normal text-foreground">Total</dt>
          <dd className="text-xl font-medium tabular-nums text-foreground">
            {formatPrice(totals.total)}
          </dd>
        </div>

        {savings > 0 && (
          <p className="text-xs font-medium text-success">
            You are saving {formatPrice(savings)} on this order.
          </p>
        )}
      </dl>

      {showCheckoutButton && (
        <div className="flex flex-col gap-3">
          {/* An empty bag has nowhere to check out to, so it is a disabled button
              rather than a link with a `disabled` attribute an anchor would ignore. */}
          {isEmpty ? (
            <Button size="lg" block disabled>
              <Lock aria-hidden="true" />
              Proceed to checkout
            </Button>
          ) : (
            <Button asChild size="lg" block>
              <Link href="/checkout">
                <Lock aria-hidden="true" />
                Proceed to checkout
              </Link>
            </Button>
          )}
          <p className="text-center text-[0.6875rem] text-muted-foreground">
            Taxes and delivery are calculated above. No card details are stored by us.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive';
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'tabular-nums',
          tone === 'positive' ? 'font-medium text-success' : 'text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
