import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Inline busy indicator. Purely decorative — the surrounding button or region owns
 * the accessible status text, so this is hidden from assistive technology.
 */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <>
      <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}
