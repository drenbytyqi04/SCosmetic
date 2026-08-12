/**
 * Seeds the catalogue into Postgres.
 *
 *   npx prisma db seed
 *
 * Idempotent: every write is an upsert keyed on the natural key (slug, code), so
 * re-running updates rather than duplicating. Safe to run on every deploy.
 *
 * Catalogue content comes from the same files the in-memory store used, so there is
 * one source of truth for seed data rather than a second copy drifting in SQL.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '../lib/db/generated/client';
import { categories } from '../lib/products/data/categories';
import { products } from '../lib/products/data/products';
import { demoCoupons, demoCustomers, demoMessages, demoOrders, demoSubscribers } from '../lib/db/demo-data';

loadEnv({ path: ['.env.local', '.env'], quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed. See .env.example.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedCatalogue() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        tagline: category.tagline,
        description: category.description,
        image: category.image,
        position: category.position,
      },
      update: {
        name: category.name,
        tagline: category.tagline,
        description: category.description,
        image: category.image,
        position: category.position,
      },
    });
  }
  process.stdout.write(`  ${categories.length} categories\n`);

  for (const product of products) {
    const data = {
      name: product.name,
      brand: product.brand,
      categorySlug: product.category,
      tagline: product.tagline,
      description: product.description,
      details: product.details,
      howToUse: product.howToUse ?? null,
      price: product.price,
      salePrice: product.salePrice ?? null,
      images: product.images,
      ingredients: product.ingredients ?? [],
      benefits: product.benefits ?? [],
      rating: product.rating ?? null,
      reviewCount: product.reviewCount ?? 0,
      stock: product.stock,
      size: product.size ?? null,
      featured: product.featured ?? false,
      bestseller: product.bestseller ?? false,
      newArrival: product.newArrival ?? false,
      createdAt: new Date(product.createdAt),
    };

    await prisma.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, ...data },
      update: data,
    });

    // Shades are replaced wholesale: the seed file is authoritative, and a shade
    // removed from it should disappear rather than linger.
    await prisma.shade.deleteMany({ where: { product: { slug: product.slug } } });
    if (product.shades?.length) {
      const row = await prisma.product.findUniqueOrThrow({
        where: { slug: product.slug },
        select: { id: true },
      });
      await prisma.shade.createMany({
        data: product.shades.map((shade, index) => ({
          productId: row.id,
          key: shade.id,
          name: shade.name,
          hex: shade.hex,
          position: index,
        })),
      });
    }
  }
  process.stdout.write(`  ${products.length} products\n`);
}

async function seedCoupons() {
  for (const coupon of demoCoupons) {
    const data = {
      type: coupon.type,
      value: coupon.value,
      description: coupon.description,
      minSubtotal: coupon.minSubtotal ?? null,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
      active: coupon.active,
    };
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      create: { code: coupon.code, ...data },
      update: data,
    });
  }
  process.stdout.write(`  ${demoCoupons.length} coupons\n`);
}

/**
 * Sample orders, customers, messages and subscribers.
 *
 * Off by default. A real store must not start life with invented orders in its
 * dashboard — enable with SEED_DEMO_DATA=1 when you want a populated admin to look at.
 */
async function seedDemoTransactions() {
  for (const customer of demoCustomers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      create: {
        email: customer.email,
        fullName: customer.fullName,
        city: customer.city ?? null,
        createdAt: new Date(customer.createdAt),
        lastOrderAt: customer.lastOrderAt ? new Date(customer.lastOrderAt) : null,
      },
      update: {},
    });
  }

  for (const order of demoOrders) {
    const existing = await prisma.order.findUnique({ where: { reference: order.reference } });
    if (existing) continue;

    const customer = await prisma.customer.findUnique({ where: { email: order.email } });
    const lineProducts = await prisma.product.findMany({
      where: { slug: { in: order.lines.map((line) => line.slug) } },
      select: { id: true, slug: true },
    });
    const idBySlug = new Map(lineProducts.map((row) => [row.slug, row.id]));

    await prisma.order.create({
      data: {
        reference: order.reference,
        email: order.email,
        phone: order.phone ?? null,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingMethod: order.shippingMethod,
        shippingName: order.shippingAddress.fullName,
        shippingLine1: order.shippingAddress.line1,
        shippingLine2: order.shippingAddress.line2 ?? null,
        shippingCity: order.shippingAddress.city,
        shippingPostalCode: order.shippingAddress.postalCode,
        shippingCountry: order.shippingAddress.country,
        subtotal: order.totals.subtotal,
        discount: order.totals.discount,
        shipping: order.totals.shipping,
        tax: order.totals.tax,
        total: order.totals.total,
        notes: order.notes ?? null,
        couponCode: order.couponCode ?? null,
        customerId: customer?.id ?? null,
        createdAt: new Date(order.createdAt),
        lines: {
          create: order.lines.map((line) => ({
            productId: idBySlug.get(line.slug) ?? null,
            slug: line.slug,
            name: line.name,
            shadeName: line.shadeName ?? null,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            image: line.image,
          })),
        },
      },
    });
  }

  for (const subscriber of demoSubscribers) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: subscriber.email },
      create: {
        email: subscriber.email,
        source: subscriber.source,
        confirmed: subscriber.confirmed,
        createdAt: new Date(subscriber.createdAt),
      },
      update: {},
    });
  }

  for (const message of demoMessages) {
    const already = await prisma.contactMessage.findFirst({
      where: { email: message.email, subject: message.subject },
      select: { id: true },
    });
    if (already) continue;

    await prisma.contactMessage.create({
      data: {
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message,
        handled: message.handled,
        createdAt: new Date(message.createdAt),
      },
    });
  }

  process.stdout.write(
    `  ${demoCustomers.length} customers, ${demoOrders.length} orders, ` +
      `${demoSubscribers.length} subscribers, ${demoMessages.length} messages\n`,
  );
}

async function main() {
  process.stdout.write('Seeding COSMETICS.KS\n');
  await seedCatalogue();
  await seedCoupons();

  if (process.env.SEED_DEMO_DATA === '1') {
    await seedDemoTransactions();
  } else {
    process.stdout.write('  (skipping demo orders — set SEED_DEMO_DATA=1 to include them)\n');
  }

  process.stdout.write('Done.\n');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
