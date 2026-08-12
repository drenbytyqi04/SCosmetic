'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils/cn';

/**
 * Range slider. Each thumb needs its own accessible name, so callers pass
 * `thumbLabels` — a price filter reads as "Minimum price" / "Maximum price" rather
 * than two anonymous handles.
 */
export interface SliderProps
  extends Omit<React.ComponentProps<typeof SliderPrimitive.Root>, 'children'> {
  thumbLabels?: string[];
}

export function Slider({ className, thumbLabels, value, defaultValue, ...props }: SliderProps) {
  const thumbCount = (value ?? defaultValue ?? [0]).length;

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-sand-200">
        <SliderPrimitive.Range className="absolute h-full bg-espresso-700" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumbLabels?.[index] ?? `Value ${index + 1}`}
          className={cn(
            'block size-4 rounded-full border-2 border-espresso-700 bg-surface shadow-soft transition-transform',
            'hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}
