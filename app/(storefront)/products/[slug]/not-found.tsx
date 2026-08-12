import { PackageX } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

/** Shown when a product slug does not resolve — a retired line or a stale link. */
export default function ProductNotFound() {
  return (
    <div className="container-page py-16 lg:py-24">
      <EmptyState
        icon={PackageX}
        title="This product is no longer available"
        description="It may have been retired or renamed. Our current catalogue is short enough to browse in a minute."
        action={{ label: 'Shop all products', href: '/shop' }}
        secondaryAction={{ label: 'Talk to us', href: '/contact' }}
      />
    </div>
  );
}
