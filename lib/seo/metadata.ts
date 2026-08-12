import type { Metadata } from 'next';
import { absoluteUrl, getBaseUrl, siteConfig } from '@/lib/config/site';
import { truncate } from '@/lib/utils/format';

/**
 * Metadata builders.
 *
 * Every page composes its metadata from here so titles, canonicals and social cards
 * stay consistent — and so a new page cannot forget the Open Graph block.
 */

const DEFAULT_OG_IMAGE = '/images/editorial/og.png';

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Path only, e.g. `/shop`. Used for the canonical URL. */
  path: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  /** Set for filtered/paginated views that should not compete in the index. */
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  type = 'website',
  noIndex = false,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const trimmedDescription = truncate(description, 160);
  const ogImage = {
    url: absoluteUrl(image),
    width: 1200,
    height: 630,
    alt: imageAlt ?? title,
  };

  return {
    title,
    description: trimmedDescription,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title: `${title} | ${siteConfig.name}`,
      description: trimmedDescription,
      siteName: siteConfig.name,
      locale: 'en_GB',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description: trimmedDescription,
      images: [ogImage.url],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Root metadata, inherited by every page via the template. */
export const rootMetadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'cosmetics Kosovo',
    'beauty Prishtina',
    'skincare Kosovo',
    'makeup online Kosovo',
    'prestige beauty',
    'fragrance Kosovo',
  ],
  authors: [{ name: siteConfig.legalName }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  formatDetection: { telephone: false, address: false, email: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: getBaseUrl(),
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    locale: 'en_GB',
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — curated prestige beauty`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  // Icons are handled by the file convention (app/icon.svg), so they are not
  // declared here — declaring both would emit duplicate <link> tags.
};
