import 'server-only';

import type { Cents, Order } from '@/types';

/**
 * Payment provider seam.
 *
 * Checkout, order creation, payment creation and payment confirmation are four
 * separate steps on purpose. Today the only implementation is a manual/offline
 * provider; a Stripe implementation slots in behind the same interface without the
 * checkout UI or the order code changing.
 *
 * Nothing here claims payments are live. `isPaymentProviderConfigured()` is the
 * single source of truth the UI reads, and it is false until real keys exist.
 */

export interface PaymentIntent {
  id: string;
  /** Passed to the client SDK. Never a secret key. */
  clientSecret?: string;
  amount: Cents;
  currency: string;
  status: 'requires_payment' | 'processing' | 'succeeded' | 'failed';
  /** Where to send the customer next; for offline orders this is the confirmation page. */
  redirectUrl?: string;
}

export interface PaymentProvider {
  readonly id: 'stripe' | 'manual';
  readonly label: string;
  /** True only when the provider has everything it needs to take real money. */
  readonly isLive: boolean;
  createIntent(order: Order): Promise<PaymentIntent>;
  confirmIntent(intentId: string): Promise<PaymentIntent>;
}

/**
 * Offline provider: the order is recorded and payment is arranged out of band
 * (bank transfer or cash on delivery, both normal in this market).
 */
const manualProvider: PaymentProvider = {
  id: 'manual',
  label: 'Pay on delivery or by bank transfer',
  isLive: false,

  async createIntent(order) {
    return {
      id: `manual_${order.reference}`,
      amount: order.totals.total,
      currency: 'eur',
      status: 'requires_payment',
      redirectUrl: `/checkout/success?ref=${encodeURIComponent(order.reference)}`,
    };
  },

  async confirmIntent(intentId) {
    return { id: intentId, amount: 0, currency: 'eur', status: 'requires_payment' };
  },
};

/**
 * Stripe requires both a secret key (server) and a publishable key (client). Only
 * the publishable key may ever be NEXT_PUBLIC_.
 */
export function isPaymentProviderConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

export function getPaymentProvider(): PaymentProvider {
  if (isPaymentProviderConfigured()) {
    // Implementation checklist for going live is in PAYMENTS.md. Until the Stripe
    // adapter exists, refuse rather than silently fall back to recording unpaid
    // orders as if they had been charged.
    throw new Error(
      'Stripe keys are configured but the Stripe adapter is not implemented. ' +
        'See PAYMENTS.md, then return the Stripe provider from getPaymentProvider().',
    );
  }
  return manualProvider;
}

/** Human-readable payment mode, safe to render in the checkout UI. */
export function getPaymentMode(): { live: boolean; label: string } {
  const provider = isPaymentProviderConfigured()
    ? { label: 'Card payment' as string, isLive: true }
    : { label: manualProvider.label as string, isLive: false };
  return { live: provider.isLive, label: provider.label };
}
