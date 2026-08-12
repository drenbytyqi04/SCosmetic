import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { toFieldErrors, type FieldErrors } from '@/lib/validations/common';

/**
 * Uniform JSON envelope for every route handler.
 *
 * Two shapes only — success or failure — so client code has exactly one branch to
 * write, and internal error details never leak into a response body.
 */

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: string;
  code: ApiErrorCode;
  fieldErrors?: FieldErrors;
};
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type ApiErrorCode =
  | 'bad_request'
  | 'validation_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server_error';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  validation_error: 422,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  server_error: 500,
};

export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccess<T>, {
    status: 200,
    ...init,
  });
}

export function apiError(
  code: ApiErrorCode,
  error: string,
  extra?: { fieldErrors?: FieldErrors; headers?: HeadersInit },
): NextResponse<ApiFailure> {
  const body: ApiFailure = { ok: false, error, code };
  if (extra?.fieldErrors) body.fieldErrors = extra.fieldErrors;

  return NextResponse.json(body, {
    status: STATUS_BY_CODE[code],
    ...(extra?.headers ? { headers: extra.headers } : {}),
  });
}

export function apiValidationError(error: z.ZodError): NextResponse<ApiFailure> {
  return apiError('validation_error', 'Some fields need attention.', {
    fieldErrors: toFieldErrors(error),
  });
}

/** Parses a JSON body defensively — a malformed payload is a 400, never a 500. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Wraps a handler so an unexpected throw becomes a generic 500 instead of a stack
 * trace in the response. The detail goes to the server log only.
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>,
  context: string,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error(`[api:${context}]`, error);
    return apiError('server_error', 'Something went wrong on our side. Please try again.');
  }
}
