import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatCard } from '@/components/admin/stat-card';
import { StockAdjuster } from '@/components/admin/stock-adjuster';
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
import { getProducts } from '@/lib/products/queries';
import { formatPrice } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Inventory' };

const LOW_STOCK_THRESHOLD = 8;

/** Stock management. Sorted lowest-first so what needs attention is at the top. */
export default async function AdminInventoryPage() {
  const { items } = await getProducts({ perPage: 1000, sort: 'name-asc' });
  const products = [...items].sort((a, b) => a.stock - b.stock);

  const outOfStock = products.filter((product) => product.stock <= 0);
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD,
  );
  const stockValue = products.reduce(
    (sum, product) => sum + (product.salePrice ?? product.price) * product.stock,
    0,
  );

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Adjustments are relative, so two people counting the same delivery can both add their total without overwriting each other."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Out of stock"
          value={String(outOfStock.length)}
          icon={AlertTriangle}
          tone={outOfStock.length > 0 ? 'warning' : 'default'}
          hint={outOfStock.length > 0 ? 'Listed as sold out on the storefront' : 'Nothing sold out'}
        />
        <StatCard
          label="Low stock"
          value={String(lowStock.length)}
          hint={`At or below ${LOW_STOCK_THRESHOLD} units`}
        />
        <StatCard
          label="Stock value"
          value={formatPrice(stockValue)}
          hint="At current selling prices"
        />
      </div>

      <Table>
        <TableCaption>Sorted lowest stock first.</TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">In stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Adjust</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {product.name}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {product.brand} · {product.category}
                </span>
              </TableCell>

              <TableCell className="text-right text-base tabular-nums">{product.stock}</TableCell>

              <TableCell>
                {product.stock <= 0 ? (
                  <Badge variant="sale">Sold out</Badge>
                ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                  <Badge variant="warning">Low</Badge>
                ) : (
                  <Badge variant="success">Healthy</Badge>
                )}
              </TableCell>

              <TableCell>
                <StockAdjuster
                  productId={product.id}
                  productName={product.name}
                  stock={product.stock}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
