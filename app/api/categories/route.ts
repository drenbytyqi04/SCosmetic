import { apiSuccess, withErrorHandling } from '@/lib/api/response';
import { getCategories, getCategoryCounts } from '@/lib/products/queries';

/** GET /api/categories — the taxonomy with live product counts. */
export async function GET() {
  return withErrorHandling(async () => {
    const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()]);

    return apiSuccess(
      { categories, counts },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  }, 'categories:list');
}
