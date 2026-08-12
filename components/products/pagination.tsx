import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Pagination.
 *
 * Real `<a href>`s, not buttons: each page is a distinct, crawlable, shareable URL,
 * and it works with middle-click and prefetch. A Server Component by design.
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
  className,
}: {
  page: number;
  totalPages: number;
  /** Given a page number, returns the href for it. */
  buildHref: (page: number) => string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1', className)}>
      <PaginationLink
        href={buildHref(page - 1)}
        disabled={page <= 1}
        ariaLabel="Previous page"
        icon={<ChevronLeft className="size-4" aria-hidden="true" />}
      />

      <ul className="flex items-center gap-1">
        {pages.map((entry, index) =>
          entry === 'gap' ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-2 text-sm text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={buildHref(entry)}
                aria-current={entry === page ? 'page' : undefined}
                aria-label={`Page ${entry}`}
                className={cn(
                  'flex size-9 items-center justify-center rounded-sm text-sm tabular-nums transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  entry === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-surface-muted',
                )}
              >
                {entry}
              </Link>
            </li>
          ),
        )}
      </ul>

      <PaginationLink
        href={buildHref(page + 1)}
        disabled={page >= totalPages}
        ariaLabel="Next page"
        icon={<ChevronRight className="size-4" aria-hidden="true" />}
      />
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  ariaLabel,
  icon,
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  icon: React.ReactNode;
}) {
  const classes =
    'flex size-9 items-center justify-center rounded-sm text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

  // A disabled control must not be a link — there is nowhere valid to go.
  if (disabled) {
    return (
      <span aria-hidden="true" className={cn(classes, 'cursor-not-allowed opacity-30')}>
        {icon}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={cn(classes, 'hover:bg-surface-muted')}>
      {icon}
    </Link>
  );
}

/** Windowed page list with ellipses: 1 … 4 [5] 6 … 12 */
function buildPageList(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page]);
  if (page - 1 > 1) pages.add(page - 1);
  if (page + 1 < totalPages) pages.add(page + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | 'gap'> = [];

  sorted.forEach((entry, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && entry - previous > 1) result.push('gap');
    result.push(entry);
  });

  return result;
}
