import { formatDiscountPercent, formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Cents } from '@/types';

/**
 * Price display.
 *
 * When a product is on sale the original price is marked up with `<s>` and given a
 * screen-reader prefix, so the discount is conveyed by more than a visual strikethrough.
 */
export function ProductPrice({
  price,
  salePrice,
  size = 'md',
  showPercent = false,
  className,
}: {
  price: Cents;
  salePrice?: Cents;
  size?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
  className?: string;
}) {
  const onSale = salePrice !== undefined && salePrice < price;
  const current = onSale ? salePrice : price;

  const sizes = {
    sm: { current: 'text-sm', original: 'text-xs' },
    md: { current: 'text-base', original: 'text-sm' },
    lg: { current: 'text-2xl', original: 'text-base' },
  } as const;

  return (
    <p className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span
        className={cn(
          'font-medium tabular-nums',
          sizes[size].current,
          onSale ? 'text-destructive' : 'text-foreground',
        )}
      >
        {formatPrice(current)}
      </span>

      {onSale && (
        <>
          <s className={cn('tabular-nums text-muted-foreground/80', sizes[size].original)}>
            <span className="sr-only">Original price: </span>
            {formatPrice(price)}
          </s>
          {showPercent && (
            <span className="text-[0.6875rem] font-medium tracking-[0.08em] text-destructive uppercase">
              −{formatDiscountPercent(price, salePrice)}%
            </span>
          )}
        </>
      )}
    </p>
  );
}
