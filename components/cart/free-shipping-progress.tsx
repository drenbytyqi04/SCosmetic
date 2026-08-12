import { Truck } from 'lucide-react';
import { commerceConfig } from '@/lib/config/site';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Progress toward free shipping.
 *
 * A real `<progress>`-equivalent with `role="progressbar"` so the value is exposed,
 * plus a text line that states the same thing — the bar alone is not the message.
 */
export function FreeShippingProgress({
  remaining,
  subtotal,
  className,
}: {
  remaining: number;
  subtotal: number;
  className?: string;
}) {
  const threshold = commerceConfig.freeShippingThreshold;
  const unlocked = remaining <= 0 && subtotal > 0;
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="flex items-start gap-2 text-xs text-foreground">
        <Truck className="mt-px size-3.5 shrink-0 text-champagne-500" aria-hidden="true" />
        {unlocked ? (
          <span>
            Standard delivery is <strong className="font-medium">free</strong> on this order.
          </span>
        ) : (
          <span>
            Add <strong className="font-medium">{formatPrice(remaining)}</strong> for free standard
            delivery.
          </span>
        )}
      </p>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free delivery"
        className="h-1 w-full overflow-hidden rounded-full bg-sand-200"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-[var(--ease-out-soft)]',
            unlocked ? 'bg-success' : 'bg-champagne-400',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
