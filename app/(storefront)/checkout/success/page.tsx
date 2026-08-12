import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Mail, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/empty-state';
import { ClearCartOnMount } from '@/components/checkout/clear-cart-on-mount';
import { getOrderRepository } from '@/lib/orders/repository';
import { commerceConfig, siteConfig } from '@/lib/config/site';
import { formatPrice } from '@/lib/utils/format';
import { imageSizes } from '@/lib/utils/image';

export const metadata: Metadata = {
  title: 'Order confirmed',
  description: 'Your order has been received.',
  robots: { index: false, follow: false },
};

/** Masks an address for display: a***@example.com. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'your email address';
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(2, local.length - 1))}@${domain}`;
}

/**
 * Order confirmation.
 *
 * Looks the order up by its reference. Only non-sensitive details are shown — the
 * email is masked and the delivery address is not rendered — because the reference in
 * the URL is the only thing gating this page.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const order = ref ? await getOrderRepository().findByReference(ref) : null;

  if (!order) {
    return (
      <div className="container-page py-16 lg:py-24">
        <EmptyState
          icon={Package}
          title="We could not find that order"
          description="The reference may be incomplete. If you have a confirmation email, the reference is at the top — or get in touch and we will look it up."
          action={{ label: 'Contact us', href: '/contact' }}
          secondaryAction={{ label: 'Back to shopping', href: '/shop' }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-12 lg:py-20">
      {/* The order exists, so the bag has served its purpose. */}
      <ClearCartOnMount />

      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center">
          <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
            <Check className="size-7" strokeWidth={2.5} aria-hidden="true" />
          </span>

          <h1 className="font-serif text-3xl font-light text-foreground sm:text-4xl">
            Thank you — your order is in
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            We have sent a confirmation to {maskEmail(order.email)}. Your reference is{' '}
            <strong className="font-medium tracking-wide text-foreground">{order.reference}</strong>
            {' '}— keep it for any questions about this order.
          </p>
        </div>

        <div className="mt-10 rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="font-serif text-lg font-light text-foreground">Order summary</h2>
            <span className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
              {commerceConfig.shippingRates[order.shippingMethod].label} ·{' '}
              {commerceConfig.shippingRates[order.shippingMethod].eta}
            </span>
          </div>

          <ul className="divide-y divide-border px-5">
            {order.lines.map((line) => (
              <li key={`${line.productId}-${line.shadeName ?? 'default'}`} className="flex gap-4 py-4">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-cream-200">
                  <Image
                    src={line.image}
                    alt=""
                    fill
                    sizes={imageSizes.cartLine}
                    className="object-cover"
                  />
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/products/${line.slug}`}
                    className="font-serif text-base text-foreground transition-colors hover:text-espresso-500"
                  >
                    {line.name}
                  </Link>
                  {line.shadeName && (
                    <span className="text-xs text-muted-foreground">Shade: {line.shadeName}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {line.quantity} × {formatPrice(line.unitPrice)}
                  </span>
                </span>

                <span className="shrink-0 text-sm tabular-nums text-foreground">
                  {formatPrice(line.unitPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-border px-5 py-5">
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.totals.subtotal)}</dd>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ''}
                  </dt>
                  <dd className="tabular-nums font-medium text-success">
                    −{formatPrice(order.totals.discount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="tabular-nums">
                  {order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  VAT ({Math.round(commerceConfig.taxRate * 100)}%)
                </dt>
                <dd className="tabular-nums">{formatPrice(order.totals.tax)}</dd>
              </div>

              <Separator className="my-1.5" />

              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-serif text-lg">Total</dt>
                <dd className="text-xl font-medium tabular-nums">
                  {formatPrice(order.totals.total)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-lg border border-border bg-cream-100 p-5 text-sm">
          <p className="flex items-start gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-champagne-500" aria-hidden="true" />
            <span className="text-muted-foreground">
              Payment is not yet collected on this deployment. We will confirm your order by email
              with payment details, or you can pay the courier on delivery.
            </span>
          </p>
          <p className="text-xs text-muted-foreground/80">
            Questions? Email{' '}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {siteConfig.supportEmail}
            </a>{' '}
            quoting {order.reference}.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
