import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FlaskConical, Leaf, ShieldCheck, Truck } from 'lucide-react';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeading } from '@/components/shared/section-heading';
import { StructuredData } from '@/components/shared/structured-data';
import { Button } from '@/components/ui/button';
import { commerceConfig, siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/structured-data';
import { blurDataUrl } from '@/lib/utils/image';
import { formatPrice } from '@/lib/utils/format';

export const metadata: Metadata = buildMetadata({
  title: 'Our story',
  description:
    'COSMETICS.KS is a small, opinionated beauty retailer in Prishtina. We read the ingredient list before we stock anything, and the catalogue stays deliberately short.',
  path: '/about',
  image: '/images/editorial/ritual.png',
});

const PRINCIPLES = [
  {
    icon: FlaskConical,
    title: 'The ingredient list decides',
    body: 'Before anything goes on the shelf we check the active, its percentage, and whether the rest of the formula supports or undermines it. Marketing copy does not enter into it.',
  },
  {
    icon: Leaf,
    title: 'Short beats broad',
    body: 'Around thirty products, revisited each season. Enough for a complete routine, few enough that we can tell you something useful about every one of them.',
  },
  {
    icon: ShieldCheck,
    title: 'Sourced properly',
    body: 'Everything comes from the brand or its authorised regional distributor. We can produce documentation for any product on request.',
  },
  {
    icon: Truck,
    title: 'Local, and quick about it',
    body: 'We pack and dispatch from Prishtina ourselves. Order before 15:00 on a working day and it leaves the same afternoon.',
  },
] as const;

export default function AboutPage() {
  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Our story', path: '/about' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Since 2021"
        title="Beauty, considered"
        description="We are a small, opinionated beauty retailer in Prishtina. This page explains what that means in practice."
        trail={trail}
      />

      {/* Opening */}
      <section className="container-page py-12 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-5">
            <p className="font-serif text-2xl leading-relaxed font-light text-foreground sm:text-3xl">
              COSMETICS.KS started because shade matching in Kosovo was broken.
            </p>
            <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                In 2021 the choice here was a handful of shades in the middle of the range, bought
                on the assumption that everyone falls somewhere near the centre. Anyone deeper than
                a medium beige, or with a properly olive undertone, was out of luck.
              </p>
              <p>
                So we began the other way round. Every foundation we stock is matched on medium and
                deep skin first, then adjusted lighter — which is why our range starts where most
                nude ranges stop. Most of the matching still happens by message, one person at a
                time, and we would not want it otherwise.
              </p>
              <p>
                The rest followed from the same instinct. If we are going to recommend something, we
                should be able to explain why it works. That turned out to mean a much shorter
                catalogue than we first planned.
              </p>
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden rounded-lg">
            <Image
              src="/images/editorial/journal.png"
              alt="A lip oil and cream blush arranged on a warm neutral surface in soft daylight"
              fill
              sizes="(min-width: 1024px) 46vw, 100vw"
              priority
              placeholder="blur"
              blurDataURL={blurDataUrl('#F1DED9')}
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Principles */}
      <section
        id="ingredients"
        aria-labelledby="principles-heading"
        className="border-y border-border bg-surface"
      >
        <div className="container-page py-14 lg:py-20">
          <SectionHeading
            eyebrow="How we work"
            title="Four things we do not compromise on"
            className="mb-12"
          />

          <ul className="grid gap-10 sm:grid-cols-2 lg:gap-14">
            {PRINCIPLES.map((principle) => (
              <li key={principle.title} className="flex flex-col gap-3">
                <principle.icon className="size-5 text-champagne-500" aria-hidden="true" />
                <h3 className="font-serif text-xl font-normal text-foreground">
                  {principle.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Shipping & returns */}
      <section id="shipping" aria-labelledby="shipping-heading" className="container-page py-14 lg:py-20">
        <SectionHeading
          eyebrow="Practicalities"
          title="Shipping &amp; returns"
          description="No surprises at checkout, and no small print worth hiding."
          className="mb-10"
        />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-cream-100 p-6">
            <h3 className="mb-3 font-serif text-lg font-normal text-foreground">Delivery</h3>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              <li>
                Standard · {commerceConfig.shippingRates.standard.eta} ·{' '}
                {formatPrice(commerceConfig.shippingRates.standard.price)}
              </li>
              <li>
                Express · {commerceConfig.shippingRates.express.eta} ·{' '}
                {formatPrice(commerceConfig.shippingRates.express.price)}
              </li>
              <li>
                Free standard delivery over{' '}
                {formatPrice(commerceConfig.freeShippingThreshold)}
              </li>
              <li>Also shipping to Albania, North Macedonia, Montenegro and Serbia</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-cream-100 p-6">
            <h3 className="mb-3 font-serif text-lg font-normal text-foreground">Returns</h3>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              <li>14 days from delivery on unopened products</li>
              <li>Opened cosmetics cannot be returned, for hygiene reasons</li>
              <li>Damaged or incorrect items are replaced or refunded in full</li>
              <li>Return postage is on us when the fault is ours</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-cream-100 p-6">
            <h3 className="mb-3 font-serif text-lg font-normal text-foreground">Ingredients</h3>
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
              <li>Full INCI list printed on every carton</li>
              <li>Fragrance-free options flagged on the product page</li>
              <li>No product tested on animals for our market</li>
              <li>Ask us anything about a formula — we will find out if we do not know</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Close */}
      <section aria-labelledby="about-cta-heading" className="border-t border-border bg-cream-200/70">
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
            <SectionHeading
              eyebrow="Come say hello"
              title="Prishtina, and wherever you are"
              description={`Find us at ${siteConfig.address.street}, or on Instagram at ${siteConfig.instagramHandle}. Shade matching is free and takes about a day.`}
              align="center"
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/shop">Shop the catalogue</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Ask us something</Link>
              </Button>
            </div>

            <div className="mt-6 w-full max-w-md">
              <NewsletterForm source="homepage" layout="inline" />
            </div>
          </div>
        </div>
      </section>

      <StructuredData data={breadcrumbSchema(trail)} />
    </>
  );
}
