import 'server-only';

import { createId, store } from '@/lib/db/store';
import { isPrismaDataSource } from '@/lib/products/repository';
import {
  prismaContactRepository,
  prismaCustomerRepository,
  prismaNewsletterRepository,
} from '@/lib/marketing/prisma-repository';
import type { ContactMessage, Customer, NewsletterSubscriber } from '@/types';

/** Newsletter list, contact inbox and the customer aggregate. */

export interface NewsletterRepository {
  subscribe(input: {
    email: string;
    source: NewsletterSubscriber['source'];
  }): Promise<{ subscriber: NewsletterSubscriber; alreadySubscribed: boolean }>;
  list(): Promise<NewsletterSubscriber[]>;
  remove(id: string): Promise<boolean>;
}

export interface ContactRepository {
  create(input: Omit<ContactMessage, 'id' | 'createdAt' | 'handled'>): Promise<ContactMessage>;
  list(): Promise<ContactMessage[]>;
  markHandled(id: string, handled: boolean): Promise<ContactMessage | null>;
}

export interface CustomerRepository {
  list(): Promise<Customer[]>;
  findByEmail(email: string): Promise<Customer | null>;
}

const clone = <T>(value: T): T => structuredClone(value);

export const memoryNewsletterRepository: NewsletterRepository = {
  async subscribe({ email, source }) {
    const existing = store.subscribers.find(
      (subscriber) => subscriber.email.toLowerCase() === email.toLowerCase(),
    );

    // Re-subscribing is a success from the visitor's point of view — never an error,
    // and never a signal that reveals whether the address is already on the list.
    if (existing) return { subscriber: clone(existing), alreadySubscribed: true };

    const subscriber: NewsletterSubscriber = {
      id: createId('sub'),
      email,
      source,
      confirmed: false,
      createdAt: new Date().toISOString(),
    };
    store.subscribers.unshift(subscriber);
    return { subscriber: clone(subscriber), alreadySubscribed: false };
  },

  async list() {
    return clone(
      [...store.subscribers].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    );
  },

  async remove(id) {
    const index = store.subscribers.findIndex((subscriber) => subscriber.id === id);
    if (index === -1) return false;
    store.subscribers.splice(index, 1);
    return true;
  },
};

export const memoryContactRepository: ContactRepository = {
  async create(input) {
    const message: ContactMessage = {
      ...input,
      id: createId('msg'),
      handled: false,
      createdAt: new Date().toISOString(),
    };
    store.messages.unshift(message);
    return clone(message);
  },

  async list() {
    return clone(
      [...store.messages].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    );
  },

  async markHandled(id, handled) {
    const message = store.messages.find((candidate) => candidate.id === id);
    if (!message) return null;
    message.handled = handled;
    return clone(message);
  },
};

export const memoryCustomerRepository: CustomerRepository = {
  async list() {
    return clone(
      [...store.customers].sort((a, b) => b.totalSpent - a.totalSpent),
    );
  },

  async findByEmail(email) {
    const found = store.customers.find(
      (customer) => customer.email.toLowerCase() === email.toLowerCase(),
    );
    return found ? clone(found) : null;
  },
};

export function getNewsletterRepository(): NewsletterRepository {
  return isPrismaDataSource() ? prismaNewsletterRepository : memoryNewsletterRepository;
}

export function getContactRepository(): ContactRepository {
  return isPrismaDataSource() ? prismaContactRepository : memoryContactRepository;
}

export function getCustomerRepository(): CustomerRepository {
  return isPrismaDataSource() ? prismaCustomerRepository : memoryCustomerRepository;
}
