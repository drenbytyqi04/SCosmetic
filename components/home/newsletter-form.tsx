'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FormStatus } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { newsletterFormSchema, type NewsletterFormValues } from '@/lib/validations/forms';
import { cn } from '@/lib/utils/cn';
import type { ApiResult } from '@/lib/api/response';

/**
 * Newsletter sign-up.
 *
 * Client-side validation for immediate feedback; the endpoint revalidates, rate
 * limits and stores. The hidden `company` field is a honeypot — a real visitor never
 * sees it, so anything that fills it in is rejected server-side.
 */
export function NewsletterForm({
  source = 'footer',
  layout = 'stacked',
  className,
}: {
  source?: 'footer' | 'homepage' | 'checkout';
  layout?: 'stacked' | 'inline';
  className?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterFormSchema),
    defaultValues: { email: '', consent: false, company: '' },
  });

  const consent = useWatch({ control, name: 'consent' });

  async function onSubmit(values: NewsletterFormValues) {
    setServerError(null);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, source }),
      });

      const body = (await response.json()) as ApiResult<{ message: string }>;

      if (!body.ok) {
        setServerError(body.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError('We could not reach the server. Please try again in a moment.');
    }
  }

  if (submitted) {
    return (
      <FormStatus tone="success" title="You are on the list" className={className}>
        Watch your inbox — we send new arrivals and restocks, nothing else.
      </FormStatus>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className={cn('flex flex-col gap-3', className)}>
      {serverError && (
        <FormStatus tone="error" title="That did not go through">
          {serverError}
        </FormStatus>
      )}

      <div className={cn(layout === 'inline' ? 'flex flex-col gap-3 sm:flex-row' : 'contents')}>
        <Field label="Email address" error={errors.email?.message} hideLabel className="flex-1">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('email')}
            />
          )}
        </Field>

        <Button type="submit" disabled={isSubmitting} className={layout === 'inline' ? 'sm:w-auto' : ''}>
          {isSubmitting ? (
            <Spinner label="Subscribing" />
          ) : (
            <>
              Subscribe
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      {/* Honeypot: hidden from sight and from assistive technology. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="newsletter-company">Company</label>
        <input id="newsletter-company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
          <Checkbox
            checked={consent}
            onCheckedChange={(checked) =>
              setValue('consent', checked === true, { shouldValidate: true })
            }
            aria-invalid={errors.consent ? true : undefined}
            className="mt-0.5"
          />
          <span>
            Yes, email me new arrivals and offers. I can unsubscribe from any email.
          </span>
        </label>

        {errors.consent?.message && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.consent.message}
          </p>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground/80">
        <Check className="size-3" aria-hidden="true" />
        We never share your address. Unsubscribe in one click.
      </p>
    </form>
  );
}
