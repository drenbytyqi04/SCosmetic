import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/config/site';
import { getCategories, getProducts } from '@/lib/products/queries';

/**
 * Sitemap, generated from the live catalogue.
 *
 * Product entries carry their real `updatedAt`, so a crawler can tell which pages
 * have actually changed rather than re-fetching everything.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, { items: products }] = await Promise.all([
    getCategories(),
    getProducts({ perPage: 1000 }),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/shop'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    {
      url: absoluteUrl('/categories'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/category/${category.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/products/${product.slug}`),
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
