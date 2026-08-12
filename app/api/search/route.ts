import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, withErrorHandling } from '@/lib/api/response';
import { searchProducts } from '@/lib/products/queries';

/**
 * GET /api/search?q=&limit=
 *
 * Powers the header type-ahead. Returns a deliberately narrow projection — enough to
 * render a suggestion row, and nothing more.
 */
const querySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const parsed = querySchema.safeParse({
      q: request.nextUrl.searchParams.get('q') ?? '',
      limit: request.nextUrl.searchParams.get('limit') ?? undefined,
    });

    // An empty or overlong query is not an error for a type-ahead — it just has
    // nothing to suggest yet.
    if (!parsed.success) return apiSuccess({ products: [], query: '' });

    const results = await searchProducts(parsed.data.q, parsed.data.limit);

    return apiSuccess(
      {
        query: parsed.data.q,
        products: results.map((product) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          price: product.price,
          ...(product.salePrice !== undefined ? { salePrice: product.salePrice } : {}),
          image: product.images[0] ?? '/images/editorial/og.png',
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } },
    );
  }, 'search');
}
