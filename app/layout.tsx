import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { rootMetadata } from '@/lib/seo/metadata';
import './globals.css';

/**
 * Root layout.
 *
 * Deliberately minimal: the document shell, the fonts and the toast host. The
 * storefront chrome (header, footer, cart drawer) belongs to the `(storefront)`
 * route group, so the admin area and its sign-in page are not wrapped in a shop
 * header and newsletter footer they have no business showing.
 */

/**
 * Fonts are self-hosted by next/font at build time — no runtime request to Google,
 * no layout shift, and `display: swap` so text is never invisible while loading.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Zoom stays available — capping it would fail WCAG 1.4.4.
  maximumScale: 5,
  themeColor: '#FBF7F2',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-svh">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
