import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { blurDataUrl } from '@/lib/utils/image';
import { cn } from '@/lib/utils/cn';

/**
 * Editorial split band: image on one side, copy on the other, alternating direction.
 * Used twice on the homepage to break up the product grids.
 */
export function EditorialSection({
  eyebrow,
  title,
  paragraphs,
  image,
  imageAlt,
  tone = '#EEE5D9',
  href,
  linkLabel,
  reverse = false,
  className,
}: {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
  tone?: string;
  href: string;
  linkLabel: string;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <section className={cn('container-page py-16 lg:py-24', className)}>
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className={cn('relative aspect-4/3 overflow-hidden rounded-lg', reverse && 'lg:order-2')}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 46vw, 100vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL={blurDataUrl(tone)}
            className="object-cover"
          />
        </div>

        <div className={cn('flex flex-col gap-5', reverse && 'lg:order-1')}>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="font-serif text-3xl leading-tight font-light text-foreground sm:text-4xl">
            {title}
          </h2>

          <div className="flex flex-col gap-4">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <Link
            href={href}
            className="group inline-flex w-fit items-center gap-2 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:text-champagne-500"
          >
            {linkLabel}
            <ArrowRight
              className="size-4 transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
