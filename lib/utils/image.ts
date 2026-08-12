import type { CategorySlug } from '@/types';

/**
 * Tone used for the low-quality image placeholder per category, matching the
 * generated artwork in /public/images. Swapping in real photography means
 * swapping these for real base64 LQIPs (or static imports).
 */
const CATEGORY_TONE: Record<CategorySlug, string> = {
  lips: '#F1DED9',
  complexion: '#F2E8DA',
  skincare: '#EEE5D9',
  eyes: '#E6DFD6',
  fragrance: '#EBE4D8',
  tools: '#EDE7DF',
  body: '#E8E7E0',
};

const FALLBACK_TONE = '#F1E9DF';

/** A 1×1 SVG data URI in the given colour — valid input for next/image blurDataURL. */
export function blurDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="5"><rect width="4" height="5" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function categoryBlurDataUrl(category?: CategorySlug): string {
  return blurDataUrl(category ? CATEGORY_TONE[category] : FALLBACK_TONE);
}

/**
 * Responsive `sizes` presets. Getting these right is the single biggest lever on
 * how many bytes a mobile visitor downloads, so they are centralised rather than
 * guessed per component.
 */
export const imageSizes = {
  productCard: '(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 50vw',
  productHero: '(min-width: 1024px) 46vw, 100vw',
  categoryCard: '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw',
  hero: '100vw',
  thumbnail: '96px',
  cartLine: '96px',
  instagram: '(min-width: 1024px) 16vw, 33vw',
} as const;
