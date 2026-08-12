/**
 * Text hygiene for anything that originates outside the application.
 *
 * All user-generated content in this app is rendered as text (React escapes it),
 * so this is defence in depth rather than the only line of protection: it strips
 * control characters and markup-ish noise before values reach storage, logs or
 * outbound email.
 */

// C0/C1 control characters, keeping \n and \t which are normalised separately.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const COMBINING_MARKS = /[\u0300-\u036F]/g;

/** Normalises whitespace, removes control characters and clips the length. */
export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/** Single-line variant: newlines collapse to spaces. */
export function sanitizeLine(input: string, maxLength = 200): string {
  return sanitizeText(input, maxLength).replace(/\n+/g, ' ').trim();
}

/** Lowercases and trims an email without attempting to validate it (Zod does that). */
export function normaliseEmail(input: string): string {
  return sanitizeLine(input, 254).toLowerCase();
}

/** Removes any HTML tags outright — used for values echoed into emails. */
export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
