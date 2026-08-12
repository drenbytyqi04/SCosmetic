import Image from 'next/image';
import { Instagram } from 'lucide-react';
import { SectionHeading } from '@/components/shared/section-heading';
import { siteConfig } from '@/lib/config/site';
import { imageSizes } from '@/lib/utils/image';

/**
 * Instagram strip.
 *
 * Deliberately not an embedded Instagram widget: those load third-party scripts,
 * track visitors and break when the API changes. This is our own imagery linking out
 * to the profile — the same visual cue, none of the cost.
 *
 * Swap `posts` for a server-side fetch of the Instagram Basic Display API when a
 * long-lived token is configured; the layout does not need to change.
 */
const posts = Array.from({ length: 6 }, (_, index) => ({
  src: `/images/instagram/post-${index + 1}.png`,
  alt: `Editorial still life from the ${siteConfig.instagramHandle} feed`,
}));

export function InstagramGallery() {
  return (
    <section aria-labelledby="instagram-heading" className="container-page py-16 lg:py-24">
      <SectionHeading
        eyebrow="On Instagram"
        title={siteConfig.instagramHandle}
        description="Shade swatches, restock notices and honest reviews — most of our shade matching happens in the DMs."
        align="center"
        className="mb-10"
      />

      <ul className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
        {posts.map((post) => (
          <li key={post.src}>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-sm bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Image
                src={post.src}
                alt={post.alt}
                fill
                sizes={imageSizes.instagram}
                loading="lazy"
                className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 group-hover:bg-ink/25 group-hover:opacity-100 group-focus-visible:bg-ink/25 group-focus-visible:opacity-100">
                <Instagram className="size-5 text-cream-50" aria-hidden="true" />
                <span className="sr-only">
                  Open {siteConfig.instagramHandle} on Instagram (new tab)
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
