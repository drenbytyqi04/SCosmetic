import type { Metadata } from 'next';
import { CartView } from '@/components/cart/cart-view';
import { PageHeader } from '@/components/shared/page-header';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Your bag',
    description: 'Review the items in your bag before checking out.',
    path: '/cart',
  }),
  // A personal, transactional page — nothing for a crawler to index.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Your bag"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Bag', path: '/cart' },
        ]}
      />

      <div className="container-page py-10 lg:py-14">
        <CartView />
      </div>
    </>
  );
}
