import type { Metadata } from 'next';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { ProductForm } from '@/components/admin/product-form';
import { getCategories } from '@/lib/products/queries';

export const metadata: Metadata = { title: 'Add product' };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <>
      <AdminPageHeader
        title="Add product"
        description="Creating a product publishes it immediately. Set stock to zero to list it as sold out."
      />
      <ProductForm categories={categories} />
    </>
  );
}
