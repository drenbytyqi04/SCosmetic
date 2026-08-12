import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/config/site';

/**
 * robots.txt.
 *
 * The admin area, API routes and transactional pages are excluded — none of them
 * should ever appear in an index, and the checkout/cart pages have no crawl value.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/checkout', '/cart', '/wishlist'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
