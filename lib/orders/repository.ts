import 'server-only';

import { createId, createOrderReference, store } from '@/lib/db/store';
import type { Address, CartTotals, Order, OrderLine, OrderStatus, ShippingMethod } from '@/types';

/**
 * Order persistence.
 *
 * The same interface a Prisma implementation would satisfy. Orders are the one
 * place where "eventually a real database" is not optional, which is why the
 * seam is drawn explicitly here.
 */

export interface NewOrderInput {
  email: string;
  phone?: string;
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  lines: OrderLine[];
  totals: CartTotals;
  couponCode?: string;
  notes?: string;
}

export interface OrderListFilter {
  status?: OrderStatus;
  email?: string;
  limit?: number;
}

export interface OrderRepository {
  create(input: NewOrderInput): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByReference(reference: string): Promise<Order | null>;
  list(filter?: OrderListFilter): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order | null>;
  attachPaymentIntent(id: string, paymentIntentId: string): Promise<Order | null>;
  markPaid(id: string, paymentIntentId?: string): Promise<Order | null>;
  stats(): Promise<OrderStats>;
}

export interface OrderStats {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  pendingCount: number;
  fulfilledCount: number;
  /** Revenue per day for the last 14 days, oldest first. */
  trend: Array<{ date: string; revenue: number }>;
}

const clone = <T>(value: T): T => structuredClone(value);

export const memoryOrderRepository: OrderRepository = {
  async create(input) {
    const now = new Date().toISOString();
    const order: Order = {
      id: createId('ord'),
      reference: createOrderReference(),
      email: input.email,
      status: 'pending',
      paymentStatus: 'requires_payment',
      shippingAddress: input.shippingAddress,
      shippingMethod: input.shippingMethod,
      lines: input.lines,
      totals: input.totals,
      createdAt: now,
      updatedAt: now,
    };

    if (input.phone) order.phone = input.phone;
    if (input.couponCode) order.couponCode = input.couponCode;
    if (input.notes) order.notes = input.notes;

    store.orders.unshift(order);
    upsertCustomer(order);
    return clone(order);
  },

  async findById(id) {
    const found = store.orders.find((order) => order.id === id);
    return found ? clone(found) : null;
  },

  async findByReference(reference) {
    const normalised = reference.trim().toUpperCase();
    const found = store.orders.find((order) => order.reference === normalised);
    return found ? clone(found) : null;
  },

  async list(filter = {}) {
    let orders = [...store.orders];
    if (filter.status) orders = orders.filter((order) => order.status === filter.status);
    if (filter.email) {
      const email = filter.email.toLowerCase();
      orders = orders.filter((order) => order.email.toLowerCase() === email);
    }
    orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return clone(filter.limit ? orders.slice(0, filter.limit) : orders);
  },

  async updateStatus(id, status) {
    const order = store.orders.find((candidate) => candidate.id === id);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (status === 'refunded') order.paymentStatus = 'failed';
    if (status === 'paid' || status === 'fulfilled') order.paymentStatus = 'succeeded';
    return clone(order);
  },

  async attachPaymentIntent(id, paymentIntentId) {
    const order = store.orders.find((candidate) => candidate.id === id);
    if (!order) return null;

    order.paymentIntentId = paymentIntentId;
    order.paymentStatus = 'processing';
    order.updatedAt = new Date().toISOString();
    return clone(order);
  },

  async markPaid(id, paymentIntentId) {
    const order = store.orders.find((candidate) => candidate.id === id);
    if (!order) return null;

    order.status = 'paid';
    order.paymentStatus = 'succeeded';
    if (paymentIntentId) order.paymentIntentId = paymentIntentId;
    order.updatedAt = new Date().toISOString();
    return clone(order);
  },

  async stats() {
    // Cancelled and refunded orders are excluded from revenue, not from history.
    const billable = store.orders.filter(
      (order) => order.status !== 'cancelled' && order.status !== 'refunded',
    );
    const revenue = billable.reduce((sum, order) => sum + order.totals.total, 0);

    const trend: Array<{ date: string; revenue: number }> = [];
    for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
      const day = new Date();
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - daysAgo);
      const key = day.toISOString().slice(0, 10);
      trend.push({
        date: key,
        revenue: billable
          .filter((order) => order.createdAt.slice(0, 10) === key)
          .reduce((sum, order) => sum + order.totals.total, 0),
      });
    }

    return {
      revenue,
      orderCount: store.orders.length,
      averageOrderValue: billable.length ? Math.round(revenue / billable.length) : 0,
      pendingCount: store.orders.filter((order) => order.status === 'pending').length,
      fulfilledCount: store.orders.filter((order) => order.status === 'fulfilled').length,
      trend,
    };
  },
};

/** Keeps the customer aggregate in step with new orders. */
function upsertCustomer(order: Order): void {
  const existing = store.customers.find(
    (customer) => customer.email.toLowerCase() === order.email.toLowerCase(),
  );

  if (existing) {
    existing.orderCount += 1;
    existing.totalSpent += order.totals.total;
    existing.lastOrderAt = order.createdAt;
    return;
  }

  store.customers.unshift({
    id: createId('cus'),
    email: order.email,
    fullName: order.shippingAddress.fullName,
    city: order.shippingAddress.city,
    orderCount: 1,
    totalSpent: order.totals.total,
    createdAt: order.createdAt,
    lastOrderAt: order.createdAt,
  });
}

export function getOrderRepository(): OrderRepository {
  return memoryOrderRepository;
}
