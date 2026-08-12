import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Pencil, Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DeleteProductButton } from '@/components/admin/delete-product-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { formatDate, formatPrice, pluralise } from '@/lib/utils/format';
import { imageSizes } from '@/lib/utils/image';

export const metadata: Metadata = { title: 'Products' };

/** Product list with inline edit, view and delete. */
export default async function AdminProductsPage() {
  const { items: products } = await getProducts({ perPage: 1000, sort: 'name-asc' });

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${pluralise(products.length, 'product')} in the catalogue.`}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus aria-hidden="true" />
              Add product
            </Link>
          </Button>
        }
      />

      <Table>
        <TableCaption>
          Editing a product revalidates its storefront page, its category and the homepage.
        </TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-xs bg-cream-200">
                    <Image
                      src={product.images[0] ?? '/images/editorial/og.png'}
                      alt=""
                      fill
                      sizes={imageSizes.thumbnail}
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[16rem] truncate font-medium text-foreground">
                      {product.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">{product.brand}</span>
                  </span>
                </div>
              </TableCell>

              <TableCell className="whitespace-nowrap capitalize text-muted-foreground">
                {product.category}
              </TableCell>

              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {product.salePrice !== undefined ? (
                  <>
                    <span className="text-destructive">{formatPrice(product.salePrice)}</span>
                    <s className="ml-1.5 text-xs text-muted-foreground">
                      {formatPrice(product.price)}
                    </s>
                  </>
                ) : (
                  formatPrice(product.price)
                )}
              </TableCell>

              <TableCell className="text-right tabular-nums">
                <span
                  className={
                    product.stock <= 0
                      ? 'font-medium text-destructive'
                      : product.stock <= 8
                        ? 'font-medium text-champagne-500'
                        : undefined
                  }
                >
                  {product.stock}
                </span>
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {product.featured && <Badge variant="accent">Edit</Badge>}
                  {product.bestseller && <Badge variant="outline">Best</Badge>}
                  {product.newArrival && <Badge variant="soft">New</Badge>}
                </div>
              </TableCell>

              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(product.updatedAt)}
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Pencil aria-hidden="true" />
                      Edit
                      <span className="sr-only"> {product.name}</span>
                    </Link>
                  </Button>

                  <Button asChild variant="ghost" size="icon-sm">
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${product.name} on the storefront (new tab)`}
                    >
                      <ExternalLink aria-hidden="true" />
                    </Link>
                  </Button>

                  <DeleteProductButton productId={product.id} productName={product.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}

          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                No products yet.{' '}
                <Link href="/admin/products/new" className="underline underline-offset-4">
                  Add the first one
                </Link>
                .
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
