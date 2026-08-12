import Link from 'next/link';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { Separator } from '@/components/ui/separator';
import { footerNav, siteConfig } from '@/lib/config/site';

/**
 * Site footer. Server-rendered apart from the newsletter form, which is the only
 * interactive element here.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border bg-cream-200/70 lg:mt-28">
      <div className="container-page py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand + newsletter */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div>
              <p className="font-serif text-xl leading-none tracking-[0.22em] text-foreground">
                COSMETICS<span className="text-champagne-500">.KS</span>
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {siteConfig.description}
              </p>
            </div>

            <div className="max-w-sm">
              <h2 className="mb-1 font-serif text-lg font-light text-foreground">
                Join the list
              </h2>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                New arrivals, restocks and the occasional honest review. No more than twice a
                month.
              </p>
              <NewsletterForm source="footer" />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 lg:col-start-7">
            {footerNav.map((group) => (
              <nav key={group.title} aria-labelledby={`footer-${group.title}`}>
                <h2
                  id={`footer-${group.title}`}
                  className="mb-4 text-[0.6875rem] font-medium tracking-[0.16em] text-foreground uppercase"
                >
                  {group.title}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <address className="flex flex-col gap-2.5 text-sm text-muted-foreground not-italic">
            <span className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-champagne-500" aria-hidden="true" />
              {siteConfig.address.street}, {siteConfig.address.postalCode}{' '}
              {siteConfig.address.city}, {siteConfig.address.country}
            </span>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-2.5 transition-colors hover:text-foreground"
            >
              <Mail className="size-4 shrink-0 text-champagne-500" aria-hidden="true" />
              {siteConfig.email}
            </a>
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2.5 transition-colors hover:text-foreground"
            >
              <Phone className="size-4 shrink-0 text-champagne-500" aria-hidden="true" />
              {siteConfig.phone}
            </a>
          </address>

          <div className="flex flex-col gap-4 lg:items-end">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Instagram className="size-4 text-champagne-500" aria-hidden="true" />
              {siteConfig.instagramHandle}
              <span className="sr-only">(opens in a new tab)</span>
            </a>

            <p className="text-xs text-muted-foreground/80">
              © {year} {siteConfig.legalName}. All rights reserved.
            </p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground/70 lg:text-right">
              Prices include VAT where applicable. Product imagery on this site is
              placeholder artwork pending final photography.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
