import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Button.
 *
 * `asChild` renders the styling onto a child element — used to make a `<Link>` look
 * like a button without nesting an anchor inside a button.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-espresso-700 active:bg-ink shadow-soft',
        accent:
          'bg-accent text-accent-foreground hover:bg-champagne-500 hover:text-primary-foreground shadow-soft',
        outline:
          'border border-border-strong bg-transparent text-foreground hover:bg-surface-muted hover:border-espresso-500',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-sand-300',
        ghost: 'bg-transparent text-foreground hover:bg-surface-muted',
        link: 'bg-transparent text-foreground underline-offset-4 hover:underline p-0 h-auto',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft',
      },
      size: {
        sm: 'h-9 rounded-sm px-4 text-xs tracking-wide uppercase [&_svg]:size-4',
        md: 'h-11 rounded-sm px-6 text-[0.8125rem] tracking-[0.08em] uppercase [&_svg]:size-4',
        lg: 'h-13 rounded-sm px-8 text-sm tracking-[0.1em] uppercase [&_svg]:size-5',
        icon: 'size-10 rounded-full [&_svg]:size-5',
        'icon-sm': 'size-8 rounded-full [&_svg]:size-4',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      data-slot="button"
      // Defaulting to "button" avoids accidental form submits from icon buttons.
      {...(asChild ? {} : { type: type ?? 'button' })}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
