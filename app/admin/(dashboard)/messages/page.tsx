import type { Metadata } from 'next';
import { Check, Inbox, RotateCcw } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { RowActionButton } from '@/components/admin/row-action-button';
import { Badge } from '@/components/ui/badge';
import { setMessageHandledAction } from '@/lib/admin/actions';
import { getContactRepository } from '@/lib/marketing/repository';
import { formatDateTime, pluralise } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Messages' };

/**
 * Contact inbox.
 *
 * Message bodies come from the public contact form. They are sanitised on the way in
 * and rendered as text here — never as markup — so a submitted message cannot inject
 * anything into this page.
 */
export default async function AdminMessagesPage() {
  const messages = await getContactRepository().list();
  const unhandled = messages.filter((message) => !message.handled);

  return (
    <>
      <AdminPageHeader
        title="Messages"
        description={`${pluralise(messages.length, 'message')} · ${unhandled.length} awaiting a reply.`}
      />

      {messages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong bg-surface/60 px-6 py-16 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-3 size-6 text-champagne-500" aria-hidden="true" />
          No messages yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {messages.map((message) => (
            <li
              key={message.id}
              className={
                message.handled
                  ? 'rounded-lg border border-border bg-surface p-5'
                  : 'rounded-lg border border-champagne-300 bg-cream-200/50 p-5'
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg font-normal text-foreground">
                      {message.subject}
                    </h2>
                    <Badge variant={message.handled ? 'success' : 'warning'}>
                      {message.handled ? 'Handled' : 'Awaiting reply'}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {message.name} ·{' '}
                    <a
                      href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                      className="underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {message.email}
                    </a>{' '}
                    · {formatDateTime(message.createdAt)}
                  </p>
                </div>

                <RowActionButton
                  action={setMessageHandledAction.bind(null, message.id, !message.handled)}
                  label={
                    message.handled
                      ? `Reopen message from ${message.name}`
                      : `Mark message from ${message.name} as handled`
                  }
                  successMessage={message.handled ? 'Message reopened' : 'Message marked handled'}
                  variant={message.handled ? 'ghost' : 'outline'}
                >
                  {message.handled ? (
                    <>
                      <RotateCcw aria-hidden="true" />
                      Reopen
                    </>
                  ) : (
                    <>
                      <Check aria-hidden="true" />
                      Mark handled
                    </>
                  )}
                </RowActionButton>
              </div>

              <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                {message.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
