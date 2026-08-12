import type { Metadata } from 'next';
import { Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { RowActionButton } from '@/components/admin/row-action-button';
import { StatCard } from '@/components/admin/stat-card';
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
import { removeSubscriberAction } from '@/lib/admin/actions';
import { getNewsletterRepository } from '@/lib/marketing/repository';
import { formatDate, pluralise } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Newsletter' };

const SOURCE_LABEL: Record<string, string> = {
  footer: 'Footer',
  homepage: 'Homepage',
  checkout: 'Checkout',
};

export default async function AdminNewsletterPage() {
  const subscribers = await getNewsletterRepository().list();

  const confirmed = subscribers.filter((subscriber) => subscriber.confirmed);
  const bySource = subscribers.reduce<Record<string, number>>((counts, subscriber) => {
    counts[subscriber.source] = (counts[subscriber.source] ?? 0) + 1;
    return counts;
  }, {});
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <AdminPageHeader
        title="Newsletter"
        description={`${pluralise(subscribers.length, 'subscriber')}. Removing an address deletes it outright — treat an unsubscribe request as a deletion.`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Subscribers" value={String(subscribers.length)} tone="accent" />
        <StatCard
          label="Confirmed"
          value={String(confirmed.length)}
          hint="Double opt-in confirmed"
        />
        <StatCard
          label="Top source"
          value={topSource ? (SOURCE_LABEL[topSource[0]] ?? topSource[0]) : '—'}
          hint={topSource ? `${topSource[1]} sign-ups` : undefined}
        />
      </div>

      <Table>
        <TableCaption>
          Confirmation emails are not wired up yet — new sign-ups arrive unconfirmed. Connect an
          email provider to complete double opt-in.
        </TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subscribed</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {subscribers.map((subscriber) => (
            <TableRow key={subscriber.id}>
              <TableCell className="max-w-[18rem] truncate">
                <a
                  href={`mailto:${subscriber.email}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {subscriber.email}
                </a>
              </TableCell>

              <TableCell className="text-muted-foreground">
                {SOURCE_LABEL[subscriber.source] ?? subscriber.source}
              </TableCell>

              <TableCell>
                <Badge variant={subscriber.confirmed ? 'success' : 'soft'}>
                  {subscriber.confirmed ? 'Confirmed' : 'Pending'}
                </Badge>
              </TableCell>

              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(subscriber.createdAt)}
              </TableCell>

              <TableCell className="text-right">
                <RowActionButton
                  action={removeSubscriberAction.bind(null, subscriber.id)}
                  label={`Remove ${subscriber.email} from the list`}
                  successMessage="Subscriber removed"
                  confirm={`Remove ${subscriber.email} from the newsletter list?`}
                  pendingLabel="Removing…"
                >
                  <>
                    <Trash2 aria-hidden="true" />
                    Remove
                  </>
                </RowActionButton>
              </TableCell>
            </TableRow>
          ))}

          {subscribers.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                No subscribers yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
