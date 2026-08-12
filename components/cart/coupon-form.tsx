'use client';

import { useState } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useCartLineInputs, useCartStore } from '@/lib/cart/store';
import { formatPrice } from '@/lib/utils/format';
import type { ApiResult } from '@/lib/api/response';
import type { AppliedCoupon } from '@/types';

/**
 * Discount code entry.
 *
 * The code is always validated server-side against the live cart — the client never
 * decides that a discount is valid, it only displays the answer.
 */
export function CouponForm() {
  const items = useCartStore((state) => state.items);
  const lineInputs = useCartLineInputs();
  const shippingMethod = useCartStore((state) => state.shippingMethod);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const setCoupon = useCartStore((state) => state.setCoupon);

  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || !items.length) return;

    setStatus('loading');
    setMessage(null);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: trimmed,
          items: lineInputs,
          shippingMethod,
        }),
      });

      const body = (await response.json()) as ApiResult<{ coupon: AppliedCoupon }>;

      if (!body.ok) {
        setStatus('error');
        setMessage(body.error);
        return;
      }

      setCoupon(body.data.coupon);
      setCode('');
      setStatus('idle');
      setMessage(null);
    } catch {
      setStatus('error');
      setMessage('We could not check that code. Please try again.');
    }
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-sm border border-success/25 bg-success-soft px-3.5 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-success">{appliedCoupon.code} applied</p>
            <p className="truncate text-xs text-success/80">
              {appliedCoupon.description}
              {appliedCoupon.type !== 'free_shipping' &&
                ` · −${formatPrice(appliedCoupon.amount)}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCoupon(null)}
          aria-label={`Remove discount code ${appliedCoupon.code}`}
          className="shrink-0 rounded-full p-1 text-success/70 transition-colors hover:bg-success/10 hover:text-success focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="coupon-code" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Tag className="size-3.5" aria-hidden="true" />
        Discount code
      </label>

      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            setStatus('idle');
            setMessage(null);
          }}
          placeholder="WELCOME10"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={message ? 'coupon-message' : undefined}
          className="h-10 flex-1 uppercase"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={status === 'loading' || !code.trim() || !items.length}
          className="h-10"
        >
          {status === 'loading' ? <Spinner label="Checking code" /> : 'Apply'}
        </Button>
      </div>

      {message && (
        <p id="coupon-message" role="alert" className="text-xs font-medium text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
