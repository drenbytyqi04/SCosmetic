import { cn } from '@/lib/utils/cn';

/** Threshold below which stock is surfaced as urgency rather than just availability. */
const LOW_STOCK_THRESHOLD = 8;

/**
 * Stock status. Shows a real number only when stock is genuinely low — inventing
 * scarcity is both dishonest and, once customers notice, ineffective.
 */
export function StockIndicator({ stock, className }: { stock: number; className?: string }) {
  const state =
    stock <= 0 ? 'out' : stock <= LOW_STOCK_THRESHOLD ? 'low' : ('in' as const);

  const label =
    state === 'out'
      ? 'Out of stock'
      : state === 'low'
        ? `Only ${stock} left`
        : 'In stock';

  return (
    <p
      className={cn(
        'flex items-center gap-2 text-xs',
        state === 'out'
          ? 'text-muted-foreground'
          : state === 'low'
            ? 'text-destructive'
            : 'text-success',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full',
          state === 'out' ? 'bg-sand-300' : state === 'low' ? 'bg-destructive' : 'bg-success',
        )}
      />
      {label}
    </p>
  );
}
