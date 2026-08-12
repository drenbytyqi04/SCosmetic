import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Single KPI tile for the admin dashboard. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'accent' | 'warning';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-surface p-5',
        tone === 'accent' && 'border-champagne-300 bg-cream-200/60',
        tone === 'warning' && 'border-destructive/25 bg-destructive-soft/50',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </p>
        {Icon && <Icon className="size-4 shrink-0 text-champagne-500" aria-hidden="true" />}
      </div>

      <p className="font-serif text-3xl leading-none font-light text-foreground tabular-nums">
        {value}
      </p>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * Fourteen-day revenue sparkline, drawn as inline SVG.
 *
 * Decorative: the figures it visualises are already in the tiles above it, so it is
 * hidden from assistive technology rather than given a fabricated text equivalent.
 */
export function RevenueSparkline({
  data,
  className,
}: {
  data: Array<{ date: string; revenue: number }>;
  className?: string;
}) {
  if (data.length < 2) return null;

  const max = Math.max(...data.map((point) => point.revenue), 1);
  const width = 100;
  const height = 32;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (point.revenue / max) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn('h-8 w-full', className)}
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--color-champagne-500)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
