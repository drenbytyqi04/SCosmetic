import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { OrderSummary } from '@/components/checkout/order-summary';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { getPaymentMode } from '@/lib/payments/provider';
import { buildMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/lib/config/site';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Checkout',
    description: 'Complete your order.',
    path: '/checkout',
  }),
  robots: { index: false, follow: false },
};

/**
 * Checkout.
 *
 * The payment mode is resolved on the server — it depends on environment variables
 * that must never reach the browser. Only the resulting boolean and label are passed
 * down.
 */
export default function CheckoutPage() {
  const paymentMode = getPaymentMode();

  return (
    <div className="container-page py-8 lg:py-12">
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Bag', path: '/cart' },
          { name: 'Checkout', path: '/checkout' },
        ]}
        className="mb-8"
      />

      <div className="mb-10 flex flex-col gap-3">
        <span className="eyebrow">Secure checkout</span>
        <h1 className="font-serif text-3xl font-light text-foreground sm:text-4xl">Checkout</h1>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-champagne-500" aria-hidden="true" />
          Your details are sent over an encrypted connection and used only to fulfil this order.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-16">
        <div className="min-w-0">
          <CheckoutForm paymentMode={paymentMode} />
        </div>

        <aside aria-labelledby="order-summary-heading" className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="order-summary-heading" className="sr-only">
            Order summary
          </h2>
          <OrderSummary />

          <div className="mt-6 rounded-lg border border-border bg-cream-100 p-5 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Need a hand?</p>
            <p>
              Message us at{' '}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {siteConfig.supportEmail}
              </a>{' '}
              or on{' '}
              <Link href="/contact" className="underline underline-offset-4 hover:text-foreground">
                the contact page
              </Link>
              . We answer within one working day.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
