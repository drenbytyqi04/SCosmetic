import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blurDataUrl } from '@/lib/utils/image';
import { commerceConfig } from '@/lib/config/site';
import { formatPriceCompact } from '@/lib/utils/format';

/**
 * Homepage hero.
 *
 * Text first in the DOM so it paints before the artwork, and two `<Image>` sources
 * behind an art-directed `<picture>`-style swap: a portrait crop on phones, a wide
 * crop from `sm` up. Only the visible one is fetched, and it is the page's LCP
 * element, so it is marked priority.
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-cream-200">
      <div className="container-page relative">
        <div className="grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:py-28">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <span className="eyebrow">Prishtina · Est. 2021</span>

            <h1
              id="hero-heading"
              className="font-serif text-display-sm leading-[1.05] font-light text-foreground sm:text-display lg:text-display-lg"
            >
              Beauty,
              <br />
              <span className="text-champagne-500 italic">considered</span>.
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              A short catalogue, chosen slowly. Every formula here earns its place on
              performance — barrier-first skincare, complexion that looks like skin, and
              fragrance composed to stay close.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/shop">
                  Shop the edit
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/categories">Browse categories</Link>
              </Button>
            </div>

            <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <div>
                <dt className="sr-only">Delivery</dt>
                <dd>
                  Free delivery over{' '}
                  <strong className="font-medium text-foreground">
                    {formatPriceCompact(commerceConfig.freeShippingThreshold)}
                  </strong>
                </dd>
              </div>
              <div>
                <dt className="sr-only">Dispatch</dt>
                <dd>
                  <strong className="font-medium text-foreground">
                    {commerceConfig.shippingRates.standard.eta}
                  </strong>{' '}
                  across Kosovo
                </dd>
              </div>
              <div>
                <dt className="sr-only">Advice</dt>
                <dd>Shade matching by message</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg sm:aspect-16/10 lg:aspect-4/3">
              <Image
                src="/images/editorial/hero-mobile.png"
                alt="Two skincare bottles photographed in soft daylight against a warm cream backdrop"
                fill
                sizes="100vw"
                priority
                placeholder="blur"
                blurDataURL={blurDataUrl('#F2E8DA')}
                className="object-cover sm:hidden"
              />
              <Image
                src="/images/editorial/hero.png"
                alt="Two skincare bottles photographed in soft daylight against a warm cream backdrop"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                priority
                placeholder="blur"
                blurDataURL={blurDataUrl('#F2E8DA')}
                className="hidden object-cover sm:block"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
