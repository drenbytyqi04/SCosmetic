import 'server-only';

import { store } from '@/lib/db/store';
import type { Coupon } from '@/types';

/**
 * Coupon data access. Server-only — never import this from a Client Component,
 * or the full coupon table (including inactive codes) ends up in the bundle.
 */

export interface CouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  list(): Promise<Coupon[]>;
}

export const memoryCouponRepository: CouponRepository = {
  async findByCode(code) {
    const normalised = code.trim().toUpperCase();
    const found = store.coupons.find((coupon) => coupon.code === normalised);
    return found ? { ...found } : null;
  },
  async list() {
    return store.coupons.map((coupon) => ({ ...coupon }));
  },
};

export function getCouponRepository(): CouponRepository {
  return memoryCouponRepository;
}

export function normaliseCouponCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 24);
}
