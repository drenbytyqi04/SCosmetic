import { commerceConfig, siteConfig } from '@/lib/config/site';
import { formatPriceCompact } from '@/lib/utils/format';

/**
 * Thin promotional strip above the header. Static, server-rendered, no JavaScript —
 * a rotating carousel here would cost more than it earns.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-espresso-900 text-cream-100">
      <div className="container-page flex items-center justify-center gap-x-6 py-2.5 text-center">
        <p className="text-[0.6875rem] tracking-[0.14em] uppercase">
          Free delivery over {formatPriceCompact(commerceConfig.freeShippingThreshold)}
        </p>
        <span aria-hidden="true" className="hidden text-champagne-400 sm:inline">
          ·
        </span>
        <p className="hidden text-[0.6875rem] tracking-[0.14em] uppercase sm:block">
          Same-day dispatch from {siteConfig.address.city}
        </p>
      </div>
    </div>
  );
}
