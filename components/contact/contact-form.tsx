'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FormStatus } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { contactTopics } from '@/lib/validations/contact';
import { contactFormSchema, type ContactFormValues } from '@/lib/validations/forms';
import type { ApiResult } from '@/lib/api/response';

/**
 * Contact form.
 *
 * Validates client-side for immediate feedback and server-side for trust. The
 * character counter is live so the 2000-character limit never comes as a surprise on
 * submit.
 */
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: 'Product advice',
      message: '',
      company: '',
    },
  });

  const subject = useWatch({ control, name: 'subject' });
  const message = useWatch({ control, name: 'message' });

  async function onSubmit(values: ContactFormValues) {
    setServerError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = (await response.json()) as ApiResult<{ message: string }>;

      if (!body.ok) {
        setServerError(body.error);
        return;
      }

      reset();
      setSubmitted(true);
    } catch {
      setServerError('We could not reach the server. Please try again in a moment.');
    }
  }

  if (submitted) {
    return (
      <FormStatus tone="success" title="Message sent">
        <p>
          Thank you — we have your message and will reply within one working day. If it is urgent,
          message us on Instagram and we usually answer faster.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </FormStatus>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {serverError && (
        <FormStatus tone="error" title="That did not send">
          {serverError}
        </FormStatus>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" error={errors.name?.message} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="name"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('name')}
            />
          )}
        </Field>

        <Field label="Email address" error={errors.email?.message} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('email')}
            />
          )}
        </Field>
      </div>

      <Field label="Subject" error={errors.subject?.message} required>
        {({ id, describedBy, invalid }) => (
          <Select
            value={subject}
            onValueChange={(value) =>
              setValue('subject', value as (typeof contactTopics)[number], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id={id} aria-describedby={describedBy} aria-invalid={invalid}>
              <SelectValue placeholder="What is this about?" />
            </SelectTrigger>
            <SelectContent>
              {contactTopics.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>

      <Field
        label="Message"
        description="For shade matching, tell us the product and your usual shade in another brand."
        error={errors.message?.message}
        required
      >
        {({ id, describedBy, invalid }) => (
          <>
            <Textarea
              id={id}
              rows={6}
              maxLength={2000}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('message')}
            />
            <p aria-live="polite" className="mt-1 text-right text-xs text-muted-foreground">
              {(message ?? '').length} / 2000
            </p>
          </>
        )}
      </Field>

      {/* Honeypot */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="sm:self-start">
        {isSubmitting ? (
          <>
            <Spinner label="Sending message" />
            Sending…
          </>
        ) : (
          <>
            <Send aria-hidden="true" />
            Send message
          </>
        )}
      </Button>
    </form>
  );
}
