'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

/**
 * Form field wrapper.
 *
 * Uses a render prop rather than cloning children so the accessible wiring —
 * `id`, `aria-describedby`, `aria-invalid` — is handed to the control explicitly and
 * cannot silently go missing.
 */

export interface FieldRenderProps {
  id: string;
  describedBy: string | undefined;
  invalid: boolean | undefined;
}

export interface FieldProps {
  label: string;
  /** Hint shown under the label; announced with the control. */
  description?: string;
  error?: string;
  required?: boolean;
  /** Visually hides the label while keeping it available to screen readers. */
  hideLabel?: boolean;
  className?: string;
  children: (props: FieldRenderProps) => React.ReactNode;
}

export function Field({
  label,
  description,
  error,
  required,
  hideLabel = false,
  className,
  children,
}: FieldProps) {
  const reactId = React.useId();
  const id = `field-${reactId}`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {description && (
        <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {children({ id, describedBy, invalid: error ? true : undefined })}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-destructive"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Form-level status banner for the outcome of a submit. `role` differs by tone so
 * an error interrupts assistive technology while a success message does not.
 */
export function FormStatus({
  tone,
  title,
  children,
  className,
}: {
  tone: 'success' | 'error';
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'rounded-sm border px-4 py-3 text-sm',
        tone === 'success'
          ? 'border-success/25 bg-success-soft text-success'
          : 'border-destructive/25 bg-destructive-soft text-destructive',
        className,
      )}
    >
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-[0.8125rem] opacity-90">{children}</div>}
    </div>
  );
}
