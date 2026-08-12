'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateOrderStatusAction } from '@/lib/admin/actions';
import { ORDER_STATUS_OPTIONS } from '@/lib/orders/status';
import type { OrderStatus } from '@/types';

/** Inline order-status control. */
export function OrderStatusSelect({
  orderId,
  reference,
  status,
}: {
  orderId: string;
  reference: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status: next });

      if (!result.ok) {
        toast.error('Could not update status', { description: result.error });
        return;
      }

      toast.success(`${reference} marked ${next}`);
      router.refresh();
    });
  }

  return (
    <>
      <label htmlFor={`status-${orderId}`} className="sr-only">
        Status for order {reference}
      </label>
      <Select value={status} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger id={`status-${orderId}`} className="h-9 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
