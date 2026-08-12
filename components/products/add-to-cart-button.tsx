'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCartStore } from '@/lib/cart/store';
import { formatPrice } from '@/lib/utils/format';
import type { Product } from '@/types';

/**
 * Add to bag.
 *
 * Adds to the local cart immediately — the bag is client state, so there is no
 * reason to make the customer wait on a round trip — then confirms with a toast.
 * Server-side re-pricing happens at checkout.
 *
 * Products with more than one shade cannot be added from a grid, so the button
 * becomes a link to the detail page where a shade can be chosen.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  shadeId,
  requireShadeChoice = false,
  openDrawer = false,
  size = 'md',
  variant = 'primary',
  block = false,
  showPrice = false,
  className,
}: {
  product: Product;
  quantity?: number;
  shadeId?: string;
  /** True on grids: send shade-based products to their detail page instead. */
  requireShadeChoice?: boolean;
  openDrawer?: boolean;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  block?: boolean;
  showPrice?: boolean;
  className?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useCartStore((state) => state.openDrawer);
  const [isPending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const needsShade = requireShadeChoice && (product.shades?.length ?? 0) > 1 && !shadeId;

  if (isOutOfStock) {
    return (
      <Button variant="outline" size={size} block={block} disabled className={className}>
        Sold out
      </Button>
    );
  }

  if (needsShade) {
    return (
      <Button asChild variant={variant} size={size} block={block} className={className}>
        <Link href={`/products/${product.slug}`}>Choose shade</Link>
      </Button>
    );
  }

  function handleAdd() {
    startTransition(() => {
      const item = addItem(product, quantity, shadeId);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1800);

      toast.success('Added to your bag', {
        description: [item.name, item.shadeName].filter(Boolean).join(' · '),
        action: { label: 'View bag', onClick: () => openCartDrawer() },
      });

      if (openDrawer) openCartDrawer();
    });
  }

  return (
    <Button
      variant={variant}
      size={size}
      block={block}
      onClick={handleAdd}
      disabled={isPending}
      className={className}
    >
      {isPending ? (
        <Spinner label="Adding to bag" />
      ) : justAdded ? (
        <Check aria-hidden="true" />
      ) : (
        <ShoppingBag aria-hidden="true" />
      )}
      <span>{justAdded ? 'Added' : 'Add to bag'}</span>
      {showPrice && (
        <span className="ml-1 tabular-nums opacity-80">
          {formatPrice(product.salePrice ?? product.price)}
        </span>
      )}
    </Button>
  );
}
