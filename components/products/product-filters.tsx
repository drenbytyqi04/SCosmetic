'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { ProductFacets } from '@/types';

/**
 * Catalogue filters.
 *
 * All filter state lives in the URL. That makes every filtered view shareable and
 * back-button friendly, lets the Server Component do the actual filtering, and means
 * this component holds no state of its own beyond the in-flight price drag.
 */

export interface ProductFiltersProps {
  facets: ProductFacets;
  /** Set when the page already scopes a category (a category page), hiding that group. */
  lockedCategory?: boolean;
  className?: string;
}

/** Reads a comma-separated multi-value param. */
function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  return raw ? raw.split(',').filter(Boolean) : [];
}

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // Any filter change invalidates the current page position.
      params.delete('page');
      const query = params.toString();

      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return { commit, isPending, searchParams, pathname, router };
}

export function ProductFilters({ facets, lockedCategory = false, className }: ProductFiltersProps) {
  const { commit, isPending, searchParams } = useFilterNavigation();

  const selectedCategories = readList(searchParams, 'category');
  const selectedBrands = readList(searchParams, 'brand');
  const onSale = searchParams.get('sale') === '1';
  const inStock = searchParams.get('stock') === '1';

  const { min, max } = facets.priceRange;
  const currentMin = Number(searchParams.get('min') ?? min / 100) * 100;
  const currentMax = Number(searchParams.get('max') ?? max / 100) * 100;

  // Local mirror so dragging feels immediate; the URL is only written on commit.
  const [priceDraft, setPriceDraft] = useState<[number, number]>([
    Number.isFinite(currentMin) ? currentMin : min,
    Number.isFinite(currentMax) ? currentMax : max,
  ]);

  const toggleListValue = (key: string, value: string) => {
    commit((params) => {
      const current = readList(params, key);
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];

      if (next.length) params.set(key, next.join(','));
      else params.delete(key);
    });
  };

  const toggleFlag = (key: string, enabled: boolean) => {
    commit((params) => {
      if (enabled) params.set(key, '1');
      else params.delete(key);
    });
  };

  const commitPrice = (values: number[]) => {
    const [low, high] = [values[0] ?? min, values[1] ?? max];
    commit((params) => {
      if (low > min) params.set('min', String(low / 100));
      else params.delete('min');
      if (high < max) params.set('max', String(high / 100));
      else params.delete('max');
    });
  };

  return (
    <div
      className={cn('flex flex-col', isPending && 'pointer-events-none opacity-60', className)}
      aria-busy={isPending}
    >
      <Accordion
        type="multiple"
        defaultValue={['category', 'price', 'brand']}
        className="border-t border-border"
      >
        {!lockedCategory && facets.categories.length > 1 && (
          <AccordionItem value="category">
            <AccordionTrigger>Category</AccordionTrigger>
            <AccordionContent>
              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">Filter by category</legend>
                {facets.categories.map((category) => (
                  <FilterCheckbox
                    key={category.value}
                    label={category.label}
                    count={category.count}
                    checked={selectedCategories.includes(category.value)}
                    onChange={() => toggleListValue('category', category.value)}
                  />
                ))}
              </fieldset>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="price">
          <AccordionTrigger>Price</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4 pt-1">
              <Slider
                value={priceDraft}
                min={min}
                max={max}
                step={100}
                minStepsBetweenThumbs={1}
                thumbLabels={['Minimum price', 'Maximum price']}
                onValueChange={(values) => setPriceDraft([values[0] ?? min, values[1] ?? max])}
                onValueCommit={commitPrice}
              />
              <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
                <span>{formatPrice(priceDraft[0])}</span>
                <span>{formatPrice(priceDraft[1])}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {facets.brands.length > 1 && (
          <AccordionItem value="brand">
            <AccordionTrigger>Brand</AccordionTrigger>
            <AccordionContent>
              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">Filter by brand</legend>
                {facets.brands.map((brand) => (
                  <FilterCheckbox
                    key={brand.value}
                    label={brand.value}
                    count={brand.count}
                    checked={selectedBrands.includes(brand.value)}
                    onChange={() => toggleListValue('brand', brand.value)}
                  />
                ))}
              </fieldset>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="availability">
          <AccordionTrigger>Availability</AccordionTrigger>
          <AccordionContent>
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">Filter by availability</legend>
              <FilterCheckbox
                label="On sale"
                checked={onSale}
                onChange={() => toggleFlag('sale', !onSale)}
              />
              <FilterCheckbox
                label="In stock only"
                checked={inStock}
                onChange={() => toggleFlag('stock', !inStock)}
              />
            </fieldset>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 text-sm text-foreground">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className="flex-1 transition-colors group-hover:text-espresso-500">{label}</span>
      {typeof count === 'number' && (
        <span className="text-xs tabular-nums text-muted-foreground/70">{count}</span>
      )}
    </label>
  );
}

/**
 * Active filter chips. Gives the visitor a one-tap way back out of a narrow result
 * set, which matters most on mobile where the filter panel is hidden.
 */
export function ActiveFilters({ facets }: { facets: ProductFacets }) {
  const { commit, searchParams, pathname, router } = useFilterNavigation();

  const chips = useMemo(() => {
    const entries: Array<{ key: string; label: string; clear: (params: URLSearchParams) => void }> = [];

    const query = searchParams.get('q');
    if (query) {
      entries.push({
        key: `q-${query}`,
        label: `“${query}”`,
        clear: (params) => params.delete('q'),
      });
    }

    for (const value of readList(searchParams, 'category')) {
      const label = facets.categories.find((category) => category.value === value)?.label ?? value;
      entries.push({
        key: `category-${value}`,
        label,
        clear: (params) => {
          const next = readList(params, 'category').filter((entry) => entry !== value);
          if (next.length) params.set('category', next.join(','));
          else params.delete('category');
        },
      });
    }

    for (const value of readList(searchParams, 'brand')) {
      entries.push({
        key: `brand-${value}`,
        label: value,
        clear: (params) => {
          const next = readList(params, 'brand').filter((entry) => entry !== value);
          if (next.length) params.set('brand', next.join(','));
          else params.delete('brand');
        },
      });
    }

    const min = searchParams.get('min');
    const max = searchParams.get('max');
    if (min || max) {
      entries.push({
        key: 'price',
        label: `${min ? formatPrice(Number(min) * 100) : formatPrice(facets.priceRange.min)} – ${
          max ? formatPrice(Number(max) * 100) : formatPrice(facets.priceRange.max)
        }`,
        clear: (params) => {
          params.delete('min');
          params.delete('max');
        },
      });
    }

    if (searchParams.get('sale') === '1') {
      entries.push({ key: 'sale', label: 'On sale', clear: (params) => params.delete('sale') });
    }
    if (searchParams.get('stock') === '1') {
      entries.push({ key: 'stock', label: 'In stock', clear: (params) => params.delete('stock') });
    }
    for (const tag of readList(searchParams, 'tag')) {
      const labels: Record<string, string> = {
        featured: 'Featured',
        bestseller: 'Bestsellers',
        newArrival: 'New in',
      };
      entries.push({
        key: `tag-${tag}`,
        label: labels[tag] ?? tag,
        clear: (params) => params.delete('tag'),
      });
    }

    return entries;
  }, [facets, searchParams]);

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">Active filters</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => commit(chip.clear)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {chip.label}
          <X className="size-3 opacity-60" aria-hidden="true" />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => router.push(pathname, { scroll: false })}
        className="ml-1 text-xs tracking-[0.08em] text-muted-foreground uppercase underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}

/** Mobile entry point: the same filter controls inside a bottom sheet. */
export function MobileFilters({
  facets,
  lockedCategory = false,
  activeCount,
}: ProductFiltersProps & { activeCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <Badge variant="default" className="ml-1 px-1.5 py-0.5">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="lg:hidden">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <ProductFilters facets={facets} lockedCategory={lockedCategory} />
        </SheetBody>
        <SheetFooter>
          <Button block onClick={() => setOpen(false)}>
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
