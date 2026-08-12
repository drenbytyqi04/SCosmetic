import type { Product } from '@/types';

/**
 * Search matching and ranking.
 *
 * Shared by both repository implementations so a search returns the same order
 * whichever data source is active. Keeping it here also means the Postgres
 * implementation can swap SQL matching for full-text search without changing how
 * results are ranked.
 */

/** Splits a query into the tokens that must all match. */
export function searchTokens(term: string | undefined): string[] {
  if (!term?.trim()) return [];
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
}

/** Everything a product exposes to search, lowercased. */
function haystack(product: Product): string {
  return [
    product.name,
    product.brand,
    product.category,
    product.tagline,
    product.description,
    ...(product.shades?.map((shade) => shade.name) ?? []),
    ...(product.ingredients ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * True when every token appears somewhere. Narrow beats fuzzy for a catalogue this
 * size, and it keeps results predictable.
 */
export function matchesSearch(product: Product, term: string): boolean {
  const tokens = searchTokens(term);
  if (!tokens.length) return true;
  const text = haystack(product);
  return tokens.every((token) => text.includes(token));
}

/**
 * Score by *where* the term matched: an exact product name outranks a passing mention
 * in a description.
 */
export function searchScore(product: Product, term: string): number {
  const needle = term.toLowerCase().trim();
  const name = product.name.toLowerCase();

  if (name === needle) return 100;
  if (name.startsWith(needle)) return 80;
  if (name.includes(needle)) return 60;
  if (product.brand.toLowerCase().includes(needle)) return 40;
  if (product.tagline.toLowerCase().includes(needle)) return 25;
  return 10;
}

/**
 * Ranks matches best-first. Sold-out products still sink to the bottom, so search
 * agrees with every other listing on the site.
 */
export function rankSearchResults(products: Product[], term: string): Product[] {
  return [...products].sort(
    (a, b) =>
      Number(b.stock > 0) - Number(a.stock > 0) ||
      searchScore(b, term) - searchScore(a, term) ||
      a.name.localeCompare(b.name),
  );
}
