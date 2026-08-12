import { siteConfig } from '@/lib/config/site';
import type { Cents } from '@/types';

const priceFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: siteConfig.currency,
  minimumFractionDigits: 2,
});

/** Formats a cents amount as a localised currency string, e.g. 2450 → "€24.50". */
export function formatPrice(cents: Cents): string {
  return priceFormatter.format(cents / 100);
}

const compactPriceFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: siteConfig.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Price without trailing zeros — "€50" rather than "€50.00".
 *
 * For prose and promotional copy only. Line items, totals and anything a customer
 * might check against a receipt use `formatPrice`, where aligned decimals matter.
 */
export function formatPriceCompact(cents: Cents): string {
  return compactPriceFormatter.format(cents / 100);
}

/** Cents → plain decimal string, for form inputs and structured data. */
export function centsToAmount(cents: Cents): string {
  return (cents / 100).toFixed(2);
}

/** Decimal input → cents, rounded to avoid float artefacts. */
export function amountToCents(amount: number | string): Cents {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function formatDiscountPercent(price: Cents, salePrice: Cents): number {
  if (price <= 0 || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

/** Collapses whitespace and clips to `max` characters on a word boundary. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const clipped = clean.slice(0, max);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
