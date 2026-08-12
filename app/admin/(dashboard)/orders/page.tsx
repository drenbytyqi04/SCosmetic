import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { OrderStatusSelect } from '@/components/admin/order-status-select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOrderRepository } from '@/lib/orders/repository';
import { ORDER_STATUS_META, PAYMENT_STATUS_LABEL } from '@/lib/orders/status';
import { formatDateTime, formatPrice, pluralise } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Orders' };

export default async function AdminOrdersPage() {
  const orders = await getOrderRepository().list();

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description={`${pluralise(orders.length, 'order')}, newest first.`}
      />

      <Table>
        <TableCaption>
          Status changes are recorded immediately. Marking an order paid or fulfilled also
          updates its payment state.
        </TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Placed</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-mono text-xs text-foreground underline-offset-4 hover:underline"
                >
                  {order.reference}
                </Link>
              </TableCell>

              <TableCell className="max-w-[15rem]">
                <span className="block truncate text-foreground">
                  {order.shippingAddress.fullName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{order.email}</span>
              </TableCell>

              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDateTime(order.createdAt)}
              </TableCell>

              <TableCell className="whitespace-nowrap text-muted-foreground">
                {order.totals.itemCount}
              </TableCell>

              <TableCell className="whitespace-nowrap">
                <Badge variant={order.paymentStatus === 'succeeded' ? 'success' : 'soft'}>
                  {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                </Badge>
              </TableCell>

              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatPrice(order.totals.total)}
              </TableCell>

              <TableCell>
                <div className="flex flex-col items-start gap-1.5">
                  <OrderStatusSelect
                    orderId={order.id}
                    reference={order.reference}
                    status={order.status}
                  />
                  <span className="text-[0.6875rem] text-muted-foreground">
                    {ORDER_STATUS_META[order.status].description}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                No orders yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
