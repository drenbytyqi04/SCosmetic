'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Toast host, mounted once in the root layout.
 *
 * Styled to the brand palette via inline CSS variables — sonner reads these rather
 * than exposing class hooks for every part.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={4000}
      closeButton
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            'rounded-sm border border-border bg-surface text-foreground shadow-lift font-sans text-sm',
          title: 'font-medium',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground rounded-xs text-xs',
          cancelButton: 'bg-surface-muted text-foreground rounded-xs text-xs',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--color-surface)',
          '--normal-text': 'var(--color-foreground)',
          '--normal-border': 'var(--color-border)',
        } as React.CSSProperties
      }
    />
  );
}
