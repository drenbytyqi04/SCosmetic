import { absoluteUrl, siteConfig } from '@/lib/config/site';
import { centsToAmount } from '@/lib/utils/format';
import type { Category, Order, Product } from '@/types';

/**
 * schema.org payloads.
 *
 * Emitted as JSON-LD by `<StructuredData />`. Everything is derived from real data —
 * ratings and stock come from the product record, so the markup can never claim
 * something the page does not show.
 */

type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${absoluteUrl('/')}#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/images/editorial/og.png'),
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.country,
    },
    sameAs: [siteConfig.social.instagram, siteConfig.social.tiktok, siteConfig.social.facebook],
  };
}

export function websiteSchema(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    name: siteConfig.name,
    url: absoluteUrl('/'),
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
    inLanguage: 'en-GB',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/shop')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productSchema(product: Product): Json {
  const price = product.salePrice ?? product.price;

  const schema: Json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/products/${product.slug}`)}#product`,
    name: product.name,
    description: product.description,
    sku: product.id,
    image: product.images.map((image) => absoluteUrl(image)),
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category,
    ...(product.size ? { size: product.size } : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: siteConfig.currency,
      price: centsToAmount(price),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${absoluteUrl('/')}#organization` },
    },
  };

  // Only emit review markup when there are actual reviews behind it.
  if (product.rating && product.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function collectionSchema(options: {
  name: string;
  description: string;
  path: string;
  products: Product[];
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.products.length,
      itemListElement: options.products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/products/${product.slug}`),
        name: product.name,
      })),
    },
  };
}

export function categorySchema(category: Category, products: Product[]): Json {
  return collectionSchema({
    name: category.name,
    description: category.description,
    path: `/category/${category.slug}`,
    products,
  });
}

export function orderSchema(order: Order): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Order',
    orderNumber: order.reference,
    orderStatus:
      order.status === 'fulfilled'
        ? 'https://schema.org/OrderDelivered'
        : 'https://schema.org/OrderProcessing',
    priceCurrency: siteConfig.currency,
    price: centsToAmount(order.totals.total),
    seller: { '@id': `${absoluteUrl('/')}#organization` },
  };
}

export function faqSchema(entries: Array<{ question: string; answer: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}
