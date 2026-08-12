'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useWishlistStore } from '@/lib/wishlist/store';
import { cn } from '@/lib/utils/cn';

/**
 * Wishlist toggle.
 *
 * Renders an unsaved state until the persisted store has hydrated, which keeps the
 * server-rendered markup and the first client paint identical.
 */
export function WishlistButton({
  productId,
  productName,
  variant = 'floating',
  className,
}: {
  productId: string;
  productName: string;
  variant?: 'floating' | 'inline';
  className?: string;
}) {
  const hydrated = useWishlistStore((state) => state.hydrated);
  const isSaved = useWishlistStore((state) => state.ids.includes(productId));
  const toggle = useWishlistStore((state) => state.toggle);
  const [isPulsing, setIsPulsing] = useState(false);

  const saved = hydrated && isSaved;

  function handleClick() {
    const nowSaved = toggle(productId);
    setIsPulsing(true);
    window.setTimeout(() => setIsPulsing(false), 320);

    toast[nowSaved ? 'success' : 'message'](
      nowSaved ? 'Saved to wishlist' : 'Removed from wishlist',
      { description: productName },
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className={cn(
          'inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors',
          saved ? 'text-destructive' : 'text-muted-foreground hover:text-foreground',
          className,
        )}
      >
        <Heart
          className={cn('size-4 transition-transform', saved && 'fill-current', isPulsing && 'scale-125')}
          aria-hidden="true"
        />
        {saved ? 'Saved' : 'Save for later'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        'absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-surface/85 text-foreground shadow-soft backdrop-blur-sm transition-all duration-300',
        'hover:bg-surface hover:scale-105',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <Heart
        className={cn(
          'size-4 transition-transform duration-300',
          saved ? 'fill-destructive text-destructive' : 'text-espresso-500',
          isPulsing && 'scale-125',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
