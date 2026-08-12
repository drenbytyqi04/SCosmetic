import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  Inbox,
  Mail,
  Package,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { RevenueSparkline, StatCard } from '@/components/admin/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getOrderRepository } from '@/lib/orders/repository';
import { getContactRepository, getCustomerRepository, getNewsletterRepository } from '@/lib/marketing/repository';
import { getProducts } from '@/lib/products/queries';
import { formatDate, formatPrice, pluralise } from '@/lib/utils/format';
import { ORDER_STATUS_META } from '@/lib/orders/status';

export const metadata: Metadata = { title: 'Dashboard' };

/** Stock at or below this is surfaced as needing attention. */
const LOW_STOCK_THRESHOLD = 8;

export default async function AdminDashboardPage() {
  const [stats, orders, { items: products }, customers, subscribers, messages] = await Promise.all([
    getOrderRepository().stats(),
    getOrderRepository().list({ limit: 6 }),
    getProducts({ perPage: 1000, sort: 'name-asc' }),
    getCustomerRepository().list(),
    getNewsletterRepository().list(),
    getContactRepository().list(),
  ]);

  const lowStock = products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD);
  const outOfStock = products.filter((product) => product.stock <= 0);
  const unhandledMessages = messages.filter((message) => !message.handled);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Revenue, stock and inbox at a glance."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/admin/products/new">Add product</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/orders">View orders</Link>
            </Button>
          </>
        }
      />

      <section aria-labelledby="kpis-heading">
        <h2 id="kpis-heading" className="sr-only">
          Key figures
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Revenue"
            value={formatPrice(stats.revenue)}
            hint="Excludes cancelled and refunded orders"
            icon={TrendingUp}
            tone="accent"
          />
          <StatCard
            label="Orders"
            value={String(stats.orderCount)}
            hint={`${stats.pendingCount} awaiting payment`}
            icon={Receipt}
          />
          <StatCard
            label="Average order"
            value={formatPrice(stats.averageOrderValue)}
            hint={`${stats.fulfilledCount} fulfilled`}
            icon={Package}
          />
          <StatCard
            label="Customers"
            value={String(customers.length)}
            hint={`${subscribers.length} newsletter subscribers`}
            icon={Users}
          />
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <p className="text-[0.6875rem] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Revenue · last 14 days
            </p>
            <p className="text-sm tabular-nums text-foreground">
              {formatPrice(stats.trend.reduce((sum, point) => sum + point.revenue, 0))}
            </p>
          </div>
          <RevenueSparkline data={stats.trend} />
        </div>
      </section>

      {(outOfStock.length > 0 || unhandledMessages.length > 0) && (
        <section aria-labelledby="attention-heading" className="mt-10">
          <h2
            id="attention-heading"
            className="mb-4 text-xs font-medium tracking-[0.14em] text-foreground uppercase"
          >
            Needs attention
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {outOfStock.length > 0 && (
              <div className="rounded-lg border border-destructive/25 bg-destructive-soft/50 p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  {pluralise(outOfStock.length, 'product')} out of stock
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                  {outOfStock.slice(0, 4).map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-foreground underline-offset-4 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="/admin/inventory">Manage inventory</Link>
                </Button>
              </div>
            )}

            {unhandledMessages.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Inbox className="size-4 text-champagne-500" aria-hidden="true" />
                  {pluralise(unhandledMessages.length, 'message')} unanswered
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                  {unhandledMessages.slice(0, 4).map((message) => (
                    <li key={message.id} className="truncate text-muted-foreground">
                      <span className="text-foreground">{message.name}</span> — {message.subject}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href="/admin/messages">Open inbox</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="recent-orders-heading" className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2
            id="recent-orders-heading"
            className="text-xs font-medium tracking-[0.14em] text-foreground uppercase"
          >
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            View all
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const meta = ORDER_STATUS_META[order.status];

              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs text-foreground underline-offset-4 hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[14rem] truncate">
                    {order.shippingAddress.fullName}
                    <span className="block text-xs text-muted-foreground">{order.email}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(order.totals.total)}
                  </TableCell>
                </TableRow>
              );
            })}

            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <section aria-labelledby="low-stock-heading" className="mt-10">
        <h2
          id="low-stock-heading"
          className="mb-4 flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-foreground uppercase"
        >
          <Mail className="size-3.5 text-champagne-500" aria-hidden="true" />
          Low stock ({lowStock.length})
        </h2>

        {lowStock.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-strong bg-surface/60 px-5 py-8 text-center text-sm text-muted-foreground">
            Every product is comfortably in stock.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-border bg-surface px-4 py-3"
              >
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="min-w-0 flex-1 truncate text-sm text-foreground underline-offset-4 hover:underline"
                >
                  {product.name}
                </Link>
                <Badge variant={product.stock <= 0 ? 'sale' : 'warning'}>
                  {product.stock} left
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
