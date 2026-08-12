import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.625rem] font-medium tracking-[0.12em] uppercase',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        accent: 'border-transparent bg-accent-soft text-ink',
        soft: 'border-transparent bg-surface-muted text-muted-foreground',
        outline: 'border-border-strong bg-surface/80 text-foreground backdrop-blur-sm',
        sale: 'border-transparent bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-blush-100 text-espresso-700',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
