'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { CartButton } from '@/components/layout/cart-button';
import { WishlistLink } from '@/components/layout/wishlist-link';
import { SearchBar } from '@/components/products/search-bar';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { mainNav, siteConfig } from '@/lib/config/site';
import { cn } from '@/lib/utils/cn';
import type { Category } from '@/types';

/**
 * Primary navigation.
 *
 * A Client Component because it needs the current path for active states and local
 * state for the mobile and search panels. Categories are passed in from the server so
 * the nav reflects the live catalogue without fetching on the client.
 */
export function Navbar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Close both panels on navigation. Adjusting state during render on a changed
  // input is React's documented pattern for this — an effect would cause a second
  // render pass with the panel still visibly open.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }

  // A subtle border and shadow once the page moves, so the header separates from
  // content without being heavy at rest.
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    const [path] = href.split('?');
    if (!path) return false;
    if (path === '/shop') return pathname === '/shop' && !href.includes('?');
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-cream-100/95 backdrop-blur-md transition-shadow duration-300',
        isScrolled ? 'border-b border-border shadow-soft' : 'border-b border-transparent',
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4 lg:h-20">
          {/* Mobile: menu trigger */}
          <div className="flex items-center gap-1 lg:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10"
                >
                  <Menu className="size-[18px]" aria-hidden="true" />
                </button>
              </SheetTrigger>

              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle className="text-lg tracking-[0.2em]">{siteConfig.name}</SheetTitle>
                </SheetHeader>

                <SheetBody className="flex flex-col gap-8">
                  <SearchBar onNavigate={() => setIsMenuOpen(false)} />

                  <nav aria-label="Main">
                    <ul className="flex flex-col">
                      {mainNav.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block border-b border-border py-3.5 font-serif text-xl font-light text-foreground transition-colors hover:text-espresso-500"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div>
                    <p className="eyebrow mb-3 block">Shop by category</p>
                    <ul className="flex flex-col gap-0.5">
                      {categories.map((category) => (
                        <li key={category.slug}>
                          <Link
                            href={`/category/${category.slug}`}
                            className="flex items-baseline justify-between gap-3 py-2 text-sm text-foreground transition-colors hover:text-champagne-500"
                          >
                            {category.name}
                            <span className="text-xs text-muted-foreground">
                              {category.tagline}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SheetBody>

                <SheetFooter>
                  <p className="text-xs text-muted-foreground">
                    {siteConfig.address.city} · {siteConfig.openingHours}
                  </p>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Wordmark */}
          <Link
            href="/"
            aria-label={`${siteConfig.name} — home`}
            className="shrink-0 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring lg:mr-4"
          >
            {/*
              The wordmark's letter-spacing is what drives the header's minimum
              width, so both the size and the tracking step up with the viewport —
              at 320px the full 0.22em tracking would push the action buttons off
              the right edge.
            */}
            <span className="font-serif text-[0.9375rem] leading-none font-normal tracking-[0.14em] text-foreground sm:text-xl sm:tracking-[0.18em] lg:text-2xl lg:tracking-[0.22em]">
              COSMETICS
              <span className="text-champagne-500">.KS</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'relative py-2 text-xs font-medium tracking-[0.12em] uppercase transition-colors',
                      'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-espresso-900 after:transition-transform after:duration-300 hover:after:scale-x-100',
                      isActive(item.href)
                        ? 'text-foreground after:scale-x-100'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Desktop inline search */}
          <div className="ml-auto hidden max-w-xs flex-1 xl:block">
            <SearchBar placeholder="Search" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 lg:ml-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen((open) => !open)}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={isSearchOpen}
              className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-10 xl:hidden"
            >
              {isSearchOpen ? (
                <X className="size-[18px]" aria-hidden="true" />
              ) : (
                <Search className="size-[18px]" aria-hidden="true" />
              )}
            </button>

            <WishlistLink className="hidden sm:flex" />
            <CartButton />
          </div>
        </div>

        {/* Collapsible search row for tablet and mobile */}
        {isSearchOpen && (
          <div className="animate-in slide-in-from-top-2 fade-in border-t border-border py-3 duration-200 xl:hidden">
            <SearchBar autoFocus onNavigate={() => setIsSearchOpen(false)} />
          </div>
        )}
      </div>
    </header>
  );
}
