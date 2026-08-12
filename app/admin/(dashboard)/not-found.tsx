import { FileQuestion } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export default function AdminNotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Not found"
      description="That record does not exist, or it has been deleted since this link was created."
      action={{ label: 'Back to dashboard', href: '/admin' }}
      secondaryAction={{ label: 'All products', href: '/admin/products' }}
    />
  );
}
