'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FormStatus } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useCartLineInputs, useCartStore } from '@/lib/cart/store';
import { commerceConfig } from '@/lib/config/site';
import { shippingCountries } from '@/lib/validations/checkout';
import { checkoutFormSchema, type CheckoutFormValues } from '@/lib/validations/forms';
import { formatPrice } from '@/lib/utils/format';
import type { ApiResult } from '@/lib/api/response';
import type { ShippingMethod } from '@/types';

/**
 * Checkout form.
 *
 * Collects details, then posts ids and quantities — never prices — to /api/orders.
 * The server re-prices the cart, creates the order and returns where to go next, so a
 * tampered client cannot change what it is charged.
 */
export function CheckoutForm({
  paymentMode,
}: {
  paymentMode: { live: boolean; label: string };
}) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const lineInputs = useCartLineInputs();
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const storeShippingMethod = useCartStore((state) => state.shippingMethod);
  const setShippingMethod = useCartStore((state) => state.setShippingMethod);
  const clearCart = useCartStore((state) => state.clear);

  const [serverError, setServerError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: '',
      phone: '',
      shippingAddress: {
        fullName: '',
        line1: '',
        line2: '',
        city: '',
        postalCode: '',
        country: 'Kosovo',
      },
      shippingMethod: storeShippingMethod,
      notes: '',
      subscribe: false,
      acceptTerms: false,
      company: '',
    },
  });

  const shippingMethod = useWatch({ control, name: 'shippingMethod' });
  const country = useWatch({ control, name: 'shippingAddress.country' });
  const subscribe = useWatch({ control, name: 'subscribe' });
  const acceptTerms = useWatch({ control, name: 'acceptTerms' });

  async function onSubmit(values: CheckoutFormValues) {
    setServerError(null);
    setAdjustments([]);

    if (!items.length) {
      setServerError('Your bag is empty. Add something before checking out.');
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          items: lineInputs,
          couponCode: appliedCoupon?.code,
        }),
      });

      // `reference` and `redirectUrl` are null when the server had to adjust the bag —
      // no order was created in that case.
      const body = (await response.json()) as ApiResult<{
        reference: string | null;
        redirectUrl: string | null;
        adjustments: string[];
      }>;

      if (!body.ok) {
        // Field-level errors from the server are surfaced on the inputs themselves.
        if (body.fieldErrors) {
          for (const [path, messages] of Object.entries(body.fieldErrors)) {
            const message = messages?.[0];
            if (message) {
              setError(path as keyof CheckoutFormValues, { type: 'server', message });
            }
          }
        }
        setServerError(body.error);
        return;
      }

      if (body.data.adjustments.length || !body.data.redirectUrl) {
        // Stock changed under us: tell the customer rather than quietly shipping less.
        setAdjustments(
          body.data.adjustments.length
            ? body.data.adjustments
            : ['Something changed while you were checking out. Please review your bag.'],
        );
        return;
      }

      clearCart();
      router.push(body.data.redirectUrl);
    } catch {
      setServerError('We could not reach the server. Your bag has been kept — please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      {serverError && (
        <FormStatus tone="error" title="We could not place this order">
          {serverError}
        </FormStatus>
      )}

      {adjustments.length > 0 && (
        <FormStatus tone="error" title="Your bag needs a quick check">
          <ul className="list-inside list-disc space-y-1">
            {adjustments.map((adjustment) => (
              <li key={adjustment}>{adjustment}</li>
            ))}
          </ul>
          <p className="mt-2">
            <Link href="/cart" className="underline underline-offset-4">
              Review your bag
            </Link>{' '}
            and try again.
          </p>
        </FormStatus>
      )}

      {/* Contact */}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">
          Contact details
        </legend>

        <Field label="Email address" error={errors.email?.message} required>
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

        <Field
          label="Phone number"
          description="Our courier calls before delivery."
          error={errors.phone?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+383 44 000 000"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('phone')}
            />
          )}
        </Field>
      </fieldset>

      <Separator />

      {/* Delivery address */}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">
          Delivery address
        </legend>

        <Field
          label="Full name"
          error={errors.shippingAddress?.fullName?.message}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="name"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('shippingAddress.fullName')}
            />
          )}
        </Field>

        <Field label="Address" error={errors.shippingAddress?.line1?.message} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="address-line1"
              placeholder="Street and number"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('shippingAddress.line1')}
            />
          )}
        </Field>

        <Field
          label="Apartment, floor (optional)"
          error={errors.shippingAddress?.line2?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="address-line2"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('shippingAddress.line2')}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" error={errors.shippingAddress?.city?.message} required>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                autoComplete="address-level2"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register('shippingAddress.city')}
              />
            )}
          </Field>

          <Field
            label="Postal code"
            error={errors.shippingAddress?.postalCode?.message}
            required
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                autoComplete="postal-code"
                inputMode="numeric"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register('shippingAddress.postalCode')}
              />
            )}
          </Field>
        </div>

        <Field label="Country" error={errors.shippingAddress?.country?.message} required>
          {({ id, describedBy, invalid }) => (
            <Select
              value={country}
              onValueChange={(value) =>
                setValue('shippingAddress.country', value as (typeof shippingCountries)[number], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id={id} aria-describedby={describedBy} aria-invalid={invalid}>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {shippingCountries.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      </fieldset>

      <Separator />

      {/* Delivery method */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">
          Delivery method
        </legend>

        <RadioGroup
          value={shippingMethod}
          onValueChange={(value) => {
            setValue('shippingMethod', value as ShippingMethod, { shouldValidate: true });
            // Keep the store in step so the totals panel updates immediately.
            setShippingMethod(value as ShippingMethod);
          }}
        >
          {(Object.keys(commerceConfig.shippingRates) as ShippingMethod[]).map((method) => {
            const rate = commerceConfig.shippingRates[method];
            const inputId = `shipping-${method}`;

            return (
              <label
                key={method}
                htmlFor={inputId}
                className="flex cursor-pointer items-start gap-3 rounded-sm border border-border bg-surface p-4 transition-colors has-[button[data-state=checked]]:border-espresso-500 hover:bg-cream-100"
              >
                <RadioGroupItem id={inputId} value={method} className="mt-0.5" />
                <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="block text-sm font-medium text-foreground">{rate.label}</span>
                    <span className="block text-xs text-muted-foreground">{rate.eta}</span>
                  </span>
                  <span className="text-sm tabular-nums text-foreground">
                    {method === 'standard' ? `from ${formatPrice(rate.price)}` : formatPrice(rate.price)}
                  </span>
                </span>
              </label>
            );
          })}
        </RadioGroup>

        <p className="text-xs text-muted-foreground">
          Standard delivery is free on orders over{' '}
          {formatPrice(commerceConfig.freeShippingThreshold)}.
        </p>
      </fieldset>

      <Separator />

      {/* Payment */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">Payment</legend>

        <div className="flex items-start gap-3 rounded-sm border border-border bg-cream-100 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-champagne-500" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{paymentMode.label}</p>
            {paymentMode.live ? (
              <p className="mt-1 text-xs text-muted-foreground">
                You will be taken to our payment provider to complete payment securely. We never
                see or store your card details.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Card payment is not enabled on this deployment yet. Place the order and we will
                confirm it by email with bank transfer details, or you can pay the courier on
                delivery.
              </p>
            )}
          </div>
        </div>

        <Field label="Delivery notes (optional)" error={errors.notes?.message}>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={3}
              placeholder="Buzzer code, preferred time, anything the courier should know."
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('notes')}
            />
          )}
        </Field>
      </fieldset>

      {/* Honeypot */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="checkout-company">Company</label>
        <input id="checkout-company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <Checkbox
            checked={subscribe}
            onCheckedChange={(checked) => setValue('subscribe', checked === true)}
            className="mt-0.5"
          />
          <span>Email me new arrivals and restocks. No more than twice a month.</span>
        </label>

        <div className="flex flex-col gap-1.5">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground">
            <Checkbox
              checked={acceptTerms}
              onCheckedChange={(checked) =>
                setValue('acceptTerms', checked === true, { shouldValidate: true })
              }
              aria-invalid={errors.acceptTerms ? true : undefined}
              className="mt-0.5"
            />
            <span>
              I accept the terms of sale and understand that opened cosmetics cannot be returned.
            </span>
          </label>

          {errors.acceptTerms?.message && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" block disabled={isSubmitting || !items.length}>
        {isSubmitting ? (
          <>
            <Spinner label="Placing your order" />
            Placing order…
          </>
        ) : (
          <>
            <Lock aria-hidden="true" />
            Place order
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By placing this order you agree to our terms. Questions?{' '}
        <Link href="/contact" className="underline underline-offset-4 hover:text-foreground">
          Talk to us
        </Link>
        .
      </p>
    </form>
  );
}
