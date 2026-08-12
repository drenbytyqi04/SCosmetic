import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from '@/components/products/add-to-cart-button';
import { ProductBadges } from '@/components/products/product-badges';
import { ProductPrice } from '@/components/products/product-price';
import { ProductRating } from '@/components/products/product-rating';
import { WishlistButton } from '@/components/products/wishlist-button';
import { categoryBlurDataUrl, imageSizes } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';
import type { Product } from '@/types';

/**
 * Product tile.
 *
 * A Server Component: only the wishlist toggle and the add-to-bag control ship
 * JavaScript. The card's link, image and copy are static markup.
 *
 * The wishlist button is a sibling of the link rather than a descendant — nesting a
 * button inside an anchor is invalid and breaks keyboard activation.
 */
export interface ProductCardProps {
  product: Product;
  /** Set on the first row of the first grid so the LCP image is not lazy-loaded. */
  priority?: boolean;
  /** Compact tiles are used in the related-products rail. */
  compact?: boolean;
  className?: string;
}

export function ProductCard({ product, priority = false, compact = false, className }: ProductCardProps) {
  const href = `/products/${product.slug}`;
  const primaryImage = product.images[0] ?? '/images/editorial/og.png';
  const hoverImage = product.images[1];
  const shadeCount = product.shades?.length ?? 0;

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative overflow-hidden rounded-lg bg-cream-200">
        <ProductBadges product={product} />
        <WishlistButton productId={product.id} productName={product.name} />

        {/*
          The image is a second link to the same destination as the heading below.
          Removing it from the accessibility tree — rather than duplicating the
          product name — means a screen reader announces one link per card, and the
          empty alt is correct because the image carries no information the heading
          does not already give.
        */}
        <Link
          href={href}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="relative aspect-4/5 w-full">
            <Image
              src={primaryImage}
              alt=""
              fill
              sizes={imageSizes.productCard}
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              placeholder="blur"
              blurDataURL={categoryBlurDataUrl(product.category)}
              className={cn(
                'object-cover transition-all duration-700 ease-[var(--ease-out-soft)]',
                hoverImage && 'group-hover:opacity-0',
                product.stock <= 0 && 'opacity-70 saturate-50',
              )}
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt=""
                fill
                sizes={imageSizes.productCard}
                loading="lazy"
                placeholder="blur"
                blurDataURL={categoryBlurDataUrl(product.category)}
                className="object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-out-soft)] group-hover:opacity-100"
              />
            )}
          </div>
        </Link>

        {/*
          Quick add sits over the image. It is always in the DOM and always reachable
          by keyboard; on pointer devices it fades in on hover or focus so the tile
          stays quiet at rest.
        */}
        {!compact && (
          <div
            className={cn(
              'absolute inset-x-3 bottom-3 z-10 transition-all duration-400 ease-[var(--ease-out-soft)]',
              'md:translate-y-2 md:opacity-0',
              'md:group-hover:translate-y-0 md:group-hover:opacity-100',
              'md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100',
            )}
          >
            <AddToCartButton
              product={product}
              requireShadeChoice
              openDrawer
              size="sm"
              variant="primary"
              block
              className="shadow-lift"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-4">
        <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-champagne-500 uppercase">
          {product.brand}
        </p>

        <h3 className="font-serif text-lg leading-snug font-normal text-foreground">
          <Link
            href={href}
            className="transition-colors hover:text-espresso-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {product.name}
          </Link>
        </h3>

        {!compact && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {product.tagline}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <ProductPrice price={product.price} salePrice={product.salePrice} size="sm" />
          {product.rating && <ProductRating rating={product.rating} showCount={false} />}
        </div>

        {shadeCount > 1 && (
          <p className="text-[0.6875rem] tracking-[0.08em] text-muted-foreground uppercase">
            {shadeCount} shades
          </p>
        )}
      </div>
    </article>
  );
}
