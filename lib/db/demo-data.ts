import type {
  ContactMessage,
  Coupon,
  Customer,
  NewsletterSubscriber,
  Order,
} from '@/types';

/**
 * Sample transactional data: orders, customers, subscribers, contact messages and
 * discount codes.
 *
 * Shared by the in-memory store and `prisma/seed.ts` so there is one copy rather than
 * two that drift. The coupons are real configuration a store would want; the orders,
 * customers and messages are illustrative, which is why the Postgres seed leaves them
 * out unless SEED_DEMO_DATA=1 is set.
 */

export const demoOrders: Order[] = [
  {
    id: 'ord_1001',
    reference: 'KS-4A19C7',
    email: 'arta.k@example.com',
    phone: '+383 44 111 222',
    status: 'fulfilled',
    paymentStatus: 'succeeded',
    shippingAddress: {
      fullName: 'Arta Krasniqi',
      line1: 'Rr. Luan Haradinaj 22',
      city: 'Prishtina',
      postalCode: '10000',
      country: 'Kosovo',
    },
    shippingMethod: 'standard',
    lines: [
      {
        productId: 'prd_009',
        slug: 'ceramide-barrier-repair-cream',
        name: 'Ceramide Barrier Repair Cream',
        unitPrice: 3800,
        quantity: 1,
        image: '/images/products/ceramide-barrier-repair-cream-1.png',
      },
      {
        productId: 'prd_001',
        slug: 'velvet-rose-lip-oil',
        name: 'Velvet Rose Lip Oil',
        shadeName: 'Rosewater',
        unitPrice: 2200,
        quantity: 2,
        image: '/images/products/velvet-rose-lip-oil-1.png',
      },
    ],
    totals: {
      subtotal: 8200,
      discount: 0,
      shipping: 0,
      tax: 1476,
      total: 9676,
      itemCount: 3,
      freeShippingRemaining: 0,
    },
    createdAt: '2026-06-02T14:12:00.000Z',
    updatedAt: '2026-06-04T08:40:00.000Z',
  },
  {
    id: 'ord_1002',
    reference: 'KS-8B21D3',
    email: 'elira.m@example.com',
    status: 'paid',
    paymentStatus: 'succeeded',
    shippingAddress: {
      fullName: 'Elira Musliu',
      line1: 'Rr. Nëna Terezë 4',
      line2: 'Apt 12',
      city: 'Prizren',
      postalCode: '20000',
      country: 'Kosovo',
    },
    shippingMethod: 'express',
    lines: [
      {
        productId: 'prd_020',
        slug: 'amber-cashmere-eau-de-parfum',
        name: 'Amber Cashmere Eau de Parfum',
        unitPrice: 8900,
        quantity: 1,
        image: '/images/products/amber-cashmere-eau-de-parfum-1.png',
      },
    ],
    totals: {
      subtotal: 8900,
      discount: 890,
      shipping: 700,
      tax: 1441,
      total: 10151,
      itemCount: 1,
      freeShippingRemaining: 0,
    },
    couponCode: 'WELCOME10',
    createdAt: '2026-06-07T10:05:00.000Z',
    updatedAt: '2026-06-07T10:06:00.000Z',
  },
  {
    id: 'ord_1003',
    reference: 'KS-C7F204',
    email: 'blerta.s@example.com',
    status: 'pending',
    paymentStatus: 'requires_payment',
    shippingAddress: {
      fullName: 'Blerta Shala',
      line1: 'Rr. Fehmi Agani 8',
      city: 'Gjakova',
      postalCode: '50000',
      country: 'Kosovo',
    },
    shippingMethod: 'standard',
    lines: [
      {
        productId: 'prd_005',
        slug: 'second-skin-serum-foundation',
        name: 'Second Skin Serum Foundation',
        shadeName: '5O Sand',
        unitPrice: 4200,
        quantity: 1,
        image: '/images/products/second-skin-serum-foundation-1.png',
      },
      {
        productId: 'prd_022',
        slug: 'sculpting-foundation-brush',
        name: 'Sculpting Foundation Brush',
        unitPrice: 2800,
        quantity: 1,
        image: '/images/products/sculpting-foundation-brush-1.png',
      },
    ],
    totals: {
      subtotal: 7000,
      discount: 0,
      shipping: 0,
      tax: 1260,
      total: 8260,
      itemCount: 2,
      freeShippingRemaining: 0,
    },
    createdAt: '2026-06-09T18:22:00.000Z',
    updatedAt: '2026-06-09T18:22:00.000Z',
  },
];

