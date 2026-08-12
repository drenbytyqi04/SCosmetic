'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
  verifyAdminCredentials,
} from '@/lib/auth/session';
import { getContactRepository, getNewsletterRepository } from '@/lib/marketing/repository';
import { getOrderRepository } from '@/lib/orders/repository';
import { getProductRepository } from '@/lib/products/repository';
import { productWriteSchema, orderStatusUpdateSchema, stockAdjustSchema, toNewProduct } from '@/lib/validations/product';
import { toFieldErrors, type FieldErrors } from '@/lib/validations/common';
import { adminLoginFormSchema } from '@/lib/validations/forms';
import { rateLimit } from '@/lib/api/rate-limit';
import type { Product } from '@/types';

/**
 * Admin server actions.
 *
 * Every mutating action begins with `requireAdmin()`. Middleware already blocks
 * unauthenticated navigation to /admin, but a server action is an endpoint in its own
 * right — anyone who can construct the request can call it, so the check has to live
 * here too.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/* ------------------------------------------------------------------ *
 * Authentication
 * ------------------------------------------------------------------ */

/**
 * Failure messages. Configuration problems name the missing variable, because the
 * person hitting them is the operator. A wrong credential stays deliberately vague and
 * never reveals which half was wrong.
 */
const LOGIN_FAILURE_MESSAGE = {
  invalid_credentials: 'Those credentials are not correct.',
  not_configured:
    'Admin access is not configured on this deployment. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH, then redeploy.',
  missing_session_secret:
    'AUTH_SECRET is missing or shorter than 32 characters, so no session can be issued. Set it in this environment, then redeploy.',
} as const;

export interface LoginState {
  error?: string;
  fieldErrors?: FieldErrors;
  /**
   * The submitted email, echoed back so a failed attempt does not clear the field —
   * React resets an uncontrolled form once its action settles.
   */
  email?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const submittedEmail = String(formData.get('email') ?? '').slice(0, 254);

  const parsed = adminLoginFormSchema.safeParse({
    email: submittedEmail,
    password: String(formData.get('password') ?? ''),
  });

  if (!parsed.success) {
    return {
      error: 'Check the fields below.',
      fieldErrors: toFieldErrors(parsed.error),
      email: submittedEmail,
    };
  }

  // Throttled by email so a single account cannot be brute-forced, regardless of
  // where the attempts come from.
  const limit = rateLimit(`admin-login:${parsed.data.email}`, { limit: 5, windowSeconds: 300 });
  if (!limit.success) {
    return {
      error: `Too many attempts. Try again in ${limit.retryAfter} seconds.`,
      email: submittedEmail,
    };
  }

  const result = await verifyAdminCredentials(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    return {
      error: LOGIN_FAILURE_MESSAGE[result.reason],
      email: submittedEmail,
    };
  }

  await createAdminSession(parsed.data.email);

  const from = String(formData.get('from') ?? '/admin');
  // Only same-origin relative paths are honoured, so `from` cannot be used as an
  // open-redirect vector.
  const destination = from.startsWith('/admin') ? from : '/admin';
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect('/admin/login');
}

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

export async function createProductAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin('/admin/products/new');

  const parsed = productWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Check the fields below.', fieldErrors: toFieldErrors(parsed.error) };
  }

  const repository = getProductRepository();

  // Slugs are the public URL, so a collision is a conflict rather than a merge.
  const existing = await repository.findBySlug(parsed.data.slug);
  if (existing) {
    return {
      ok: false,
      error: 'A product with that slug already exists.',
      fieldErrors: { slug: ['This slug is already taken.'] },
    };
  }

  const product = await repository.create(toNewProduct(parsed.data));

  revalidateStorefront(product);
  return { ok: true, data: { id: product.id } };
}

export async function updateProductAction(
  productId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin(`/admin/products/${productId}/edit`);

  const parsed = productWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Check the fields below.', fieldErrors: toFieldErrors(parsed.error) };
  }

  const repository = getProductRepository();
  const clash = await repository.findBySlug(parsed.data.slug);
  if (clash && clash.id !== productId) {
    return {
      ok: false,
      error: 'Another product already uses that slug.',
      fieldErrors: { slug: ['This slug is already taken.'] },
    };
  }

  const next = toNewProduct(parsed.data);
  const updated = await repository.update(productId, {
    ...next,
    // An empty sale price must clear the discount, not leave the old one in place.
    ...(parsed.data.salePrice === undefined ? { salePrice: undefined } : {}),
  });

  if (!updated) return { ok: false, error: 'That product no longer exists.' };

  revalidateStorefront(updated);
  return { ok: true, data: { id: updated.id } };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  await requireAdmin('/admin/products');

  const repository = getProductRepository();
  const product = await repository.findById(productId);
  if (!product) return { ok: false, error: 'That product no longer exists.' };

  const removed = await repository.remove(productId);
  if (!removed) return { ok: false, error: 'We could not delete that product.' };

  revalidateStorefront(product);
  return { ok: true, data: undefined };
}

export async function adjustStockAction(input: unknown): Promise<ActionResult<{ stock: number }>> {
  await requireAdmin('/admin/inventory');

  const parsed = stockAdjustSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid adjustment.', fieldErrors: toFieldErrors(parsed.error) };
  }

  const updated = await getProductRepository().adjustStock(parsed.data.productId, parsed.data.delta);
  if (!updated) return { ok: false, error: 'That product no longer exists.' };

  revalidateStorefront(updated);
  revalidatePath('/admin/inventory');
  return { ok: true, data: { stock: updated.stock } };
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export async function updateOrderStatusAction(input: unknown): Promise<ActionResult> {
  await requireAdmin('/admin/orders');

  const parsed = orderStatusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Choose a valid status.', fieldErrors: toFieldErrors(parsed.error) };
  }

  const updated = await getOrderRepository().updateStatus(parsed.data.orderId, parsed.data.status);
  if (!updated) return { ok: false, error: 'That order no longer exists.' };

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${updated.id}`);
  revalidatePath('/admin');
  return { ok: true, data: undefined };
}

/* ------------------------------------------------------------------ *
 * Marketing
 * ------------------------------------------------------------------ */

export async function setMessageHandledAction(
  messageId: string,
  handled: boolean,
): Promise<ActionResult> {
  await requireAdmin('/admin/messages');

  const updated = await getContactRepository().markHandled(messageId, handled);
  if (!updated) return { ok: false, error: 'That message no longer exists.' };

  revalidatePath('/admin/messages');
  return { ok: true, data: undefined };
}

export async function removeSubscriberAction(subscriberId: string): Promise<ActionResult> {
  await requireAdmin('/admin/newsletter');

  const removed = await getNewsletterRepository().remove(subscriberId);
  if (!removed) return { ok: false, error: 'That subscriber no longer exists.' };

  revalidatePath('/admin/newsletter');
  return { ok: true, data: undefined };
}

/* ------------------------------------------------------------------ *
 * Cache invalidation
 * ------------------------------------------------------------------ */

/**
 * Refreshes every storefront surface a product appears on. Products are statically
 * rendered, so without this an edit would not show until the revalidate window
 * elapsed.
 */
function revalidateStorefront(product: Product): void {
  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/categories');
  revalidatePath(`/category/${product.category}`);
  revalidatePath(`/products/${product.slug}`);
  revalidatePath('/admin/products');
  revalidatePath('/admin');
}
