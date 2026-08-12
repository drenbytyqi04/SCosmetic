'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Shade } from '@/types';

/**
 * Shade swatches.
 *
 * A radiogroup rather than a row of buttons, so arrow keys move between shades and
 * the selection is announced. Colour is never the only signal — the selected shade
 * is named in text above the swatches and marked with a tick.
 */
export function ShadePicker({
  shades,
  value,
  onChange,
  className,
}: {
  shades: Shade[];
  value: string | undefined;
  onChange: (shadeId: string) => void;
  className?: string;
}) {
  const selected = shades.find((shade) => shade.id === value);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Shade
        </span>
        <span aria-live="polite" className="text-sm text-foreground">
          {selected ? selected.name : 'Select a shade'}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Choose a shade"
        aria-required="true"
        className="flex flex-wrap gap-2.5"
      >
        {shades.map((shade) => {
          const isSelected = shade.id === value;

          return (
            <button
              key={shade.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={shade.name}
              title={shade.name}
              onClick={() => onChange(shade.id)}
              className={cn(
                'relative flex size-9 items-center justify-center rounded-full transition-all duration-200',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                isSelected
                  ? 'ring-1 ring-espresso-900 ring-offset-2 ring-offset-background'
                  : 'ring-1 ring-border hover:ring-border-strong',
              )}
              style={{ backgroundColor: shade.hex }}
            >
              {isSelected && (
                <Check
                  className="size-4 text-cream-50 mix-blend-difference"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
