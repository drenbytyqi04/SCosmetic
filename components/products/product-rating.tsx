import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Star rating.
 *
 * The stars are decorative; the accessible value comes from a single text label, so
 * a screen reader hears "4.8 out of 5, 214 reviews" rather than five icon names.
 */
export function ProductRating({
  rating,
  reviewCount,
  size = 'sm',
  showCount = true,
  className,
}: {
  rating?: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
  className?: string;
}) {
  if (!rating) return null;

  const rounded = Math.round(rating);
  const starSize = size === 'sm' ? 'size-3' : 'size-4';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              starSize,
              index < rounded ? 'fill-champagne-400 text-champagne-400' : 'text-sand-300',
            )}
          />
        ))}
      </span>

      <span
        className={cn('tabular-nums text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}
      >
        <span className="sr-only">Rated </span>
        {rating.toFixed(1)}
        <span className="sr-only"> out of 5</span>
        {showCount && reviewCount ? (
          <>
            <span aria-hidden="true"> · {reviewCount}</span>
            <span className="sr-only">, from {reviewCount} reviews</span>
          </>
        ) : null}
      </span>
    </div>
  );
}
