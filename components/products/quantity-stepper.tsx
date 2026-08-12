'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Quantity control.
 *
 * A real `<input type="number">` between two buttons, so it works with a keyboard,
 * a screen reader and a mobile numeric keypad rather than only with taps.
 */
export function QuantityStepper({
  value,
  min = 1,
  max = 10,
  onChange,
  disabled = false,
  label = 'Quantity',
  size = 'md',
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const buttonSize = size === 'sm' ? 'size-8' : 'size-10';
  const iconSize = size === 'sm' ? 'size-3' : 'size-3.5';

  const clamp = (next: number) => Math.min(Math.max(next, min), max);

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-sm border border-border-strong bg-surface',
        disabled && 'opacity-60',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={cn(
          buttonSize,
          'flex items-center justify-center text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        <Minus className={iconSize} aria-hidden="true" />
      </button>

      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(next)) onChange(clamp(next));
        }}
        className={cn(
          size === 'sm' ? 'w-9 text-xs' : 'w-11 text-sm',
          'border-x border-border bg-transparent py-0 text-center tabular-nums text-foreground',
          'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
          'self-stretch',
        )}
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={cn(
          buttonSize,
          'flex items-center justify-center text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        <Plus className={iconSize} aria-hidden="true" />
      </button>
    </div>
  );
}
