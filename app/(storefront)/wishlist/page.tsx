import type { Metadata } from 'next';
import { WishlistView } from '@/components/products/wishlist-view';
import { PageHeader } from '@/components/shared/page-header';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Your wishlist',
    description: 'Products you have saved for later.',
    path: '/wishlist',
  }),
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        eyebrow="Saved"
        title="Your wishlist"
        description="Kept on this device. Sign-in and cross-device sync arrive with customer accounts."
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Wishlist', path: '/wishlist' },
        ]}
      />

      <div className="container-page py-10 lg:py-14">
        <WishlistView />
      </div>
    </>
  );
}
