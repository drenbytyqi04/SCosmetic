'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { selectWishlistCount, useWishlistStore } from '@/lib/wishlist/store';
import { cn } from '@/lib/utils/cn';

/** Header wishlist link with a saved-item count, suppressed until hydration. */
export function WishlistLink({ className }: { className?: string }) {
  const hydrated = useWishlistStore((state) => state.hydrated);
  const savedCount = useWishlistStore(selectWishlistCount);
  const count = hydrated ? savedCount : 0;

  return (
    <Link
      href="/wishlist"
      aria-label={count > 0 ? `Wishlist, ${count} saved` : 'Wishlist'}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10',
        className,
      )}
    >
      <Heart className="size-[18px]" aria-hidden="true" />

      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-espresso-900 px-1 text-[0.625rem] leading-[18px] font-medium tabular-nums text-cream-50"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
