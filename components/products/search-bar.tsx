'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import { imageSizes } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';
import type { ApiResult } from '@/lib/api/response';

/**
 * Product search with live suggestions.
 *
 * Implements the combobox pattern: the input owns `aria-activedescendant`, the
 * suggestion list is a listbox, and arrow keys, Enter and Escape all behave as a
 * keyboard user expects. Submitting without picking a suggestion runs a full search.
 */

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  salePrice?: number;
  image: string;
}

const DEBOUNCE_MS = 220;
const MIN_QUERY_LENGTH = 2;

export function SearchBar({
  defaultValue = '',
  placeholder = 'Search products, brands, ingredients',
  autoFocus = false,
  onNavigate,
  className,
}: {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  /** Called after a navigation, so a containing sheet can close itself. */
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedQuery = query.trim();
  const isQueryLongEnough = trimmedQuery.length >= MIN_QUERY_LENGTH;
  // Derived rather than cleared in an effect: a query that is too short simply has
  // no visible suggestions, without a second render to empty the array.
  const visibleSuggestions = isQueryLongEnough ? suggestions : [];

  // Debounced suggestion fetch. The abort controller prevents a slow earlier
  // response from overwriting the results of a later keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=6`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as ApiResult<{ products: Suggestion[] }>;
        if (body.ok) {
          setSuggestions(body.data.products);
          setActiveIndex(-1);
        }
      } catch {
        // An aborted or failed request simply leaves the previous suggestions alone;
        // the full search on submit is always available as the fallback.
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function goTo(href: string) {
    setIsOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmedQuery) return;

    if (activeIndex >= 0 && visibleSuggestions[activeIndex]) {
      goTo(`/products/${visibleSuggestions[activeIndex].slug}`);
      return;
    }
    goTo(`/shop?q=${encodeURIComponent(trimmedQuery)}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!visibleSuggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => (index + 1) % visibleSuggestions.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? visibleSuggestions.length - 1 : index - 1));
    }
  }

  const showList = isOpen && isQueryLongEnough;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form role="search" onSubmit={handleSubmit}>
        <label htmlFor={`${listboxId}-input`} className="sr-only">
          Search products
        </label>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <input
            id={`${listboxId}-input`}
            type="search"
            role="combobox"
            autoComplete="off"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            autoFocus={autoFocus}
            value={query}
            placeholder={placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={cn(
              'h-11 w-full rounded-full border border-input bg-surface pr-11 pl-10 text-base text-foreground transition-colors sm:text-sm',
              'placeholder:text-muted-foreground/70',
              'focus-visible:border-espresso-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              '[&::-webkit-search-cancel-button]:hidden',
            )}
          />

          {isLoading ? (
            <Loader2
              className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      {showList && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-lift">
          <ul id={listboxId} role="listbox" aria-label="Search suggestions" className="max-h-96 overflow-y-auto">
            {visibleSuggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goTo(`/products/${suggestion.slug}`)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    index === activeIndex ? 'bg-surface-muted' : 'hover:bg-surface-muted',
                  )}
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xs bg-cream-200">
                    <Image
                      src={suggestion.image}
                      alt=""
                      fill
                      sizes={imageSizes.thumbnail}
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.6875rem] tracking-[0.12em] text-champagne-500 uppercase">
                      {suggestion.brand}
                    </span>
                    <span className="block truncate text-sm text-foreground">{suggestion.name}</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-foreground">
                    {formatPrice(suggestion.salePrice ?? suggestion.price)}
                  </span>
                </button>
              </li>
            ))}

            {!visibleSuggestions.length && !isLoading && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No products match “{trimmedQuery}”.
              </li>
            )}
          </ul>

          {visibleSuggestions.length > 0 && (
            <button
              type="button"
              onClick={() => goTo(`/shop?q=${encodeURIComponent(trimmedQuery)}`)}
              className="block w-full border-t border-border bg-cream-100 px-4 py-3 text-center text-xs tracking-[0.1em] text-foreground uppercase transition-colors hover:bg-cream-200"
            >
              See all results
            </button>
          )}
        </div>
      )}
    </div>
  );
}
