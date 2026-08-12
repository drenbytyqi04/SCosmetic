'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FormStatus } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
import { createProductAction, updateProductAction } from '@/lib/admin/actions';
import { productFormSchema, type ProductFormValues } from '@/lib/validations/forms';
import { centsToAmount } from '@/lib/utils/format';
import { slugify } from '@/lib/utils/sanitize';
import type { Category, Product } from '@/types';

/**
 * Product create/edit form.
 *
 * The same component serves both, because the fields are identical and duplicating
 * them would guarantee they drift. It submits a plain object to a server action, which
 * re-validates with the authoritative schema — the client schema here exists for
 * inline feedback only.
 */
export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const isEditing = Boolean(product);

  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product),
  });

  const category = useWatch({ control, name: 'category' });
  const name = useWatch({ control, name: 'name' });
  const featured = useWatch({ control, name: 'featured' });
  const bestseller = useWatch({ control, name: 'bestseller' });
  const newArrival = useWatch({ control, name: 'newArrival' });

  async function onSubmit(values: ProductFormValues) {
    setServerError(null);
    setSaved(false);

    const result = isEditing
      ? await updateProductAction(product!.id, values)
      : await createProductAction(values);

    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [path, messages] of Object.entries(result.fieldErrors)) {
          const message = messages?.[0];
          if (message) setError(path as keyof ProductFormValues, { type: 'server', message });
        }
      }
      setServerError(result.error);
      return;
    }

    setSaved(true);
    router.push('/admin/products');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-3xl flex-col gap-8">
      {serverError && (
        <FormStatus tone="error" title="Could not save">
          {serverError}
        </FormStatus>
      )}

      {saved && (
        <FormStatus tone="success" title="Saved">
          Redirecting to the product list…
        </FormStatus>
      )}

      {/* Identity */}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">Basics</legend>

        <Field label="Product name" error={errors.name?.message} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('name')}
            />
          )}
        </Field>

        <Field
          label="URL slug"
          description="Appears in the product URL. Lowercase letters, numbers and hyphens."
          error={errors.slug?.message}
          required
        >
          {({ id, describedBy, invalid }) => (
            <div className="flex gap-2">
              <Input
                id={id}
                spellCheck={false}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register('slug')}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 shrink-0"
                onClick={() =>
                  setValue('slug', slugify(name ?? ''), { shouldValidate: true })
                }
              >
                From name
              </Button>
            </div>
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Brand" error={errors.brand?.message} required>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register('brand')}
              />
            )}
          </Field>

          <Field label="Category" error={errors.category?.message} required>
            {({ id, describedBy, invalid }) => (
              <Select
                value={category}
                onValueChange={(value) =>
                  setValue('category', value as ProductFormValues['category'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id={id} aria-describedby={describedBy} aria-invalid={invalid}>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((option) => (
                    <SelectItem key={option.slug} value={option.slug}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </div>

        <Field
          label="Tagline"
          description="One line, shown on product cards and used in meta descriptions."
          error={errors.tagline?.message}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('tagline')}
            />
          )}
        </Field>

        <Field label="Description" error={errors.description?.message} required>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={4}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('description')}
            />
          )}
        </Field>
      </fieldset>

      <Separator />

      {/* Pricing & stock */}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">
          Price &amp; stock
        </legend>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Price (€)" error={errors.price?.message} required>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                inputMode="decimal"
                placeholder="24.50"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register('price')}
              />
            )}
          </Field>

          <Field
            label="Sale price (€)"
            description="Leave empty for no discount."
            error={errors.salePrice?.message}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                inputMode="decimal"
                placeholder="19.90"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register('salePrice')}
              />
            )}
          </Field>

          <Field label="Stock" error={errors.stock?.message} required>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                inputMode="numeric"
                placeholder="24"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register('stock')}
              />
            )}
          </Field>
        </div>

        <Field
          label="Size"
          description="Volume or weight, e.g. 30 ml. Optional."
          error={errors.size?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              placeholder="30 ml"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('size')}
            />
          )}
        </Field>
      </fieldset>

      <Separator />

      {/* Content */}
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">Content</legend>

        <Field
          label="Images"
          description="One local path per line, e.g. /images/products/my-product-1.png"
          error={errors.images?.message}
          required
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={3}
              spellCheck={false}
              className="font-mono text-xs"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('images')}
            />
          )}
        </Field>

        <Field
          label="Detail paragraphs"
          description="One paragraph per line. Shown in the product detail accordion."
          error={errors.details?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={5}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('details')}
            />
          )}
        </Field>

        <Field label="How to use" error={errors.howToUse?.message}>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={3}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('howToUse')}
            />
          )}
        </Field>

        <Field
          label="Key ingredients"
          description="Comma separated."
          error={errors.ingredients?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={2}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('ingredients')}
            />
          )}
        </Field>

        <Field
          label="Benefits"
          description="Comma separated. Shown as badges, so keep them short."
          error={errors.benefits?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('benefits')}
            />
          )}
        </Field>
      </fieldset>

      <Separator />

      {/* Merchandising */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-serif text-xl font-light text-foreground">
          Merchandising
        </legend>

        {(
          [
            ['featured', 'Featured — appears in the homepage edit', featured],
            ['bestseller', 'Bestseller — appears in the bestsellers rail', bestseller],
            ['newArrival', 'New in — appears in the new arrivals rail', newArrival],
          ] as const
        ).map(([key, label, checked]) => (
          <label key={key} className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => setValue(key, next === true)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner label="Saving" />
              Saving…
            </>
          ) : (
            <>
              <Save aria-hidden="true" />
              {isEditing ? 'Save changes' : 'Create product'}
            </>
          )}
        </Button>

        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Maps a stored product onto the string-shaped values an HTML form works with. */
function toFormValues(product?: Product): ProductFormValues {
  if (!product) {
    return {
      name: '',
      slug: '',
      brand: '',
      category: 'skincare',
      tagline: '',
      description: '',
      details: '',
      howToUse: '',
      price: '',
      salePrice: '',
      stock: '0',
      size: '',
      images: '',
      ingredients: '',
      benefits: '',
      featured: false,
      bestseller: false,
      newArrival: false,
    };
  }

  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    tagline: product.tagline,
    description: product.description,
    details: product.details.join('\n'),
    howToUse: product.howToUse ?? '',
    price: centsToAmount(product.price),
    salePrice: product.salePrice !== undefined ? centsToAmount(product.salePrice) : '',
    stock: String(product.stock),
    size: product.size ?? '',
    images: product.images.join('\n'),
    ingredients: (product.ingredients ?? []).join(', '),
    benefits: (product.benefits ?? []).join(', '),
    featured: product.featured ?? false,
    bestseller: product.bestseller ?? false,
    newArrival: product.newArrival ?? false,
  };
}
