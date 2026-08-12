'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { categoryBlurDataUrl, imageSizes } from '@/lib/utils/image';
import type { CategorySlug } from '@/types';

/**
 * Product image gallery.
 *
 * The main image is a real `<Image>` swap rather than a carousel — fewer moving
 * parts, no gesture library, and the first frame is server-rendered with priority so
 * it can be the LCP element. Thumbnails are a proper tab list so the whole gallery
 * is keyboard operable.
 */
export function ProductGallery({
  images,
  productName,
  category,
  className,
}: {
  images: string[];
  productName: string;
  category: CategorySlug;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeImages = images.length ? images : ['/images/editorial/og.png'];
  const active = safeImages[Math.min(activeIndex, safeImages.length - 1)] ?? safeImages[0]!;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-lg bg-cream-200">
        <Image
          key={active}
          src={active}
          alt={`${productName} — view ${activeIndex + 1} of ${safeImages.length}`}
          fill
          sizes={imageSizes.productHero}
          priority
          placeholder="blur"
          blurDataURL={categoryBlurDataUrl(category)}
          className="animate-in fade-in object-cover duration-500"
        />
      </div>

      {safeImages.length > 1 && (
        <div
          role="tablist"
          aria-label={`${productName} images`}
          className="flex flex-wrap gap-3"
        >
          {safeImages.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={image}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show image ${index + 1} of ${safeImages.length}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'relative size-20 shrink-0 overflow-hidden rounded-sm bg-cream-200 transition-all duration-300',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  isActive
                    ? 'ring-1 ring-espresso-900 ring-offset-2 ring-offset-background'
                    : 'opacity-70 hover:opacity-100',
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes={imageSizes.thumbnail}
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
