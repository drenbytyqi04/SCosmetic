import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { OrderStatusSelect } from '@/components/admin/order-status-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getOrderRepository } from '@/lib/orders/repository';
import { ORDER_STATUS_META, PAYMENT_STATUS_LABEL } from '@/lib/orders/status';
import { commerceConfig } from '@/lib/config/site';
import { formatDateTime, formatPrice } from '@/lib/utils/format';
import { imageSizes } from '@/lib/utils/image';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderRepository().findById(id);
  return { title: order ? `Order ${order.reference}` : 'Order not found' };
}

export default async function AdminOrderDetailPage({ params }: OrderPageProps) {
  const { id } = await params;
  const order = await getOrderRepository().findById(id);

  if (!order) notFound();

  const meta = ORDER_STATUS_META[order.status];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/admin/orders">
          <ArrowLeft aria-hidden="true" />
          All orders
        </Link>
      </Button>

      <AdminPageHeader
        title={`Order ${order.reference}`}
        description={`Placed ${formatDateTime(order.createdAt)} · last updated ${formatDateTime(order.updatedAt)}`}
        actions={
          <OrderStatusSelect
            orderId={order.id}
            reference={order.reference}
            status={order.status}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Lines */}
        <section aria-labelledby="lines-heading" className="rounded-lg border border-border bg-surface">
          <h2
            id="lines-heading"
            className="border-b border-border px-5 py-4 font-serif text-lg font-light text-foreground"
          >
            Items
          </h2>

          <ul className="divide-y divide-border px-5">
            {order.lines.map((line) => (
              <li key={`${line.productId}-${line.shadeName ?? 'default'}`} className="flex gap-4 py-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xs bg-cream-200">
                  <Image
                    src={line.image}
                    alt=""
                    fill
                    sizes={imageSizes.thumbnail}
                    className="object-cover"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <Link
                    href={`/products/${line.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {line.name}
                  </Link>
                  {line.shadeName && (
                    <span className="block text-xs text-muted-foreground">
                      Shade: {line.shadeName}
                    </span>
                  )}
                  <span className="block text-xs text-muted-foreground">
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
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.totals.subtotal)}</dd>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ''}
                  </dt>
                  <dd className="tabular-nums text-success">
                    −{formatPrice(order.totals.discount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Delivery · {commerceConfig.shippingRates[order.shippingMethod].label}
                </dt>
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
                <dt className="font-serif text-base">Total</dt>
                <dd className="text-lg font-medium tabular-nums">
                  {formatPrice(order.totals.total)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Meta */}
        <aside className="flex flex-col gap-4">
          <section
            aria-labelledby="status-heading"
            className="rounded-lg border border-border bg-surface p-5"
          >
            <h2 id="status-heading" className="mb-3 text-xs font-medium tracking-[0.12em] uppercase">
              Status
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <Badge variant={order.paymentStatus === 'succeeded' ? 'success' : 'soft'}>
                {PAYMENT_STATUS_LABEL[order.paymentStatus]}
              </Badge>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
            {order.paymentIntentId && (
              <p className="mt-3 font-mono text-[0.6875rem] break-all text-muted-foreground/80">
                Payment intent: {order.paymentIntentId}
              </p>
            )}
          </section>

          <section
            aria-labelledby="customer-heading"
            className="rounded-lg border border-border bg-surface p-5"
          >
            <h2
              id="customer-heading"
              className="mb-3 text-xs font-medium tracking-[0.12em] uppercase"
            >
              Customer
            </h2>
            <div className="flex flex-col gap-1 text-sm">
              <p className="text-foreground">{order.shippingAddress.fullName}</p>
              <a
                href={`mailto:${order.email}`}
                className="break-all text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {order.email}
              </a>
              {order.phone && (
                <a
                  href={`tel:${order.phone.replace(/\s/g, '')}`}
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {order.phone}
                </a>
              )}
            </div>
          </section>

          <section
            aria-labelledby="address-heading"
            className="rounded-lg border border-border bg-surface p-5"
          >
            <h2
              id="address-heading"
              className="mb-3 text-xs font-medium tracking-[0.12em] uppercase"
            >
              Delivery address
            </h2>
            <address className="text-sm leading-relaxed text-muted-foreground not-italic">
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.line2 && (
                <>
                  {order.shippingAddress.line2}
                  <br />
                </>
              )}
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
              <br />
              {order.shippingAddress.country}
            </address>
          </section>

          {order.notes && (
            <section
              aria-labelledby="notes-heading"
              className="rounded-lg border border-champagne-300 bg-cream-200/60 p-5"
            >
              <h2
                id="notes-heading"
                className="mb-2 text-xs font-medium tracking-[0.12em] uppercase"
              >
                Delivery notes
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                {order.notes}
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