export const demoCustomers: Customer[] = [
  {
    id: 'cus_001',
    email: 'arta.k@example.com',
    fullName: 'Arta Krasniqi',
    city: 'Prishtina',
    orderCount: 4,
    totalSpent: 31240,
    createdAt: '2025-11-03T12:00:00.000Z',
    lastOrderAt: '2026-06-02T14:12:00.000Z',
  },
  {
    id: 'cus_002',
    email: 'elira.m@example.com',
    fullName: 'Elira Musliu',
    city: 'Prizren',
    orderCount: 2,
    totalSpent: 18420,
    createdAt: '2026-02-18T09:30:00.000Z',
    lastOrderAt: '2026-06-07T10:05:00.000Z',
  },
  {
    id: 'cus_003',
    email: 'blerta.s@example.com',
    fullName: 'Blerta Shala',
    city: 'Gjakova',
    orderCount: 1,
    totalSpent: 8260,
    createdAt: '2026-06-09T18:00:00.000Z',
    lastOrderAt: '2026-06-09T18:22:00.000Z',
  },
  {
    id: 'cus_004',
    email: 'donika.h@example.com',
    fullName: 'Donika Hoxha',
    city: 'Peja',
    orderCount: 6,
    totalSpent: 47980,
    createdAt: '2025-08-21T15:45:00.000Z',
    lastOrderAt: '2026-05-28T11:10:00.000Z',
  },
];

export const demoSubscribers: NewsletterSubscriber[] = [
  {
    id: 'sub_001',
    email: 'arta.k@example.com',
    source: 'footer',
    confirmed: true,
    createdAt: '2025-11-03T12:04:00.000Z',
  },
  {
    id: 'sub_002',
    email: 'rina.b@example.com',
    source: 'homepage',
    confirmed: true,
    createdAt: '2026-03-14T08:20:00.000Z',
  },
  {
    id: 'sub_003',
    email: 'vlora.g@example.com',
    source: 'checkout',
    confirmed: false,
    createdAt: '2026-06-05T17:55:00.000Z',
  },
];

export const demoMessages: ContactMessage[] = [
  {
    id: 'msg_001',
    name: 'Lira Berisha',
    email: 'lira.b@example.com',
    subject: 'Shade matching help',
    message:
      'I am between 5O Sand and 8O Amber in the Second Skin foundation. Can you help me choose? I have a neutral-olive undertone.',
    handled: false,
    createdAt: '2026-06-08T13:30:00.000Z',
  },
  {
    id: 'msg_002',
    name: 'Endrit Gashi',
    email: 'endrit.g@example.com',
    subject: 'Delivery to Mitrovica',
    message: 'How long does standard delivery take to Mitrovica?',
    handled: true,
    createdAt: '2026-06-03T09:15:00.000Z',
  },
];

export const demoCoupons: Coupon[] = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: '10% off your first order',
    minSubtotal: 3000,
    active: true,
  },
  {
    code: 'GLOW20',
    type: 'percentage',
    value: 20,
    description: '20% off orders over €80',
    minSubtotal: 8000,
    active: true,
  },
  {
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    description: 'Free standard delivery',
    active: true,
  },
  {
    code: 'RITUAL5',
    type: 'fixed',
    value: 500,
    description: '€5 off any order',
    minSubtotal: 2500,
    active: true,
  },
  {
    code: 'SPRING26',
    type: 'percentage',
    value: 15,
    description: 'Expired spring promotion',
    expiresAt: '2026-04-30T23:59:59.000Z',
    active: false,
  },
];
