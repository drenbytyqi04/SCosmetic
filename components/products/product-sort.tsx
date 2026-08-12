'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductSort as ProductSortValue } from '@/types';

const SORT_OPTIONS: Array<{ value: ProductSortValue; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name-asc', label: 'Name: A–Z' },
];

/** Sort control. Writes to the URL like the filters do, so the two stay in step. */
export function ProductSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = (searchParams.get('sort') ?? 'featured') as ProductSortValue;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'featured') params.delete('sort');
    else params.set('sort', value);
    params.delete('page');

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-sort" className="sr-only">
        Sort products
      </label>
      <Select value={current} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger id="product-sort" className="h-9 w-[11.5rem] text-xs">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
