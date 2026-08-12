import { Badge } from '@/components/ui/badge';
import { formatDiscountPercent } from '@/lib/utils/format';
import type { Product } from '@/types';

/**
 * Merchandising flags for a product tile. Capped at two so the image is never
 * covered in labels — sale and stock status outrank the vanity badges.
 */
export function ProductBadges({ product, limit = 2 }: { product: Product; limit?: number }) {
  const badges: Array<{ key: string; label: string; variant: 'sale' | 'accent' | 'soft' | 'outline' }> = [];

  if (product.stock <= 0) {
    badges.push({ key: 'oos', label: 'Sold out', variant: 'soft' });
  } else if (product.salePrice !== undefined) {
    badges.push({
      key: 'sale',
      label: `−${formatDiscountPercent(product.price, product.salePrice)}%`,
      variant: 'sale',
    });
  }

  if (product.newArrival) badges.push({ key: 'new', label: 'New in', variant: 'accent' });
  if (product.bestseller) badges.push({ key: 'best', label: 'Bestseller', variant: 'outline' });

  const visible = badges.slice(0, limit);
  if (!visible.length) return null;

  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
      {visible.map((badge) => (
        <Badge key={badge.key} variant={badge.variant}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
