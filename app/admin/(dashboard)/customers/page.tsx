import type { Metadata } from 'next';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatCard } from '@/components/admin/stat-card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCustomerRepository } from '@/lib/marketing/repository';
import { formatDate, formatPrice, pluralise } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Customers' };

/**
 * Customer list.
 *
 * Derived from orders rather than from a sign-up flow — there are no customer accounts
 * yet, so a customer is simply someone who has ordered.
 */
export default async function AdminCustomersPage() {
  const customers = await getCustomerRepository().list();

  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const repeatCustomers = customers.filter((customer) => customer.orderCount > 1);
  const averageLifetime = customers.length ? Math.round(totalRevenue / customers.length) : 0;

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Built from order history. Sorted by lifetime spend."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Customers" value={String(customers.length)} tone="accent" />
        <StatCard
          label="Repeat rate"
          value={
            customers.length
              ? `${Math.round((repeatCustomers.length / customers.length) * 100)}%`
              : '—'
          }
          hint={`${pluralise(repeatCustomers.length, 'repeat customer')}`}
        />
        <StatCard
          label="Average lifetime value"
          value={formatPrice(averageLifetime)}
          hint="Across all customers"
        />
      </div>

      <Table>
        <TableCaption>Customer accounts and order history sync are not built yet.</TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>City</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="text-right">Lifetime spend</TableHead>
            <TableHead>First seen</TableHead>
            <TableHead>Last order</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="max-w-[16rem]">
                <span className="block truncate font-medium text-foreground">
                  {customer.fullName}
                </span>
                <a
                  href={`mailto:${customer.email}`}
                  className="block truncate text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {customer.email}
                </a>
              </TableCell>

              <TableCell className="text-muted-foreground">{customer.city ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{customer.orderCount}</TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatPrice(customer.totalSpent)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(customer.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}
              </TableCell>
            </TableRow>
          ))}

          {customers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                No customers yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
