import 'server-only';

import { getPrisma } from '@/lib/db/prisma';
import type { CouponRepository } from '@/lib/cart/coupons';
import type { Coupon } from '@/types';

/** Postgres implementation of coupon lookup. */
export const prismaCouponRepository: CouponRepository = {
  async findByCode(code) {
    const row = await getPrisma().coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    return row ? toCoupon(row) : null;
  },

  async list() {
    const rows = await getPrisma().coupon.findMany({ orderBy: { code: 'asc' } });
    return rows.map(toCoupon);
  },
};

function toCoupon(row: {
  code: string;
  type: Coupon['type'];
  value: number;
  description: string;
  minSubtotal: number | null;
  expiresAt: Date | null;
  active: boolean;
}): Coupon {
  const coupon: Coupon = {
    code: row.code,
    type: row.type,
    value: row.value,
    description: row.description,
    active: row.active,
  };

  if (row.minSubtotal !== null) coupon.minSubtotal = row.minSubtotal;
  if (row.expiresAt !== null) coupon.expiresAt = row.expiresAt.toISOString();

  return coupon;
}
