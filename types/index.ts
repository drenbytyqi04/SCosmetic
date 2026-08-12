/**
 * Domain types for the COSMETICS.KS storefront.
 *
 * These are the contract between the data layer (currently in-memory, later
 * Postgres/Prisma) and the UI. Nothing in `components/` should define its own
 * shape for a domain entity — import from here instead.
 */

/** Money is stored in minor units (cents) everywhere to avoid float drift. */
export type Cents = number;

export type CategorySlug =
  | 'lips'
  | 'complexion'
  | 'skincare'
  | 'eyes'
  | 'fragrance'
  | 'tools'
  | 'body';

export interface Shade {
  /** Stable identifier used in cart line items. */
  id: string;
  name: string;
  /** Hex swatch rendered in the UI. */
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  /** Short one-line pitch used on cards and meta descriptions. */
  tagline: string;
  description: string;
  /** Long-form editorial copy, rendered as paragraphs on the detail page. */
  details: string[];
  howToUse?: string;
  /** Price in cents. */
  price: Cents;
  /** Sale price in cents; when present it is the price actually charged. */
  salePrice?: Cents;
  images: string[];
  shades?: Shade[];
  ingredients?: string[];
  benefits?: string[];
  rating?: number;
  reviewCount?: number;
  stock: number;
  /** Volume or weight, e.g. "30 ml". */
  size?: string;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  image: string;
  /** Controls ordering in navigation and category grids. */
  position: number;
}

/* ------------------------------------------------------------------ *
 * Cart
 * ------------------------------------------------------------------ */

export interface CartItem {
  /** `productId` or `productId:shadeId` — unique per configurable variant. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  /** Unit price in cents at the time the line was priced. */
  unitPrice: Cents;
  /** Original price when the line is discounted, for strikethrough display. */
  compareAtPrice?: Cents;
  quantity: number;
  shadeId?: string;
  shadeName?: string;
  /** Stock snapshot, used to cap the quantity stepper client-side. */
  maxQuantity: number;
}

export interface CartTotals {
  subtotal: Cents;
  discount: Cents;
  shipping: Cents;
  tax: Cents;
  total: Cents;
  itemCount: number;
  /** Amount still needed to unlock free shipping; 0 when already unlocked. */
  freeShippingRemaining: Cents;
}

/* ------------------------------------------------------------------ *
 * Coupons
 * ------------------------------------------------------------------ */

export type CouponType = 'percentage' | 'fixed' | 'free_shipping';

export interface Coupon {
  code: string;
  type: CouponType;
  /** Percent (1–100) for `percentage`, cents for `fixed`, ignored otherwise. */
  value: number;
  description: string;
  /** Minimum cart subtotal in cents required for the coupon to apply. */
  minSubtotal?: Cents;
  /** ISO date after which the coupon stops working. */
  expiresAt?: string;
  active: boolean;
}

export interface AppliedCoupon {
  code: string;
  type: CouponType;
  description: string;
  /** Discount actually granted against the current cart, in cents. */
  amount: Cents;
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
export type PaymentStatus = 'requires_payment' | 'processing' | 'succeeded' | 'failed';
export type ShippingMethod = 'standard' | 'express';

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderLine {
  productId: string;
  slug: string;
  name: string;
  shadeName?: string;
  unitPrice: Cents;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  /** Human-facing reference, e.g. `KS-8F31A2`. */
  reference: string;
  email: string;
  phone?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Reference from the payment provider once one is configured. */
  paymentIntentId?: string;
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  lines: OrderLine[];
  totals: CartTotals;
  couponCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  email: string;
  fullName: string;
  city?: string;
  orderCount: number;
  totalSpent: Cents;
  createdAt: string;
  lastOrderAt?: string;
}

/* ------------------------------------------------------------------ *
 * Marketing
 * ------------------------------------------------------------------ */

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: 'footer' | 'homepage' | 'checkout';
  confirmed: boolean;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ *
 * Querying
 * ------------------------------------------------------------------ */

export type ProductSort =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'name-asc';

export interface ProductQuery {
  q?: string;
  categories?: CategorySlug[];
  brands?: string[];
  /** Inclusive price bounds in cents. */
  minPrice?: Cents;
  maxPrice?: Cents;
  onSale?: boolean;
  inStock?: boolean;
  tags?: Array<'featured' | 'bestseller' | 'newArrival'>;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** Aggregates used to build the filter sidebar without a second round trip. */
export interface ProductFacets {
  brands: Array<{ value: string; count: number }>;
  categories: Array<{ value: CategorySlug; label: string; count: number }>;
  priceRange: { min: Cents; max: Cents };
}
