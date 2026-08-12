import type { OrderStatus, PaymentStatus } from '@/types';

/**
 * Presentation metadata for order and payment states.
 *
 * Kept beside the domain rather than inside a component so the admin list, the order
 * detail page and any future email template all label a status the same way.
 */

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'accent' | 'soft' | 'outline' | 'sale' | 'success' | 'warning'; description: string }
> = {
  pending: {
    label: 'Pending',
    variant: 'warning',
    description: 'Order placed, payment not yet received.',
  },
  paid: {
    label: 'Paid',
    variant: 'success',
    description: 'Payment received, ready to pack.',
  },
  fulfilled: {
    label: 'Fulfilled',
    variant: 'default',
    description: 'Dispatched to the customer.',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'soft',
    description: 'Cancelled before dispatch.',
  },
  refunded: {
    label: 'Refunded',
    variant: 'sale',
    description: 'Payment returned to the customer.',
  },
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  requires_payment: 'Awaiting payment',
  processing: 'Processing',
  succeeded: 'Paid',
  failed: 'Failed',
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_META).map(([value, meta]) => ({
  value: value as OrderStatus,
  label: meta.label,
}));
