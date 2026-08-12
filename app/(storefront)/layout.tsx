import { CartDrawer } from '@/components/cart/cart-drawer';
import { Footer } from '@/components/layout/footer';
import { SiteHeader } from '@/components/layout/site-header';
import { StructuredData } from '@/components/shared/structured-data';
import { organizationSchema, websiteSchema } from '@/lib/seo/structured-data';

/**
 * Storefront shell.
 *
 * Everything a shopper sees: the announcement bar, header, footer, the cart drawer
 * and the site-wide structured data. The admin area sits outside this group and gets
 * none of it.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="flex-1">
        {children}
      </main>

      <Footer />

      {/* Mounted once, opened from anywhere via the cart store. */}
      <CartDrawer />

      <StructuredData data={[organizationSchema(), websiteSchema()]} />
    </div>
  );
}
