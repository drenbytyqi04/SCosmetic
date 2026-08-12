import { apiError, apiSuccess, withErrorHandling } from '@/lib/api/response';
import { getProductBySlug, getRelatedProducts } from '@/lib/products/queries';

/** GET /api/products/[slug] — a single product plus its related items. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return apiError('not_found', 'That product does not exist.');
    }

    const related = await getRelatedProducts(slug, 4);

    return apiSuccess(
      { product, related },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  }, 'products:detail');
}
