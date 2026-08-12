'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { adjustStockAction } from '@/lib/admin/actions';
import { cn } from '@/lib/utils/cn';

/**
 * Relative stock adjustment.
 *
 * Deliberately a delta rather than an absolute value: two people receiving the same
 * delivery both add what they counted, instead of overwriting each other's total.
 */
export function StockAdjuster({
  productId,
  productName,
  stock,
}: {
  productId: string;
  productName: string;
  stock: number;
}) {
  const router = useRouter();
  const [delta, setDelta] = useState('');
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  function apply(amount: number) {
    if (!Number.isFinite(amount) || amount === 0) return;

    startTransition(async () => {
      const result = await adjustStockAction({ productId, delta: amount });

      if (!result.ok) {
        toast.error('Could not update stock', { description: result.error });
        return;
      }

      setDelta('');
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1600);
      toast.success(`${productName}: ${result.data.stock} in stock`);
      router.refresh();
    });
  }

  const parsedDelta = Number.parseInt(delta, 10);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => apply(-1)}
        disabled={isPending || stock <= 0}
        aria-label={`Decrease stock of ${productName} by one`}
        className="flex size-8 items-center justify-center rounded-sm border border-border-strong text-foreground transition-colors hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => apply(1)}
        disabled={isPending}
        aria-label={`Increase stock of ${productName} by one`}
        className="flex size-8 items-center justify-center rounded-sm border border-border-strong text-foreground transition-colors hover:bg-surface-muted disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply(parsedDelta);
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor={`delta-${productId}`} className="sr-only">
          Stock adjustment for {productName}
        </label>
        <Input
          id={`delta-${productId}`}
          value={delta}
          onChange={(event) => setDelta(event.target.value.replace(/[^-0-9]/g, ''))}
          placeholder="+12"
          inputMode="numeric"
          className="h-8 w-16 text-center text-xs"
        />
        <button
          type="submit"
          disabled={isPending || !Number.isFinite(parsedDelta) || parsedDelta === 0}
          className={cn(
            'flex size-8 items-center justify-center rounded-sm border text-foreground transition-colors disabled:opacity-40',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            justSaved
              ? 'border-success bg-success-soft text-success'
              : 'border-border-strong hover:bg-surface-muted',
          )}
          aria-label={`Apply stock adjustment for ${productName}`}
        >
          {isPending ? (
            <Spinner className="size-3.5" label="Updating stock" />
          ) : (
            <Check className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}
