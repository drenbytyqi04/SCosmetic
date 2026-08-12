'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { deleteProductAction } from '@/lib/admin/actions';

/**
 * Delete a product.
 *
 * Two-step by design: the first click arms the action and the second confirms it.
 * Deleting a product is not reversible in this data layer, so a single misplaced click
 * must not be enough.
 */
export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [isArmed, setIsArmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!isArmed) {
      setIsArmed(true);
      // Disarm on its own so the button does not sit in a dangerous state.
      window.setTimeout(() => setIsArmed(false), 5000);
      return;
    }

    startTransition(async () => {
      const result = await deleteProductAction(productId);
      setIsArmed(false);

      if (!result.ok) {
        toast.error('Could not delete', { description: result.error });
        return;
      }

      toast.success('Product deleted', { description: productName });
      router.refresh();
    });
  }

  return (
    <Button
      variant={isArmed ? 'destructive' : 'ghost'}
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={
        isArmed ? `Confirm deleting ${productName}` : `Delete ${productName}`
      }
    >
      {isPending ? <Spinner label="Deleting" /> : <Trash2 aria-hidden="true" />}
      {isArmed ? 'Confirm' : 'Delete'}
    </Button>
  );
}
