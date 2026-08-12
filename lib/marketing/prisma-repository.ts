import 'server-only';

import { getPrisma } from '@/lib/db/prisma';
import type {
  ContactRepository,
  CustomerRepository,
  NewsletterRepository,
} from '@/lib/marketing/repository';
import type { ContactMessage, Customer, NewsletterSubscriber } from '@/types';

/** Postgres implementations of the newsletter list, contact inbox and customer view. */

export const prismaNewsletterRepository: NewsletterRepository = {
  async subscribe({ email, source }) {
    const existing = await getPrisma().newsletterSubscriber.findUnique({ where: { email } });

    /*
     * Re-subscribing is a success, not an error — and the caller is told nothing that
     * would let it distinguish the two, so this endpoint cannot be used to test whether
     * an address is already a customer.
     */
    if (existing) {
      return { subscriber: toSubscriber(existing), alreadySubscribed: true };
    }

    const created = await getPrisma().newsletterSubscriber.create({ data: { email, source } });
    return { subscriber: toSubscriber(created), alreadySubscribed: false };
  },

  async list() {
    const rows = await getPrisma().newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toSubscriber);
  },

  async remove(id) {
    const { count } = await getPrisma().newsletterSubscriber.deleteMany({ where: { id } });
    return count > 0;
  },
};

export const prismaContactRepository: ContactRepository = {
  async create(input) {
    const row = await getPrisma().contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
      },
    });
    return toMessage(row);
  },

  async list() {
    const rows = await getPrisma().contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toMessage);
  },

  async markHandled(id, handled) {
    // updateMany rather than update: a missing row is a null result, not an exception.
    const { count } = await getPrisma().contactMessage.updateMany({ where: { id }, data: { handled } });
    if (count === 0) return null;

    const row = await getPrisma().contactMessage.findUnique({ where: { id } });
    return row ? toMessage(row) : null;
  },
};

export const prismaCustomerRepository: CustomerRepository = {
  async list() {
    /*
     * `orderCount` and `totalSpent` are aggregates over orders rather than stored
     * counters, so they cannot drift out of step with the orders themselves. Cancelled
     * and refunded orders are excluded from spend for the same reason the dashboard
     * excludes them from revenue.
     */
    const rows = await getPrisma().customer.findMany({
      include: {
        orders: {
          where: { status: { notIn: ['cancelled', 'refunded'] } },
          select: { total: true },
        },
      },
    });

    return rows
      .map(toCustomer)
      .sort((a, b) => b.totalSpent - a.totalSpent || a.email.localeCompare(b.email));
  },

  async findByEmail(email) {
    const row = await getPrisma().customer.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        orders: {
          where: { status: { notIn: ['cancelled', 'refunded'] } },
          select: { total: true },
        },
      },
    });
    return row ? toCustomer(row) : null;
  },
};

/* ------------------------------------------------------------------ *
 * Row mappers
 * ------------------------------------------------------------------ */

function toSubscriber(row: {
  id: string;
  email: string;
  source: NewsletterSubscriber['source'];
  confirmed: boolean;
  createdAt: Date;
}): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    source: row.source,
    confirmed: row.confirmed,
    createdAt: row.createdAt.toISOString(),
  };
}

function toMessage(row: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: Date;
}): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    handled: row.handled,
    createdAt: row.createdAt.toISOString(),
  };
}

function toCustomer(row: {
  id: string;
  email: string;
  fullName: string;
  city: string | null;
  createdAt: Date;
  lastOrderAt: Date | null;
  orders: Array<{ total: number }>;
}): Customer {
  const customer: Customer = {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    orderCount: row.orders.length,
    totalSpent: row.orders.reduce((sum, order) => sum + order.total, 0),
    createdAt: row.createdAt.toISOString(),
  };

  if (row.city !== null) customer.city = row.city;
  if (row.lastOrderAt !== null) customer.lastOrderAt = row.lastOrderAt.toISOString();

  return customer;
}
