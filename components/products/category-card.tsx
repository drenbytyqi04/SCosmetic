import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { categoryBlurDataUrl, imageSizes } from '@/lib/utils/image';
import { pluralise } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Category } from '@/types';

/**
 * Category tile.
 *
 * One link covering the whole card, so the entire tile is a single target on touch
 * and a single tab stop on a keyboard.
 */
export function CategoryCard({
  category,
  productCount,
  size = 'md',
  priority = false,
  className,
}: {
  category: Category;
  productCount?: number;
  size?: 'md' | 'lg';
  priority?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        'group lift relative flex overflow-hidden rounded-lg bg-cream-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        size === 'lg' ? 'aspect-4/5 sm:aspect-3/4' : 'aspect-4/5',
        className,
      )}
    >
      <Image
        src={category.image}
        alt=""
        fill
        sizes={imageSizes.categoryCard}
        priority={priority}
        placeholder="blur"
        blurDataURL={categoryBlurDataUrl(category.slug)}
        className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-105"
      />

      {/* Scrim: keeps the label legible over any part of the artwork. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent"
      />

      <div className="relative mt-auto flex w-full flex-col gap-1 p-5 sm:p-6">
        <span className="text-[0.625rem] font-medium tracking-[0.18em] text-cream-200/90 uppercase">
          {category.tagline}
        </span>

        <h3
          className={cn(
            'font-serif font-light text-cream-50',
            size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-2xl',
          )}
        >
          {category.name}
        </h3>

        <span className="mt-1 inline-flex items-center gap-2 text-xs tracking-[0.1em] text-cream-100/85 uppercase">
          {typeof productCount === 'number' ? pluralise(productCount, 'product') : 'Explore'}
          <ArrowRight
            className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
