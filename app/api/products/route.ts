import type { NextRequest } from 'next/server';
import { apiError, apiSuccess, withErrorHandling } from '@/lib/api/response';
import { getProducts, getProductsByIds } from '@/lib/products/queries';
import { parseProductQuery, type RawSearchParams } from '@/lib/validations/product-query';

/**
 * GET /api/products
 *
 * Two modes:
 *   ?ids=prd_1,prd_2   — resolve specific products (used by the wishlist)
 *   ?q=&category=&…    — the same filter grammar as /shop
 *
 * Read-only and public, so it is safe to cache at the edge for a short window.
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const searchParams = request.nextUrl.searchParams;

    const idsParam = searchParams.get('ids');
    if (idsParam !== null) {
      const ids = idsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 100);

      if (!ids.length) return apiSuccess({ products: [] });

      const products = await getProductsByIds(ids);
      return apiSuccess({ products }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const raw: RawSearchParams = {};
    for (const [key, value] of searchParams.entries()) raw[key] = value;

    const query = parseProductQuery(raw);
    if ((query.perPage ?? 0) > 100) {
      return apiError('bad_request', 'perPage cannot exceed 100.');
    }

    const result = await getProducts(query);

    return apiSuccess(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  }, 'products:list');
}
