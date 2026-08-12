import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { ProductForm } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';
import { getCategories, getProductById } from '@/lib/products/queries';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: product ? `Edit ${product.name}` : 'Product not found' };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductById(id), getCategories()]);

  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title={`Edit ${product.name}`}
        description="Changes go live as soon as you save, and the storefront pages are revalidated."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              View on site
            </Link>
          </Button>
        }
      />
      <ProductForm product={product} categories={categories} />
    </>
  );
}
