import 'server-only';

import { Prisma } from '@/lib/db/generated/client';
import { getPrisma } from '@/lib/db/prisma';
import { createOrderReference } from '@/lib/db/ids';
import type { OrderRepository, OrderStats } from '@/lib/orders/repository';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

/**
 * Postgres implementation of the order repository.
 *
 * The interesting part is `create()`: the order, its lines, the customer aggregate and
 * the stock reservation all commit together or not at all.
 */

const orderInclude = { lines: { orderBy: { id: 'asc' } } } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toOrder(row: OrderRow): Order {
  const order: Order = {
    id: row.id,
    reference: row.reference,
    email: row.email,
    status: row.status,
    paymentStatus: row.paymentStatus,
    shippingAddress: {
      fullName: row.shippingName,
      line1: row.shippingLine1,
      city: row.shippingCity,
      postalCode: row.shippingPostalCode,
      country: row.shippingCountry,
      ...(row.shippingLine2 !== null ? { line2: row.shippingLine2 } : {}),
    },
    shippingMethod: row.shippingMethod,
    lines: row.lines.map((line) => ({
      productId: line.productId ?? '',
      slug: line.slug,
      name: line.name,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      image: line.image,
      ...(line.shadeName !== null ? { shadeName: line.shadeName } : {}),
    })),
    totals: {
      subtotal: row.subtotal,
      discount: row.discount,
      shipping: row.shipping,
      tax: row.tax,
      total: row.total,
      itemCount: row.lines.reduce((sum, line) => sum + line.quantity, 0),
      // Historical: an order that shipped has no outstanding free-shipping gap.
      freeShippingRemaining: 0,
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  if (row.phone !== null) order.phone = row.phone;
  if (row.paymentIntentId !== null) order.paymentIntentId = row.paymentIntentId;
  if (row.couponCode !== null) order.couponCode = row.couponCode;
  if (row.notes !== null) order.notes = row.notes;

  return order;
}

export const prismaOrderRepository: OrderRepository = {
  async create(input) {
    const created = await getPrisma().$transaction(async (tx) => {
      /*
       * Reserve stock with a guarded UPDATE per line. The `stock >= quantity` predicate
       * is what makes this safe: if another transaction took the last unit first, zero
       * rows are affected and we abort instead of overselling.
       */
      for (const line of input.lines) {
        const affected = await tx.$executeRaw(Prisma.sql`
          UPDATE "Product"
          SET stock = stock - ${line.quantity},
              "updatedAt" = NOW()
          WHERE id = ${line.productId} AND stock >= ${line.quantity}
        `);

        if (affected === 0) return null;
      }

      // Keep the customer aggregate in step. `upsert` on the unique email means a
      // returning customer accumulates rather than duplicating.
      const customer = await tx.customer.upsert({
        where: { email: input.email },
        create: {
          email: input.email,
          fullName: input.shippingAddress.fullName,
          city: input.shippingAddress.city,
          lastOrderAt: new Date(),
        },
        update: { lastOrderAt: new Date() },
        select: { id: true },
      });

      // The coupon may have been deactivated or deleted since it was applied; the order
      // records the code either way, so only link the relation when the row still exists.
      const coupon = input.couponCode
        ? await tx.coupon.findUnique({ where: { code: input.couponCode }, select: { code: true } })
        : null;

      return tx.order.create({
        data: {
          reference: createOrderReference(),
          email: input.email,
          phone: input.phone ?? null,
          shippingMethod: input.shippingMethod,
          shippingName: input.shippingAddress.fullName,
          shippingLine1: input.shippingAddress.line1,
          shippingLine2: input.shippingAddress.line2 ?? null,
          shippingCity: input.shippingAddress.city,
          shippingPostalCode: input.shippingAddress.postalCode,
          shippingCountry: input.shippingAddress.country,
          subtotal: input.totals.subtotal,
          discount: input.totals.discount,
          shipping: input.totals.shipping,
          tax: input.totals.tax,
          total: input.totals.total,
          notes: input.notes ?? null,
          couponCode: coupon?.code ?? null,
          customerId: customer.id,
          lines: {
            create: input.lines.map((line) => ({
              productId: line.productId || null,
              slug: line.slug,
              name: line.name,
              shadeName: line.shadeName ?? null,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              image: line.image,
            })),
          },
        },
        include: orderInclude,
      });
    });

    return created ? toOrder(created) : null;
  },

  async findById(id) {
    const row = await getPrisma().order.findUnique({ where: { id }, include: orderInclude });
    return row ? toOrder(row) : null;
  },

  async findByReference(reference) {
    const row = await getPrisma().order.findUnique({
      where: { reference: reference.trim().toUpperCase() },
      include: orderInclude,
    });
    return row ? toOrder(row) : null;
  },

  async list(filter = {}) {
    const rows = await getPrisma().order.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.email ? { email: { equals: filter.email, mode: 'insensitive' } } : {}),
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      ...(filter.limit ? { take: filter.limit } : {}),
    });
    return rows.map(toOrder);
  },

  async updateStatus(id, status) {
    // Payment state follows the order state, exactly as the in-memory version does.
    const paymentStatus: PaymentStatus | undefined =
      status === 'paid' || status === 'fulfilled'
        ? 'succeeded'
        : status === 'refunded'
          ? 'failed'
          : undefined;

    return updateOrder(id, { status, ...(paymentStatus ? { paymentStatus } : {}) });
  },

  async attachPaymentIntent(id, paymentIntentId) {
    return updateOrder(id, { paymentIntentId, paymentStatus: 'processing' });
  },

  async markPaid(id, paymentIntentId) {
    return updateOrder(id, {
      status: 'paid',
      paymentStatus: 'succeeded',
      ...(paymentIntentId ? { paymentIntentId } : {}),
    });
  },

  async stats(): Promise<OrderStats> {
    // Cancelled and refunded orders leave history but not revenue.
    const billable: Prisma.OrderWhereInput = {
      status: { notIn: ['cancelled', 'refunded'] satisfies OrderStatus[] },
    };

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 13);

    const [revenue, orderCount, pendingCount, fulfilledCount, trendRows] = await Promise.all([
      getPrisma().order.aggregate({ where: billable, _sum: { total: true }, _count: { _all: true } }),
      getPrisma().order.count(),
      getPrisma().order.count({ where: { status: 'pending' } }),
      getPrisma().order.count({ where: { status: 'fulfilled' } }),
      // Grouped in the database rather than by fetching every order and bucketing it.
      getPrisma().$queryRaw<Array<{ day: Date; revenue: bigint }>>(Prisma.sql`
        SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day,
               SUM(total)::bigint AS revenue
        FROM "Order"
        WHERE status NOT IN ('cancelled', 'refunded') AND "createdAt" >= ${since}
        GROUP BY day
      `),
    ]);

    const billableTotal = revenue._sum.total ?? 0;
    const billableCount = revenue._count._all;

    const revenueByDay = new Map(
      trendRows.map((row) => [row.day.toISOString().slice(0, 10), Number(row.revenue)]),
    );

    const trend: OrderStats['trend'] = [];
    for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
      const day = new Date();
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - daysAgo);
      const key = day.toISOString().slice(0, 10);
      trend.push({ date: key, revenue: revenueByDay.get(key) ?? 0 });
    }

    return {
      revenue: billableTotal,
      orderCount,
      averageOrderValue: billableCount ? Math.round(billableTotal / billableCount) : 0,
      pendingCount,
      fulfilledCount,
      trend,
    };
  },
};

async function updateOrder(id: string, data: Prisma.OrderUpdateInput): Promise<Order | null> {
  try {
    const row = await getPrisma().order.update({ where: { id }, data, include: orderInclude });
    return toOrder(row);
  } catch (error) {
    // P2025: no such order — a null result, not an exception for the caller.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2025'
    ) {
      return null;
    }
    throw error;
  }
}
