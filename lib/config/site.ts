/**
 * Single source of truth for brand-level configuration.
 * Anything that appears in more than one place (navigation, footer, SEO) lives here.
 */

export const siteConfig = {
  name: 'COSMETICS.KS',
  legalName: 'Cosmetics KS L.L.C.',
  shortName: 'Cosmetics KS',
  tagline: 'Beauty, considered.',
  description:
    'Curated prestige beauty from Prishtina. Skincare, complexion and fragrance chosen for how they perform, delivered across Kosovo and the region.',
  locale: 'en',
  currency: 'EUR',
  country: 'XK',
  email: 'hello@cosmetics-ks.com',
  supportEmail: 'care@cosmetics-ks.com',
  phone: '+383 44 000 000',
  address: {
    street: 'Rr. Mother Teresa 18',
    city: 'Prishtina',
    postalCode: '10000',
    country: 'Kosovo',
  },
  openingHours: 'Mon–Sat, 10:00–20:00',
  social: {
    instagram: 'https://instagram.com/cosmetics.ks',
    tiktok: 'https://tiktok.com/@cosmetics.ks',
    facebook: 'https://facebook.com/cosmetics.ks',
  },
  instagramHandle: '@cosmetics.ks',
} as const;

/**
 * Public base URL. Set NEXT_PUBLIC_SITE_URL in every deployed environment so
 * canonical URLs, sitemaps and Open Graph images resolve to absolute addresses.
 */
export function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

export const mainNav: NavItem[] = [
  { label: 'Shop all', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'New in', href: '/shop?tag=newArrival' },
  { label: 'Bestsellers', href: '/shop?tag=bestseller' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const footerNav: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Shop',
    items: [
      { label: 'All products', href: '/shop' },
      { label: 'New arrivals', href: '/shop?tag=newArrival' },
      { label: 'Bestsellers', href: '/shop?tag=bestseller' },
      { label: 'On sale', href: '/shop?sale=1' },
      { label: 'Wishlist', href: '/wishlist' },
    ],
  },
  {
    title: 'Categories',
    items: [
      { label: 'Skincare', href: '/category/skincare' },
      { label: 'Complexion', href: '/category/complexion' },
      { label: 'Lips', href: '/category/lips' },
      { label: 'Eyes', href: '/category/eyes' },
      { label: 'Fragrance', href: '/category/fragrance' },
    ],
  },
  {
    title: 'House',
    items: [
      { label: 'Our story', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Shipping & returns', href: '/about#shipping' },
      { label: 'Ingredient policy', href: '/about#ingredients' },
    ],
  },
];

/** Commerce rules that both the UI and the server pricing logic read from. */
export const commerceConfig = {
  /** Free standard shipping above this subtotal, in cents. */
  freeShippingThreshold: 5000,
  shippingRates: {
    standard: { label: 'Standard delivery', eta: '2–4 working days', price: 300 },
    express: { label: 'Express delivery', eta: 'Next working day', price: 700 },
  },
  /** VAT rate applied to the discounted subtotal. Kosovo standard rate. */
  taxRate: 0.18,
  maxQuantityPerLine: 10,
  productsPerPage: 12,
} as const;
